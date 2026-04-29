export function initOmegaShield() {
  if (typeof window === 'undefined') return;
  const BLOCKED_DOMAINS =['popads.net','adsterra.com','exoclick.com','propellerads.com','bet365.com','1xbet.com'];
  const BLOCKED_RE = /\b(popup|popunder|overlay|interstitial|takeover)\b/i;

  function isBlocked(url: string) {
    try { const h = new URL(String(url)).hostname; return BLOCKED_DOMAINS.some(d => h.includes(d)); }
    catch (_) { return BLOCKED_DOMAINS.some(d => String(url).includes(d)); }
  }

  const _origOpen = window.open;
  window.open = function (url, name, features) {
    if (!url || isBlocked(url as string) || BLOCKED_RE.test(url as string)) return null;
    return _origOpen.call(window, url, name, features);
  };
}
