import { NextResponse } from 'next/server';

export const runtime = 'edge';

// ─── Constants ────────────────────────────────────────────────────────────────

const PROXY_PATH = '/api/proxy';
const STREAM_PATH = '/api/stream';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Upgrade-Insecure-Requests': '1',
};

// Private/loopback ranges — block SSRF
const PRIVATE_HOSTNAME_RE =
  /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|0\.0\.0\.0|::1|fd[0-9a-f]{2}:)$/i;

// ─── URL helpers ──────────────────────────────────────────────────────────────

function toAbsolute(url: string, origin: string, pageUrl: string): string {
  if (!url) return url;
  url = url.trim();
  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('#') ||
    url.startsWith('javascript:') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:')
  )
    return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${origin}${url}`;
  if (!url.startsWith('http')) {
    // Relative path — resolve against current page URL
    try {
      return new URL(url, pageUrl).href;
    } catch {
      return `${origin}/${url}`;
    }
  }
  return url;
}

function routeThrough(absolute: string, forStream = false): string {
  const base = forStream ? STREAM_PATH : PROXY_PATH;
  return `${base}?url=${encodeURIComponent(absolute)}`;
}

function proxify(raw: string, origin: string, pageUrl: string, forStream = false): string {
  if (!raw) return raw;
  const skip =
    raw.startsWith('data:') ||
    raw.startsWith('blob:') ||
    raw.startsWith('#') ||
    raw.startsWith('javascript:') ||
    raw.startsWith('mailto:') ||
    raw.startsWith('tel:');
  if (skip) return raw;
  // Already proxied?
  if (raw.includes(`${PROXY_PATH}?url=`) || raw.includes(`${STREAM_PATH}?url=`)) return raw;
  const abs = toAbsolute(raw, origin, pageUrl);
  return routeThrough(abs, forStream);
}

// ─── Client-side interceptor injection ───────────────────────────────────────

function buildInterceptor(targetOrigin: string): string {
  // Minified but readable interceptor — injected into every proxied HTML page.
  // It rewrites fetch(), XHR, and dynamically inserted DOM nodes so that all
  // network requests from the proxied page route back through our proxy.
  return `<script id="__omnimux_interceptor__">
