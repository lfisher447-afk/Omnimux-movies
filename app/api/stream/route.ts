import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Node required for chunked stream buffering

// ─── Referrer spoofing map ────────────────────────────────────────────────────
// Maps upstream hostname patterns → the Referer header to send
const REFERER_MAP: [RegExp, string][] = [
  [/googlevideo\.com/,    'https://www.youtube.com/'],
  [/ytimg\.com/,          'https://www.youtube.com/'],
  [/youtube\.com/,        'https://www.youtube.com/'],
  [/fbcdn\.net/,          'https://www.facebook.com/'],
  [/twimg\.com/,          'https://twitter.com/'],
  [/twitch\.tv/,          'https://www.twitch.tv/'],
  [/vidlink\.pro/,        'https://vidlink.pro/'],
  [/vidsrc\.pro/,         'https://vidsrc.pro/'],
  [/vidsrc\.cc/,          'https://vidsrc.cc/'],
  [/vidsrc\.me/,          'https://vidsrc.me/'],
  [/vidsrc\.xyz/,         'https://vidsrc.xyz/'],
  [/embed\.su/,           'https://embed.su/'],
  [/autoembed\.cc/,       'https://autoembed.cc/'],
  [/multiembed\.mov/,     'https://multiembed.mov/'],
  [/2embed\.cc/,          'https://www.2embed.cc/'],
  [/smashy\.stream/,      'https://player.smashy.stream/'],
  [/moviesapi\.club/,     'https://moviesapi.club/'],
  [/akamaized\.net/,      'https://vidsrc.me/'],
  [/cloudfront\.net/,     'https://vidsrc.me/'],
];

function getReferer(url: string): string {
  try {
    const { hostname } = new URL(url);
    for (const [pattern, referer] of REFERER_MAP) {
      if (pattern.test(hostname)) return referer;
    }
    return new URL(url).origin + '/';
  } catch {
    return 'https://vidsrc.me/';
  }
}

// ─── HLS manifest rewriting ───────────────────────────────────────────────────
// Rewrites every segment/key URI to route through our stream proxy so the
// player never makes direct requests to the CDN (which would fail due to CORS).

function rewriteM3U8(content: string, originalUrl: string, proxyOrigin: string): string {
  const lastSlash = originalUrl.lastIndexOf('/');
  const base = lastSlash > 8 ? originalUrl.substring(0, lastSlash + 1) : originalUrl;
  const SP = `${proxyOrigin}/api/stream`;

  return content
    .split('\n')
    .map(line => {
      const trimmed = line.trim();

      // Blank line
      if (!trimmed) return line;

      // EXT-X-KEY URI rewrite (encryption key URL)
      if (trimmed.startsWith('#EXT-X-KEY') || trimmed.startsWith('#EXT-X-MAP')) {
        return line.replace(/URI="([^"]+)"/g, (_, uri) => {
          const abs = uri.startsWith('http') ? uri : base + uri;
          return `URI="${SP}?url=${encodeURIComponent(abs)}"`;
        });
      }

      // EXT-X-MEDIA URI (alternate audio/subtitle renditions)
      if (trimmed.startsWith('#EXT-X-MEDIA') && trimmed.includes('URI=')) {
        return line.replace(/URI="([^"]+)"/g, (_, uri) => {
          const abs = uri.startsWith('http') ? uri : base + uri;
          return `URI="${SP}?url=${encodeURIComponent(abs)}"`;
        });
      }

      // Skip all other tags
      if (trimmed.startsWith('#')) return line;

      // Segment URLs (or sub-manifest URLs)
      const abs = trimmed.startsWith('http') ? trimmed : base + trimmed;
      return `${SP}?url=${encodeURIComponent(abs)}`;
    })
    .join('\n');
}

// ─── DASH manifest rewriting ──────────────────────────────────────────────────

