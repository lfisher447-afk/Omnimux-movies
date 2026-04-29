export function initOmegaShield() {
  if (typeof window === 'undefined') return;

  console.log("🛡️ OmegaShield V3: Neural Threat Interception Activated");

  const BLOCKED_DOMAINS =['popads.net', 'adsterra.com', 'exoclick.com', 'propellerads.com', 'bet365.com', '1xbet.com', 'redirect', 'tracking', 'logger'];
  const BLOCKED_RE = /\b(popup|popunder|overlay|interstitial|takeover|ad|track)\b/i;

  const isBlocked = (url: string) => {
    try { const h = new URL(String(url)).hostname; return BLOCKED_DOMAINS.some(d => h.includes(d)); }
    catch (_) { return BLOCKED_DOMAINS.some(d => String(url).includes(d)) || BLOCKED_RE.test(String(url)); }
  };

  // 1. Hijack window.open
  const _origOpen = window.open;
  window.open = function (url, name, features) {
    if (!url || isBlocked(url as string)) {
      console.warn(`🛡️ OmegaShield blocked popup to: ${url}`);
      return null;
    }
    return _origOpen.call(window, url, name, features);
  };

  // 2. Prevent Rogue Redirects (Hijacking location assignment)
  let _location = window.location;
  Object.defineProperty(window, 'location', {
    set: function (url) {
      if (isBlocked(url)) {
        console.warn(`🛡️ OmegaShield blocked redirect to: ${url}`);
        return;
      }
      _location.href = url;
    },
    get: function () { return _location; }
  });

  // 3. Prevent BeforeUnload hijacking
  window.addEventListener('beforeunload', (e) => {
    e.stopImmediatePropagation();
  }, true);

  // 4. DOM Mutation Observer to strip injected ads instantly
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node: any) => {
        if (node.tagName === 'IFRAME' || node.tagName === 'A' || node.tagName === 'SCRIPT') {
          if (node.src && isBlocked(node.src) || node.href && isBlocked(node.href)) {
            console.warn(`🛡️ OmegaShield nuked rogue element:`, node);
            node.remove();
          }
        }
      });
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
