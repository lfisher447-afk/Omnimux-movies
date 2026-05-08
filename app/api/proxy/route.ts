import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROXY_PATH = '/api/proxy';

// ─── helpers ────────────────────────────────────────────────────────────────

const proxify = (absoluteUrl: string) =>
  `${PROXY_PATH}?url=${encodeURIComponent(absoluteUrl)}`;

const tryAbs = (raw: string, base: string): string | null => {
  try {
    if (!raw || raw.startsWith('data:') || raw.startsWith('blob:') || raw.startsWith('#') || raw.startsWith('javascript:') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return null;
    return new URL(raw, base).toString();
  } catch {
    return null;
  }
};

const rewriteAttr = (raw: string, base: string): string => {
  const abs = tryAbs(raw, base);
  if (!abs) return raw;
  return proxify(abs);
};

// rewrite a srcset list:  \"img1.jpg 1x, img2.jpg 2x\"
const rewriteSrcset = (raw: string, base: string): string =>
  raw
    .split(',')
    .map((part) => {
      const s = part.trim();
      const [url, ...rest] = s.split(/\s+/);
      const abs = tryAbs(url, base);
      const finalUrl = abs ? proxify(abs) : url;
      return [finalUrl, ...rest].join(' ');
    })
    .join(', ');

// rewrite css text — url(...) and @import \"...\"
const rewriteCss = (css: string, base: string): string => {
  return css
    .replace(/url\(\s*(['\"]?)([^'\")]+)\1\s*\)/g, (_m, q, raw) => {
      const abs = tryAbs(raw, base);
      return `url(${q}${abs ? proxify(abs) : raw}${q})`;
    })
    .replace(/@import\s+(['\"])([^'\"]+)\1/g, (_m, q, raw) => {
      const abs = tryAbs(raw, base);
      return `@import ${q}${abs ? proxify(abs) : raw}${q}`;
    });
};

// rewrite html — every URL-bearing attribute, plus inline <style>
const rewriteHtml = (html: string, base: string): string => {
  // <base href=\"...\"> — neutralise (we'll inject our own <base>)
  html = html.replace(/<base\b[^>]*>/gi, '');

  // attributes carrying URLs
  const ATTR_RE =
    /\b(href|src|action|formaction|poster|background|cite|data|manifest|ping)\s*=\s*(\"([^\"]*)\"|'([^']*)'|([^\s\"'>=]+))/gi;
  html = html.replace(ATTR_RE, (full, attr, _q, dq, sq, bare) => {
    const value = dq ?? sq ?? bare ?? '';
    const newVal = rewriteAttr(value, base);
    const quote = dq != null ? '\"' : sq != null ? \"'\" : '\"';
    return `${attr}=${quote}${newVal}${quote}`;
  });

  // srcset
  html = html.replace(/\bsrcset\s*=\s*(\"([^\"]*)\"|'([^']*)')/gi, (_m, _q, dq, sq) => {
    const v = dq ?? sq ?? '';
    const quote = dq != null ? '\"' : \"'\";
    return `srcset=${quote}${rewriteSrcset(v, base)}${quote}`;
  });

  // inline style=\"...url(...)...\"
  html = html.replace(/\bstyle\s*=\s*(\"([^\"]*)\"|'([^']*)')/gi, (_m, _q, dq, sq) => {
    const v = dq ?? sq ?? '';
    const quote = dq != null ? '\"' : \"'\";
    return `style=${quote}${rewriteCss(v, base)}${quote}`;
  });

  // <style>...</style> blocks
  html = html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (m, css) =>
    m.replace(css, rewriteCss(css, base))
  );

  // <meta http-equiv=\"refresh\" content=\"0; url=...\">
  html = html.replace(
    /<meta\s+[^>]*http-equiv\s*=\s*[\"']?refresh[\"']?[^>]*content\s*=\s*(\"([^\"]*)\"|'([^']*)')[^>]*>/gi,
    (m, _q, dq, sq) => {
      const v = dq ?? sq ?? '';
      const out = v.replace(/url\s*=\s*([^;]+)/i, (_mm: string, raw: string) => {
        const abs = tryAbs(raw.trim(), base);
        return `url=${abs ? proxify(abs) : raw}`;
      });
      return m.replace(v, out);
    }
  );

  return html;
};

// runtime patch script — injected into the document
const runtimePatch = (origin: string, currentUrl: string) => `
<script data-omnimux-runtime>
(function(){
  if (window.__OMNIMUX_PATCHED__) return;
  window.__OMNIMUX_PATCHED__ = true;

  var ORIGIN = ${JSON.stringify(origin)};
  var CURRENT = ${JSON.stringify(currentUrl)};
  var PROXY = ${JSON.stringify(PROXY_PATH)};

  function isProxied(u){ try { return String(u).indexOf(PROXY + '?url=') !== -1; } catch(e){ return false; } }
  function abs(u){
    try { return new URL(u, CURRENT).toString(); } catch(e){ return u; }
  }
  function proxify(u){
    if(!u) return u;
    if(typeof u !== 'string') return u;
    if(u.indexOf('data:')===0||u.indexOf('blob:')===0||u.indexOf('javascript:')===0||u.indexOf('mailto:')===0||u.indexOf('tel:')===0||u.indexOf('#')===0) return u;
    if(isProxied(u)) return u;
    return PROXY + '?url=' + encodeURIComponent(abs(u));
  }

  // patch fetch
  var _fetch = window.fetch;
  if(_fetch){
    window.fetch = function(input, init){
      try {
        if(typeof input === 'string') input = proxify(input);
        else if(input && input.url) input = new Request(proxify(input.url), input);
      } catch(e){}
      return _fetch.call(this, input, init);
    };
  }

  // patch XHR
  var _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url){
    try { url = proxify(url); } catch(e){}
    return _open.apply(this, [method, url].concat([].slice.call(arguments, 2)));
  };

  // patch window.open — keep inside iframe
  var _open2 = window.open;
  window.open = function(url, name, feats){
    try { url = proxify(url); } catch(e){}
    try { window.parent.postMessage({ type:'omnimux:navigate', url: url }, '*'); } catch(e){}
    return null;
  };

  // patch <a> clicks — relay to parent so URL bar updates
  document.addEventListener('click', function(e){
    var a = e.target && (e.target.closest ? e.target.closest('a') : null);
    if(!a) return;
    var href = a.getAttribute('href');
    if(!href) return;
    if(href.indexOf('javascript:')===0||href.indexOf('mailto:')===0||href.indexOf('tel:')===0||href.indexOf('#')===0) return;
    if(a.target === '_blank'){
      e.preventDefault();
      try { window.parent.postMessage({ type:'omnimux:navigate', url: proxify(href) }, '*'); } catch(_){}
    }
  }, true);

  // history pushState — relay
  var _push = history.pushState;
  history.pushState = function(s,t,u){
    try { if(u) window.parent.postMessage({ type:'omnimux:url', url: abs(u) }, '*'); } catch(e){}
    return _push.apply(history, arguments);
  };

  // strip beforeunload guards
  window.addEventListener('beforeunload', function(e){ e.stopImmediatePropagation(); }, true);

  // notify parent on initial load
  try {
    window.parent.postMessage({
      type:'omnimux:loaded',
      url: CURRENT,
      title: document.title,
      favicon: (function(){ var l=document.querySelector(\"link[rel*='icon']\"); return l ? l.href : ''; })()
    }, '*');
  } catch(e){}

  // ad-block lite: nuke obvious ad iframes
  var AD_RE = /(doubleclick|googlesyndication|adservice|adsystem|adnxs|taboola|outbrain|popads|adsterra|propellerads)/i;
  new MutationObserver(function(muts){
    muts.forEach(function(m){
      m.addedNodes && m.addedNodes.forEach(function(n){
        if(n && n.tagName === 'IFRAME' && n.src && AD_RE.test(n.src)){ try { n.remove(); } catch(_){} }
      });
    });
  }).observe(document.documentElement, { childList:true, subtree:true });
})();
</script>
`;

// ─── core handler ───────────────────────────────────────────────────────────

async function handle(req: NextRequest, method: 'GET' | 'POST') {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');
  if (!targetUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  let target: URL;
  try {
    target = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  // forwarded headers — pretend to be a real browser
  const fwdHeaders: Record<string, string> = {
    'User-Agent':
      req.headers.get('x-omnimux-ua') ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': req.headers.get('accept-language') || 'en-US,en;q=0.9',
    Referer: target.origin + '/',
  };

  // forward range header for media streaming
  const range = req.headers.get('range');
  if (range) fwdHeaders['Range'] = range;

  // forward cookies if user provided them via header
  const cookie = req.headers.get('x-omnimux-cookie');
  if (cookie) fwdHeaders['Cookie'] = cookie;

  let body: BodyInit | undefined = undefined;
  if (method === 'POST') {
    body = await req.arrayBuffer();
    const ct = req.headers.get('content-type');
    if (ct) fwdHeaders['Content-Type'] = ct;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), {
      method,
      headers: fwdHeaders,
      body,
      redirect: 'follow',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Upstream fetch failed', details: err?.message ?? String(err) },
      { status: 502 }
    );
  }

  const finalUrl = upstream.url || target.toString();
  const finalBase = new URL(finalUrl);

  const ct = (upstream.headers.get('content-type') || '').toLowerCase();
  const outHeaders = new Headers();

  // copy through *most* headers
  upstream.headers.forEach((v, k) => {
    const lower = k.toLowerCase();
    if (
      lower === 'x-frame-options' ||
      lower === 'content-security-policy' ||
      lower === 'content-security-policy-report-only' ||
      lower === 'strict-transport-security' ||
      lower === 'cross-origin-opener-policy' ||
      lower === 'cross-origin-embedder-policy' ||
      lower === 'cross-origin-resource-policy' ||
      lower === 'permissions-policy' ||
      lower === 'content-encoding' || // already decoded by fetch
      lower === 'content-length' ||
      lower === 'transfer-encoding'
    ) return;
    outHeaders.set(k, v);
  });

  outHeaders.set('Access-Control-Allow-Origin', '*');
  outHeaders.set('X-Omnimux-Final', finalUrl);

  // ── HTML ────────────────────────────────────────────────────────────────
  if (ct.includes('text/html')) {
    let html = await upstream.text();
    html = rewriteHtml(html, finalBase.toString());

    // inject <base> + runtime patch
    const inject = `<base href=\"${finalBase.origin}${finalBase.pathname.replace(/[^/]*$/, '')}\">${runtimePatch(
      finalBase.origin,
      finalUrl
    )}`;

    if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/<head[^>]*>/i, (m) => m + inject);
    } else if (/<html[^>]*>/i.test(html)) {
      html = html.replace(/<html[^>]*>/i, (m) => m + '<head>' + inject + '</head>');
    } else {
      html = inject + html;
    }

    outHeaders.set('Content-Type', 'text/html; charset=utf-8');
    return new NextResponse(html, { status: upstream.status, headers: outHeaders });
  }

  // ── CSS ─────────────────────────────────────────────────────────────────
  if (ct.includes('text/css')) {
    const css = await upstream.text();
    const out = rewriteCss(css, finalBase.toString());
    outHeaders.set('Content-Type', 'text/css; charset=utf-8');
    return new NextResponse(out, { status: upstream.status, headers: outHeaders });
  }

  // ── everything else: stream through ─────────────────────────────────────
  return new NextResponse(upstream.body, { status: upstream.status, headers: outHeaders });
}

export async function GET(req: NextRequest) {
  return handle(req, 'GET');
}
export async function POST(req: NextRequest) {
  return handle(req, 'POST');
}
export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', '*');
  return new NextResponse(null, { status: 204, headers });
}