function rewriteMpd(content: string, originalUrl: string, proxyOrigin: string): string {
  const base = new URL(originalUrl);
  const SP = `${proxyOrigin}/api/stream`;

  const resolveUrl = (url: string): string => {
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${base.origin}${url}`;
    return `${base.origin}${base.pathname.replace(/\/[^/]*$/, '/')}${url}`;
  };

  return content
    // BaseURL elements
    .replace(/<BaseURL>([^<]+)<\/BaseURL>/g, (_, url) => {
      const abs = resolveUrl(url.trim());
      return `<BaseURL>${SP}?url=${encodeURIComponent(abs)}</BaseURL>`;
    })
    // initialization attribute
    .replace(/\s+initialization="([^"]+)"/g, (_, url) => {
      const abs = resolveUrl(url);
      return ` initialization="${SP}?url=${encodeURIComponent(abs)}"`;
    })
    // media attribute (only non-template ones)
    .replace(/\s+media="([^"$]+)"/g, (_, url) => {
      const abs = resolveUrl(url);
      return ` media="${SP}?url=${encodeURIComponent(abs)}"`;
    });
}

// ─── Content-type helpers ─────────────────────────────────────────────────────

const HLS_TYPES = new Set([
  'application/x-mpegurl',
  'application/vnd.apple.mpegurl',
  'audio/mpegurl',
  'audio/x-mpegurl',
  'application/mpegurl',
]);

const DASH_TYPES = new Set([
  'application/dash+xml',
  'video/vnd.mpeg.dash.mpd',
]);

function detectManifestType(contentType: string, url: string): 'hls' | 'dash' | null {
  const ct = contentType.split(';')[0].trim().toLowerCase();
  if (HLS_TYPES.has(ct)) return 'hls';
  if (DASH_TYPES.has(ct)) return 'dash';
  const path = url.split('?')[0].toLowerCase();
  if (path.endsWith('.m3u8') || path.endsWith('.m3u')) return 'hls';
  if (path.endsWith('.mpd')) return 'dash';
  return null;
}

// ─── CORS headers builder ─────────────────────────────────────────────────────

function corsBuild(extra: Record<string, string> = {}): Headers {
  const h = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
    'Access-Control-Expose-Headers':
      'Content-Length, Content-Range, Content-Type, Accept-Ranges',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Timing-Allow-Origin': '*',
    ...extra,
  });
  return h;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const proxyOrigin = reqUrl.origin;
  const raw = reqUrl.searchParams.get('url');

  if (!raw) {
    return NextResponse.json({ error: 'Missing ?url parameter' }, { status: 400 });
  }

  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(raw);
    if (!targetUrl.startsWith('http')) throw new Error();
  } catch {
    targetUrl = raw;
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  const rangeHeader = req.headers.get('range');

  const fetchHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity', // avoid gzip so body can be streamed/rewritten
    Origin: parsed.origin,
    Referer: getReferer(targetUrl),
    'Sec-Fetch-Dest': 'video',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'Cache-Control': 'no-cache',
  };

  if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    const upstream = await fetch(parsed.toString(), {
      headers: fetchHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Non-2xx and not partial content
    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        {
          error: `Upstream returned ${upstream.status} ${upstream.statusText}`,
          url: targetUrl,
        },
        { status: upstream.status }
      );
    }

    const rawCt = upstream.headers.get('content-type') || '';
    const manifestType = detectManifestType(rawCt, parsed.toString());

    // ── HLS manifest ──────────────────────────────────────────────────────
    if (manifestType === 'hls') {
      const text = await upstream.text();
      const rewritten = rewriteM3U8(text, parsed.toString(), proxyOrigin);
      const h = corsBuild({ 'Content-Type': 'application/x-mpegurl; charset=utf-8' });
      return new NextResponse(rewritten, { status: 200, headers: h });
    }

    // ── DASH manifest ─────────────────────────────────────────────────────
    if (manifestType === 'dash') {
      const text = await upstream.text();
      const rewritten = rewriteMpd(text, parsed.toString(), proxyOrigin);
      const h = corsBuild({ 'Content-Type': 'application/dash+xml; charset=utf-8' });
      return new NextResponse(rewritten, { status: 200, headers: h });
    }

    // ── Binary / media passthrough ────────────────────────────────────────
    const h = corsBuild();
    if (rawCt) h.set('Content-Type', rawCt);

    const passthroughKeys = [
      'content-length',
      'content-range',
      'accept-ranges',
      'last-modified',
      'etag',
      'cache-control',
    ] as const;
    passthroughKeys.forEach(k => {
      const v = upstream.headers.get(k);
      if (v) h.set(k, v);
    });

    return new NextResponse(upstream.body as BodyInit, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: h,
    });

  } catch (err: any) {
    console.error('[Omnimux:stream]', err.message);
    const isTimeout = err.name === 'AbortError' || err.name === 'TimeoutError';
    return NextResponse.json(
      {
        error: isTimeout ? 'Upstream timed out (60 s)' : 'Stream bridge failed',
        details: err.message,
        url: targetUrl,
      },
      { status: 502 }
    );
  }
}

// Support range-preflight (HEAD)
export async function HEAD(req: Request) {
  const raw = new URL(req.url).searchParams.get('url');
  if (!raw) return new NextResponse(null, { status: 400 });

  try {
    const targetUrl = decodeURIComponent(raw);
    const upstream = await fetch(targetUrl, { method: 'HEAD' });
    const h = corsBuild();
    (['content-type', 'content-length', 'accept-ranges'] as const).forEach(k => {
      const v = upstream.headers.get(k);
      if (v) h.set(k, v);
    });
    return new NextResponse(null, { status: upstream.status, headers: h });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}
