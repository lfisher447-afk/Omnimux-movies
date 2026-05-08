import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// ─── EVASION ROTATOR ───
const USER_AGENTS =[
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
];

// Handles preflight CORS validations requested by complex sites like YouTube
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Master handler for all incoming traffic types
async function handleRequest(req: Request) {
  const { searchParams, origin: internalOrigin } = new URL(req.url);
  let targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'Missing Target URL Parameter' }, { status: 400 });
  if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`;

  try {
    const targetUrlObj = new URL(targetUrl);
    const targetOrigin = targetUrlObj.origin;
    const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    // 1. Rebuild Headers perfectly to spoof the target server
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('Host', targetUrlObj.host);
    requestHeaders.set('Origin', targetOrigin);
    requestHeaders.set('Referer', targetOrigin);
    requestHeaders.set('User-Agent', randomUA);
    
    // Crucial for YouTube/GoogleVideo support to accept cookies and streams
    requestHeaders.delete('x-forwarded-for');
    requestHeaders.delete('x-forwarded-host');

    // 2. Fetch the upstream resource (Supports POST bodies, streaming, and range requests)
    const fetchParams: RequestInit = {
      method: req.method,
      headers: requestHeaders,
      redirect: 'manual', // We handle redirects manually to rewrite them
      // Explicitly pass Body for POST/PUT if it exists
      ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body: req.body, duplex: 'half' } : {})
    };

    const response = await fetch(targetUrl, fetchParams);

    // 3. Purge Security/Frame-busting Headers from the Response
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
    responseHeaders.delete('X-Frame-Options');
    responseHeaders.delete('Content-Security-Policy');
    responseHeaders.delete('Strict-Transport-Security');
    responseHeaders.delete('Clear-Site-Data');
    responseHeaders.delete('Cross-Origin-Embedder-Policy');
    responseHeaders.delete('Cross-Origin-Opener-Policy');

    // Handle Redirects strictly through the proxy
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = responseHeaders.get('location');
      if (location) {
        const redirectUrl = new URL(location, targetOrigin).toString();
        responseHeaders.set('location', `${internalOrigin}/api/proxy?url=${encodeURIComponent(redirectUrl)}`);
        return new NextResponse(null, { status: response.status, headers: responseHeaders });
      }
    }

    const contentType = responseHeaders.get('content-type') || '';
    
    // ─── SERVER-SIDED FILE & VIDEO STREAMING ───
    // If it's NOT HTML (e.g., MP4, MP3, JS, CSS, WebP, Font), stream it directly byte-for-byte!
    // This perfectly supports 206 Partial Content Range handling for streaming YouTube chunks
    if (!contentType.includes('text/html')) {
        return new NextResponse(response.body, { 
            status: response.status, 
            statusText: response.statusText,
            headers: responseHeaders 
        });
    }

    // ─── DEEP HTML MUTATION ENGINE ───
    let html = await response.text();

    const proxyBase = `${internalOrigin}/api/proxy?url=`;

    // A. Base Tag Injection (Fixes relative routing /images/icon.png -> targetOrigin/images/icon.png)
    if (html.match(/<head[^>]*>/i)) {
      html = html.replace(/(<head[^>]*>)/i, `$1\n<base href="${targetOrigin}/">`);
    } else {
      html = `<head><base href="${targetOrigin}/"></head>\n` + html;
    }

    // B. Transform specific hardcoded absolute links into proxy links
    html = html.replace(/(href|src|action)=["'](https?:\/\/[^"']+)["']/gi, `$1="${proxyBase}$2"`);
    
    // C. Rewrite CSS Background URLs mapping
    html = html.replace(/url\(['"]?(https?:\/\/[^'"\)]+)['"]?\)/gi, `url('${proxyBase}$1')`);

    // ─── OMNIMUX JAVASCRIPT HIJACK PAYLOAD ───
    // This script executes inside the target web page. It overrides the native Fetch, XHR, 
    // and DOM capabilities so YouTube video blobs and dynamic scripts load directly through us.
    const GOD_MODE_PAYLOAD = `
      <script>
        (function() {
          const PROXY_BASE = "${proxyBase}";
          
          // Disable Service Workers to prevent target websites from taking over the cache/routing
          if (navigator.serviceWorker) {
            navigator.serviceWorker.register = function() { return Promise.reject("Omnimux: SW Blocked"); };
          }

          // Native Fetch Hijacker (Intercepts all background API calls like YouTube video chunks)
          const origFetch = window.fetch;
          window.fetch = async function() {
            let args = Array.prototype.slice.call(arguments);
            let url = args[0];

            if (url instanceof Request) {
               if (url.url.startsWith('http')) {
                  args[0] = new Request(PROXY_BASE + encodeURIComponent(url.url), url);
               }
            } else if (typeof url === 'string') {
               if (url.startsWith('http')) {
                  args[0] = PROXY_BASE + encodeURIComponent(url);
               } else if (url.startsWith('//')) {
                  args[0] = PROXY_BASE + encodeURIComponent(window.location.protocol + url);
               }
            }
            return origFetch.apply(this, args);
          };

          // Native XHR (XMLHttpRequest) Hijacker
          const origOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            let newUrl = url;
            if (typeof url === 'string') {
               if (url.startsWith('http')) {
                  newUrl = PROXY_BASE + encodeURIComponent(url);
               } else if (url.startsWith('//')) {
                  newUrl = PROXY_BASE + encodeURIComponent(window.location.protocol + url);
               }
            }
            return origOpen.call(this, method, newUrl, async, user, password);
          };

          // Prototype DOM Hijacker: Catch dynamically injected scripts & images by external JS
          const origSetAttribute = Element.prototype.setAttribute;
          Element.prototype.setAttribute = function(name, value) {
             let newVal = value;
             if ((name === 'src' || name === 'href') && typeof value === 'string') {
                if (value.startsWith('http')) {
                   newVal = PROXY_BASE + encodeURIComponent(value);
                }
             }
             return origSetAttribute.call(this, name, newVal);
          };

          console.log("🛡️ Omnimux Neural Core: Target DOM and Network Synchronized.");
        })();
      </script>
    `;

    html = html.replace(/(<head[^>]*>)/i, `$1\n${GOD_MODE_PAYLOAD}`);

    return new NextResponse(html, { status: 200, headers: responseHeaders });
  } catch (error: any) {
    console.error("Omnimux Neural Proxy Exception:", error);
    return NextResponse.json({ error: 'Proxy Matrix Failure', details: error.message }, { status: 502 });
  }
}

// Map all request types to the master handler, supporting complex player authentications
export { handleRequest as GET, handleRequest as POST, handleRequest as PUT, handleRequest as DELETE, handleRequest as PATCH };
