import { NextResponse } from 'next/server';

export const runtime = 'edge';

// ─── Cache TTL per endpoint type ─────────────────────────────────────────────
// Short TTL for trending (changes daily), long TTL for details (rarely change)
const TTL_MAP: [RegExp, number][] = [
  [/\/trending\//,             1800],   // 30 min
  [/\/movie\/\d+$/,           43200],   // 12 hr  — movie details
  [/\/tv\/\d+$/,              43200],   // 12 hr  — TV details
  [/\/search\//,               3600],   // 1 hr
  [/\/discover\//,             3600],   // 1 hr
  [/\/(popular|top_rated|now_playing|upcoming|on_the_air|airing_today)/, 3600],
  [/\/genre\//,               86400],   // 24 hr  — genre list doesn't change
  [/\/configuration/,        604800],   // 7 days
];

function getCacheTtl(endpoint: string): number {
  for (const [pattern, ttl] of TTL_MAP) {
    if (pattern.test(endpoint)) return ttl;
  }
  return 3600; // default 1 hr
}

// ─── Safe fetch with timeout ──────────────────────────────────────────────────
async function tmdbFetch(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      // Edge runtime: revalidate is the CDN cache hint
      next: { revalidate: getCacheTtl(new URL(url).pathname) },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing ?endpoint parameter' }, { status: 400 });
  }

  // Sanitise — must start with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const apiKey = process.env.TMDB_API_KEY || '15d2ea6d0dc1d476efbca3eba2b9bbfb';
  const tmdbUrl = new URL(`https://api.themoviedb.org/3${cleanEndpoint}`);

  // Forward all extra query params (language, page, region, with_genres, …)
  searchParams.forEach((value, key) => {
    if (key !== 'endpoint') tmdbUrl.searchParams.set(key, value);
  });

  // Always inject the key — prefer TMDB v4 Bearer if available
  const bearerToken = process.env.TMDB_BEARER_TOKEN;
  if (!bearerToken) {
    tmdbUrl.searchParams.set('api_key', apiKey);
  }

  try {
    const fetchOptions: RequestInit = bearerToken
      ? { headers: { Authorization: `Bearer ${bearerToken}` } }
      : {};

    const upstream = await tmdbFetch(tmdbUrl.toString());

    if (!upstream.ok) {
      const errBody = await upstream.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'TMDB upstream error', status: upstream.status, details: errBody },
        {
          status: upstream.status,
          headers: { 'Cache-Control': 'no-store' },
        }
      );
    }

    const data = await upstream.json();

    const ttl = getCacheTtl(cleanEndpoint);
    const stale = Math.min(ttl * 24, 86400); // stale-while-revalidate capped at 24 hr

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': `s-maxage=${ttl}, stale-while-revalidate=${stale}`,
        'CDN-Cache-Control': `max-age=${ttl}`,
        'Access-Control-Allow-Origin': '*',
        'X-Omnimux-Cache-TTL': String(ttl),
      },
    });

  } catch (err: any) {
    const isTimeout = err.name === 'AbortError' || err.name === 'TimeoutError';
    return NextResponse.json(
      {
        error: isTimeout ? 'TMDB request timed out' : 'TMDB proxy failed',
        details: err.message,
      },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