(function(){
  'use strict';
  var PP='${PROXY_PATH}';
  var SP='${STREAM_PATH}';
  var OR='${targetOrigin}';
  var LO=location.origin;

  /* ── Resolve relative → absolute using the proxied origin ── */
  function abs(u){
    if(!u||typeof u!=='string')return u;
    u=u.trim();
    if(/^(data:|blob:|#|javascript:|mailto:|tel:)/.test(u))return u;
    if(u.startsWith('//'))return'https:'+u;
    if(u.startsWith('/'))return OR+u;
    if(!u.startsWith('http'))return OR+'/'+u;
    return u;
  }

  /* ── Route URL through appropriate proxy ── */
  function px(u,stream){
    if(!u)return u;
    var a=abs(u);
    if(!a)return u;
    // Already proxied
    if(a.indexOf(LO+PP)===0||a.indexOf(LO+SP)===0)return a;
    var base=stream?SP:PP;
    return LO+base+'?url='+encodeURIComponent(a);
  }

  /* ── Override fetch ── */
  var _fetch=window.fetch;
  window.fetch=function(input,init){
    try{
      if(typeof input==='string')return _fetch.call(this,px(input),init);
      if(input instanceof URL)return _fetch.call(this,new URL(px(input.href)),init);
      if(typeof Request!=='undefined'&&input instanceof Request){
        var proxied=px(input.url);
        if(proxied!==input.url){
          var r=new Request(proxied,{method:input.method,headers:input.headers,body:input.body,credentials:'omit',mode:'cors'});
          return _fetch.call(this,r,init);
        }
      }
    }catch(e){}
    return _fetch.apply(this,arguments);
  };

  /* ── Override XMLHttpRequest ── */
  var _open=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(method,url){
    var rest=[].slice.call(arguments,2);
    try{url=px(String(url));}catch(e){}
    return _open.apply(this,[method,url].concat(rest));
  };

  /* ── Override WebSocket (optional, prevents console errors) ── */
  if(typeof WebSocket!=='undefined'){
    var _WS=WebSocket;
    window.WebSocket=function(url,protocols){
      // Can't proxy WS through HTTP proxy; just suppress
      try{return new _WS(url,protocols);}catch(e){return{send:function(){},close:function(){},addEventListener:function(){}};}
    };
    Object.setPrototypeOf(window.WebSocket,_WS);
    window.WebSocket.prototype=_WS.prototype;
  }

  /* ── Block service worker registration (would install on our domain) ── */
  if(navigator.serviceWorker){
    Object.defineProperty(navigator,'serviceWorker',{
      get:function(){
        return{
          register:function(){return Promise.reject(new Error('SW blocked by Omnimux'));},
          addEventListener:function(){},
          ready:Promise.reject(new Error('blocked')),
          controller:null
        };
      }
    });
  }

  /* ── MutationObserver: proxy dynamically added elements ── */
  var PROXIED_ATTRS=['src','href','action','data','poster','data-src','data-lazy-src','data-original'];
  var STREAM_TYPES=/\.(mp4|webm|ogg|m3u8|mpd|ts|mkv|avi|mov|flv|mp3|aac|opus|flac)(\?|$)/i;

  function proxifyElement(el){
    if(!el||el.nodeType!==1)return;
    PROXIED_ATTRS.forEach(function(a){
      var v=el.getAttribute&&el.getAttribute(a);
      if(v&&!/^(data:|blob:|#|javascript:)/.test(v)&&v.indexOf(PP)<0&&v.indexOf(SP)<0){
        var isStream=STREAM_TYPES.test(v);
        try{el.setAttribute(a,px(v,isStream));}catch(e){}
      }
    });
    // srcset
    var ss=el.getAttribute&&el.getAttribute('srcset');
    if(ss){
      var rw=ss.replace(/([^\s,]+)(\s+[^,]+)?/g,function(_,u,d){
        return(u?px(u):'')+(d||'');
      });
      try{el.setAttribute('srcset',rw);}catch(e){}
    }
  }

  var _mo=new MutationObserver(function(muts){
    muts.forEach(function(m){
      m.addedNodes.forEach(function(n){
        if(n.nodeType!==1)return;
        proxifyElement(n);
        try{n.querySelectorAll('[src],[href],[action],[data-src]').forEach(proxifyElement);}catch(e){}
      });
      // Attribute changes
      if(m.type==='attributes'){
        proxifyElement(m.target);
      }
    });
  });
  _mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:PROXIED_ATTRS});

  /* ── Override history to keep URLs in proxy scope ── */
  ['pushState','replaceState'].forEach(function(fn){
    var orig=history[fn].bind(history);
    history[fn]=function(state,title,url){
      // Don't rewrite relative fragment-only navigations
      if(url&&typeof url==='string'&&url.startsWith('http')&&url.indexOf(PP)<0){
        url=px(url);
      }
      return orig(state,title,url);
    };
  });

  /* ── Override window.open ── */
  var _open2=window.open;
  window.open=function(url,name,features){
    if(url&&typeof url==='string'&&url.indexOf(PP)<0){
      url=px(url);
    }
    return _open2.call(this,url,name,features);
  };

  console.log('%c[Omnimux] Proxy interceptor active \u2192 '+OR,'color:#6366f1;font-weight:bold');
})();
</script>`;
}

// ─── HTML rewriting ───────────────────────────────────────────────────────────

function rewriteHtml(html: string, targetOrigin: string, targetUrl: string): string {
  const interceptor = buildInterceptor(targetOrigin);

  // Inject interceptor as early as possible
  if (/<head(\s[^>]*)?>/i.test(html)) {
    html = html.replace(/(<head(\s[^>]*)?>)/i, `$1\n${interceptor}`);
  } else if (/<html(\s[^>]*)?>/i.test(html)) {
    html = html.replace(/(<html(\s[^>]*)?>)/i, `$1\n${interceptor}`);
  } else {
    html = interceptor + html;
  }

  // Remove existing <base> tags (they'd conflict with proxy paths)
  html = html.replace(/<base[^>]*>/gi, '');

  // Strip security meta tags that block embedding
  html = html.replace(
    /<meta[^>]+http-equiv\s*=\s*["']?(X-Frame-Options|Content-Security-Policy|X-Content-Type-Options)["']?[^>]*>/gi,
    ''
  );

  // Remove SRI integrity attributes (they fail because proxy URLs differ)
  html = html.replace(/\s+integrity\s*=\s*["'][^"']*["']/gi, '');

  // Remove crossorigin attributes that cause preflight failures
  html = html.replace(/\s+crossorigin\s*(?:=\s*["'][^"']*["'])?/gi, '');

  // ── Rewrite HTML attributes ──────────────────────────────────────────────

  const STREAM_EXT = /\.(mp4|webm|ogg|m3u8|mpd|ts|mkv|avi|mov|flv|mp3|aac|opus|flac)(\?|$)/i;

  // src / href / action / poster / data / data-src etc.
  html = html.replace(
    /(\s(?:src|href|action|poster|data|data-src|data-href|data-lazy-src|data-original|content)\s*=\s*)(["'])([^"']+)\2/gi,
    (match, attr, quote, url) => {
      if (!url || /^(data:|blob:|#|javascript:|mailto:|tel:)/.test(url)) return match;
      const isStream = STREAM_EXT.test(url);
      const proxied = proxify(url, targetOrigin, targetUrl, isStream);
      return `${attr}${quote}${proxied}${quote}`;
    }
  );

  // srcset="url 2x, url2 4x, …"
  html = html.replace(
    /(\ssrcset\s*=\s*)(["'])([^"']+)\2/gi,
    (_match, attr, quote, srcset) => {
      const rw = srcset.replace(/([^\s,]+)(\s+[^,]+)?/g, (part: string, url: string, desc: string) => {
        if (!url) return part;
        return proxify(url, targetOrigin, targetUrl) + (desc || '');
      });
      return `${attr}${quote}${rw}${quote}`;
    }
  );

  // CSS url() inside <style> blocks
  html = html.replace(
    /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_, open, css, close) => {
      const rw = css.replace(/url\((['"]?)([^'")\s]+)\1\)/gi, (_m: string, q: string, u: string) => {
        if (/^(data:|blob:)/.test(u)) return _m;
        return `url(${q}${proxify(u, targetOrigin, targetUrl)}${q})`;
      });
      return open + rw + close;
    }
  );

  // <meta http-equiv="refresh" content="0; url=…">
  html = html.replace(
    /(<meta[^>]+http-equiv\s*=\s*["']?refresh["']?[^>]+content\s*=\s*["'][^"']*url\s*=\s*)([^"'\s]+)([^"']*["'][^>]*>)/gi,
    (_, pre, url, post) => `${pre}${proxify(url, targetOrigin, targetUrl)}${post}`
  );

  return html;
}

// ─── CSS rewriting ────────────────────────────────────────────────────────────

function rewriteCss(css: string, targetOrigin: string, targetUrl: string): string {
  return css.replace(/url\((['"]?)([^'")\s]+)\1\)/gi, (match, q, url) => {
    if (/^(data:|blob:)/.test(url)) return match;
    return `url(${q}${proxify(url, targetOrigin, targetUrl)}${q})`;
  });
}

// ─── Response headers helper ─────────────────────────────────────────────────

function buildResponseHeaders(upstream: Headers, contentType: string): Headers {
  const h = new Headers();
  h.set('Content-Type', contentType);
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  h.set('Access-Control-Allow-Headers', '*');
  h.set('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Content-Range');
  // Forward useful caching headers
  (['cache-control', 'etag', 'last-modified', 'expires'] as const).forEach(k => {
    const v = upstream.get(k);
    if (v) h.set(k, v);
  });
  // Forward content-length for binary passthrough
  const cl = upstream.get('content-length');
  if (cl) h.set('Content-Length', cl);
  // Explicitly strip headers that block framing / embedding
  // (these don't need to be deleted since we're building fresh, but for clarity:)
  // x-frame-options, content-security-policy — NOT forwarded
  return h;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('url');

  if (!raw) {
    return NextResponse.json({ error: 'Missing ?url parameter' }, { status: 400 });
  }

  // Decode double-encoded URLs gracefully
  let targetUrl: string;
  try {
    targetUrl = decodeURIComponent(raw);
    if (!targetUrl.startsWith('http')) throw new Error('not http');
  } catch {
    targetUrl = raw;
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // SSRF protection — block private network addresses
  if (PRIVATE_HOSTNAME_RE.test(parsed.hostname)) {
    return NextResponse.json({ error: 'Private network access denied' }, { status: 403 });
  }

  const targetOrigin = parsed.origin;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const upstream = await fetch(parsed.toString(), {
      headers: {
        ...BROWSER_HEADERS,
        Referer: targetOrigin,
        Origin: targetOrigin,
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const rawContentType = upstream.headers.get('content-type') || '';
    const ct = rawContentType.split(';')[0].trim().toLowerCase();

    // ── HTML ──────────────────────────────────────────────────────────────
    if (ct === 'text/html' || ct === 'application/xhtml+xml') {
      let html = await upstream.text();
      html = rewriteHtml(html, targetOrigin, parsed.toString());
      const h = buildResponseHeaders(upstream.headers, 'text/html; charset=utf-8');
      h.delete('content-length'); // Length changed after rewrite
      return new NextResponse(html, { status: 200, headers: h });
    }

    // ── CSS ───────────────────────────────────────────────────────────────
    if (ct === 'text/css') {
      let css = await upstream.text();
      css = rewriteCss(css, targetOrigin, parsed.toString());
      const h = buildResponseHeaders(upstream.headers, rawContentType || 'text/css; charset=utf-8');
      h.delete('content-length');
      return new NextResponse(css, { status: 200, headers: h });
    }

    // ── JavaScript / JSON / plain text ────────────────────────────────────
    if (
      ct.includes('javascript') ||
      ct.includes('json') ||
      ct === 'text/plain' ||
      ct === 'text/xml' ||
      ct === 'application/xml'
    ) {
      const text = await upstream.text();
      const h = buildResponseHeaders(upstream.headers, rawContentType);
      h.delete('content-length');
      return new NextResponse(text, { status: upstream.status, headers: h });
    }

    // ── Binary passthrough (images, fonts, media, etc.) ───────────────────
    const h = buildResponseHeaders(upstream.headers, rawContentType || 'application/octet-stream');
    return new NextResponse(upstream.body, { status: upstream.status, headers: h });

  } catch (err: any) {
    const isAbort = err.name === 'AbortError' || err.name === 'TimeoutError';
    return NextResponse.json(
      {
        error: isAbort ? 'Upstream timed out (30 s)' : 'Proxy request failed',
        details: err.message,
        url: targetUrl,
      },
      { status: 502 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
