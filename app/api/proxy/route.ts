// app/api/proxy/route.ts
import { NextResponse } from 'next/server';

// ─── NEXT.JS EDGE RUNTIME CONFIG ───
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// ─── EVASION ROTATOR ───
const USER_AGENTS =[
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0'
];

// ─── CORS PREFLIGHT HANDLER ───
// Handles preflight validations natively requested by SPAs and Media Players
export async function OPTIONS(req: Request) {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  headers.set('Access-Control-Allow-Headers', req.headers.get('Access-Control-Request-Headers') || '*');
  headers.set('Access-Control-Max-Age', '86400');
  return new NextResponse(null, { status: 204, headers });
}

// ─── CORE REQUEST HANDLER ───
async function handleRequest(req: Request) {
  const { searchParams, origin: internalOrigin } = new URL(req.url);
  let targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing Target URL Parameter' }, { status: 400 });
  }

  // Auto-upgrade protocol if missing
  if (!targetUrl.startsWith('http')) {
    targetUrl = `https://${targetUrl}`;
  }

  try {
    const targetUrlObj = new URL(targetUrl);
    const targetOrigin = targetUrlObj.origin;
    const randomUA = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    // ─── 1. SPOOF HEADERS ───
    const requestHeaders = new Headers();
    requestHeaders.set('Host', targetUrlObj.host);
    requestHeaders.set('Origin', targetOrigin);
    requestHeaders.set('Referer', targetOrigin + '/');
    requestHeaders.set('User-Agent', randomUA);
    requestHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8');
    requestHeaders.set('Accept-Language', 'en-US,en;q=0.9');
    
    // Pass along user's authentication cookies safely
    const reqCookie = req.headers.get('cookie');
    if (reqCookie) requestHeaders.set('Cookie', reqCookie);

    // Bypass standard HTTP limits for continuous video chunk requests
    if (req.headers.has('range')) requestHeaders.set('Range', req.headers.get('range')!);

    // Prepare robust fetch params (Handles POST/PUT body multiplexing)
    const fetchParams: RequestInit = {
      method: req.method,
      headers: requestHeaders,
      redirect: 'manual', // Catch 30x Redirects securely in the proxy layer
      ...(req.method !== 'GET' && req.method !== 'HEAD' ? { body: req.body, duplex: 'half' } as any : {})
    };

    const response = await fetch(targetUrlObj.href, fetchParams);
    const responseHeaders = new Headers(response.headers);

    // ─── 2. FORCE SECURITY HEADER DECAPITATION ───
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Expose-Headers', '*');
    
    // Strip constraints that prevent target from loading inside our app[
      'X-Frame-Options', 'Content-Security-Policy', 'Strict-Transport-Security', 'Clear-Site-Data', 
      'Cross-Origin-Embedder-Policy', 'Cross-Origin-Opener-Policy', 'Cross-Origin-Resource-Policy', 
      'X-Content-Type-Options'
    ].forEach(h => responseHeaders.delete(h));

    // Strip problematic cookie flags allowing cross-domain persistence within proxy boundaries
    let setCookie = responseHeaders.get('set-cookie');
    if (setCookie) {
      setCookie = setCookie.replace(/SameSite=(Strict|Lax)/gi, 'SameSite=None');
      if (!setCookie.includes('Secure')) setCookie += '; Secure';
      responseHeaders.set('set-cookie', setCookie);
    }

    // Capture and securely wrap 301/302 Redirects back into the proxy tunnel
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = responseHeaders.get('location');
      if (location) {
        const absoluteRedirect = new URL(location, targetOrigin).href;
        responseHeaders.set('location', `${internalOrigin}/api/proxy?url=${encodeURIComponent(absoluteRedirect)}`);
        return new NextResponse(null, { status: response.status, headers: responseHeaders });
      }
    }

    const contentType = responseHeaders.get('content-type') || '';
    const proxyBase = `${internalOrigin}/api/proxy?url=`;

    // ─── 3. DYNAMIC JSON URL REPLACEMENT (Solves YouTube SPA / API tracking) ───
    if (contentType.includes('application/json')) {
        let jsonText = await response.text();
        // Dangerously rewrite URLs hiding in stringified JSON payloads (YouTube initial endpoints)
        jsonText = jsonText.replace(/(https?:\/\/[^\s"\']+)/g, (match) => {
          // Exclude certain known non-routable strings if necessary, else proxy all
          return `${proxyBase}${encodeURIComponent(match)}`;
        });
        return new NextResponse(jsonText, { status: 200, headers: responseHeaders });
    }

    // ─── 4. BINARY NODE STREAM PASSTHROUGH (Video/Image/Font) ───
    if (!contentType.includes('text/html')) {
        // Native Edge Buffer Stream (supports multi-gigabyte HLS/MP4 without RAM crashes)
        return new NextResponse(response.body, { 
          status: response.status, 
          statusText: response.statusText, 
          headers: responseHeaders 
        });
    }

    // ─── 5. DEEP HTML DOM MUTATION ───
    let html = await response.text();

    // Neutralize Ads & Trackers immediately via Edge scrubbing
    html = html.replace(/<script[^>]*src=["'][^"']*(google-analytics\.com|doubleclick\.net|popads|adsterra|coinhive)[^"']*["'][^>]*><\/script>/gi, '<!-- OmegaShield: Tracker Neutralized -->');

    // Establish Target Origin Reference 
    html = html.replace(/<head>/i, `<head>\n<base href="${targetOrigin}/">`);

    // Rewrite absolute URLs globally across all standard HTML elements
    html = html.replace(/(href|src|action|poster)=["'](https?:\/\/[^"']+)["']/gi, `$1="${proxyBase}$2"`);

    // Rewrite srcset natively for responsive/retina images
    html = html.replace(/srcset=["']([^"']+)["']/gi, (match, p1) => {
      const parts = p1.split(',').map((part: string) => {
        const[url, size] = part.trim().split(/\s+/);
        if (!url || url.startsWith('data:') || url.startsWith('blob:')) return part;
        return `${proxyBase}${encodeURIComponent(new URL(url, targetOrigin).href)} ${size || ''}`;
      });
      return `srcset="${parts.join(', ')}"`;
    });

    // Rewrite CSS imports and background properties efficiently
    html = html.replace(/url\(['"]?(?!data:|blob:)([^'"\)]+)['"]?\)/gi, (match, p1) => {
      return `url('${proxyBase}${encodeURIComponent(new URL(p1, targetOrigin).href)}')`;
    });

    // ─── 6. V15 GOD-MODE JAVASCRIPT HYPERVISOR ───
    const GOD_MODE_PAYLOAD = `
      <script id="omnimux-neural-hypervisor">
        (function() {
          console.log("🛡️ Omnimux Neural Edge Hypervisor Activated.");
          const PROXY_BASE = "${proxyBase}";
          const TARGET_ORIGIN = "${targetOrigin}";

          // --- UTILITIES ---
          // Dynamically resolves ANY path type (relative, absolute, protocol-relative) to proxy absolute
          function resolveUrl(url) {
            if (!url || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('javascript:')) return url;
            try {
              if (url.startsWith(PROXY_BASE)) return url; // Already proxied
              const absoluteUrl = new URL(url, TARGET_ORIGIN).href;
              return PROXY_BASE + encodeURIComponent(absoluteUrl);
            } catch (e) { return url; }
          }

          // --- FRAME & SECURITY KILLERS ---
          Object.defineProperty(window, 'top', { value: window.self, configurable: false, writable: false });
          Object.defineProperty(window, 'parent', { value: window.self, configurable: false, writable: false });
          if (navigator.serviceWorker) navigator.serviceWorker.register = function() { return Promise.reject("Omnimux blocked SW"); };

          // --- NETWORK HIJACKING (Fixes YouTube 404s & SPA Calls) ---

          // 1. Fetch API
          const origFetch = window.fetch;
          window.fetch = async function() {
            let args = Array.prototype.slice.call(arguments);
            let target = args[0];

            if (target instanceof Request) {
               const newUrl = resolveUrl(target.url);
               args[0] = new Request(newUrl, target); // Maintain headers/body
            } else if (typeof target === 'string') {
               args[0] = resolveUrl(target);
            }
            return origFetch.apply(this, args);
          };

          // 2. XMLHttpRequest (XHR)
          const origOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            const mappedUrl = resolveUrl(url);
            return origOpen.call(this, method, mappedUrl, async, user, password);
          };

          // 3. WebSockets (Bypasses restriction by leaving ws:// intact, or proxy if required)
          const origWebSocket = window.WebSocket;
          window.WebSocket = function(url, protocols) {
             let wsUrl = url;
             return protocols ? new origWebSocket(wsUrl, protocols) : new origWebSocket(wsUrl);
          };

          // 4. SendBeacon
          const origBeacon = navigator.sendBeacon;
          navigator.sendBeacon = function(url, data) {
             return origBeacon.call(this, resolveUrl(url), data);
          };

          // --- DOM & BROWSER API HIJACKING ---

          // 1. Element Attribute Modification (Catches dynamically created tags via JS element injection)
          const origSetAttr = Element.prototype.setAttribute;
          Element.prototype.setAttribute = function(name, value) {
            if (/^(src|href|action|poster)$/i.test(name) && typeof value === 'string') {
              value = resolveUrl(value);
            }
            return origSetAttr.call(this, name, value);
          };

          // 2. Direct property setting intercepts (e.g. img.src = "...")
          const defineUriHook = (element, property) => {
            const origDescriptor = Object.getOwnPropertyDescriptor(element.prototype, property);
            if (origDescriptor) {
              Object.defineProperty(element.prototype, property, {
                get: function() { return origDescriptor.get.call(this); },
                set: function(val) { origDescriptor.set.call(this, resolveUrl(val)); }
              });
            }
          };
          defineUriHook(HTMLImageElement, 'src');
          defineUriHook(HTMLScriptElement, 'src');
          defineUriHook(HTMLIFrameElement, 'src');
          defineUriHook(HTMLAnchorElement, 'href');
          defineUriHook(HTMLMediaElement, 'src');

          // 3. History API (Prevents SPA navigation from throwing internal 404s)
          const origPushState = history.pushState;
          history.pushState = function(state, title, url) {
             if (url) {
                // Modifies the internal state tracking without triggering a browser reload.
                url = resolveUrl(url);
             }
             return origPushState.call(this, state, title, url);
          };

          const origReplaceState = history.replaceState;
          history.replaceState = function(state, title, url) {
             if (url) url = resolveUrl(url);
             return origReplaceState.call(this, state, title, url);
          };

          // 4. Location Redirects Trap
          const origAssign = window.location.assign;
          window.location.assign = function(url) {
             origAssign.call(this, resolveUrl(url));
          };
          const origReplace = window.location.replace;
          window.location.replace = function(url) {
             origReplace.call(this, resolveUrl(url));
          };

        })();
      </script>
    `;

    // Inject hypervisor at the absolute top of the document to beat execution of Native scripts
    if (html.match(/(<head[^>]*>)/i)) {
      html = html.replace(/(<head[^>]*>)/i, `$1\n${GOD_MODE_PAYLOAD}`);
    } else {
      // Fallback if target site has malformed or missing head tags
      html = `<head>${GOD_MODE_PAYLOAD}</head>` + html;
    }

    return new NextResponse(html, { status: 200, headers: responseHeaders });
  } catch (error: any) {
    console.error("Omnimux Network Proxy Exception:", error);
    return new NextResponse(
       `<html><body style="background:#030508;color:#ff3333;font-family:monospace;padding:2rem;">
          <h2>Neural Sandbox Fault Detected</h2><p>${error.message}</p>
        </body></html>`, 
       { status: 502, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Global mapping for all REST HTTP request scenarios ensuring full proxy compatibility
export { 
  handleRequest as GET, 
  handleRequest as POST, 
  handleRequest as PUT, 
  handleRequest as DELETE, 
  handleRequest as PATCH 
};
