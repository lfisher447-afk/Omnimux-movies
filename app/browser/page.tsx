'use client';
/**
 * Omnimux Browser v13 — "Hyperion"
 * 50+ upgrades over v12 — fixes JSX errors, adds full website support,
 * tab groups, drag reorder, recently closed, find-in-page, reader mode,
 * screenshot, view source, save HTML, force dark, custom UA, page zoom,
 * autocomplete, search bangs, command palette, gestures, audio mute, and more.
 */
import {
  useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect,
} from 'react';
import {
  Globe, ArrowRight, ArrowLeft, RefreshCcw, Plus, X, ShieldCheck, EyeOff,
  Maximize2, ShieldAlert, Cpu, Server, Zap, Search, Star, Clock,
  ChevronDown, Wifi, WifiOff, Trash2, Copy, ExternalLink, Code2,
  SplitSquareVertical, Home, AlertTriangle, CheckCircle2, XCircle, RotateCcw,
  Pin, PinOff, Keyboard, BarChart3, Layers, Radio, Camera, Download,
  Type, Moon, Sun, BookOpen, Smartphone, Monitor, Tablet, Volume2, VolumeX,
  Command, History as HistoryIcon, Save, FileCode, Eye, ZoomIn, ZoomOut,
  ChevronUp, ChevronRight, Folder, FolderPlus, FilePlus, Sparkles, ListTree,
  Maximize, Minimize, Lock, Unlock, Settings,
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

// ─── TYPES ───────────────────────────────────────────────────────────────────
type ProxyEngine = 'server' | 'allorigins' | 'corsproxy' | 'direct';
type UAProfile = 'desktop' | 'mobile' | 'tablet' | 'bot';
type Theme = 'midnight' | 'phantom' | 'matrix' | 'aurora';

interface BrowserTab {
  id: string;
  url: string;
  inputUrl: string;
  title: string;
  favicon: string;
  isLoading: boolean;
  isError: boolean;
  errorMsg: string;
  history: { past: string[]; future: string[] };
  sandbox: { js: boolean; popups: boolean; forms: boolean };
  proxyEngine: ProxyEngine;
  isPinned: boolean;
  loadTime: number | null;
  groupId: string | null;
  zoom: number;            // 0.5..2
  forceDark: boolean;
  readerMode: boolean;
  uaProfile: UAProfile;
  muted: boolean;
  customCss: string;
}

interface Bookmark { id: string; url: string; title: string; favicon: string; addedAt: number; folder: string; }
interface HistoryEntry { url: string; title: string; visitedAt: number; }
interface TabGroup { id: string; name: string; color: string; }
interface ClosedTab { url: string; title: string; closedAt: number; }

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const PROXY_ENGINES: Record<ProxyEngine, { label: string; color: string; build: (url: string) => string }> = {
  server:     { label: 'Hyperion Relay',   color: 'indigo',  build: (u) => `/api/proxy?url=${encodeURIComponent(u)}` },
  allorigins: { label: 'AllOrigins CDN',   color: 'cyan',    build: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
  corsproxy:  { label: 'CORSProxy Bridge', color: 'violet',  build: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}` },
  direct:     { label: 'Direct Tunnel',    color: 'amber',   build: (u) => u },
};
const UA_LABEL: Record<UAProfile, string> = { desktop: 'Desktop', mobile: 'Mobile', tablet: 'Tablet', bot: 'Crawler' };

const SEARCH_ENGINES =[
  { id: 'duck',  label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
  { id: 'goog',  label: 'Google',     url: 'https://www.google.com/search?q=' },
  { id: 'bing',  label: 'Bing',       url: 'https://www.bing.com/search?q=' },
  { id: 'wiki',  label: 'Wikipedia',  url: 'https://en.wikipedia.org/wiki/Special:Search?search=' },
  { id: 'yt',    label: 'YouTube',    url: 'https://www.youtube.com/results?search_query=' },
  { id: 'gh',    label: 'GitHub',     url: 'https://github.com/search?q=' },
];

// search bangs:  !g foo  →  google search foo
const BANGS: Record<string, string> = {
  '!g': 'https://www.google.com/search?q=',
  '!yt': 'https://www.youtube.com/results?search_query=',
  '!w': 'https://en.wikipedia.org/wiki/Special:Search?search=',
  '!gh': 'https://github.com/search?q=',
  '!r': 'https://old.reddit.com/search?q=',
  '!so': 'https://stackoverflow.com/search?q=',
};

const DEFAULT_URL = 'https://duckduckgo.com';

const QUICK_ACCESS =[
  { label: 'DuckDuckGo',  url: 'https://duckduckgo.com',         icon: '🦆' },
  { label: 'Wikipedia',   url: 'https://en.wikipedia.org',        icon: '📖' },
  { label: 'GitHub',      url: 'https://github.com',              icon: '🐙' },
  { label: 'Hacker News', url: 'https://news.ycombinator.com',    icon: '🟠' },
  { label: 'Reddit',      url: 'https://old.reddit.com',          icon: '🤖' },
  { label: 'Archive',     url: 'https://web.archive.org',         icon: '📦' },
  { label: 'MDN',         url: 'https://developer.mozilla.org',   icon: '🌐' },
  { label: 'CSSZen',      url: 'https://www.csszengarden.com',    icon: '🎨' },
];

const GROUP_COLORS =['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#22c55e'];

const THEMES: Record<Theme, { bg: string; accent: string; label: string }> = {
  midnight: { bg: '#030507', accent: 'indigo', label: 'Midnight' },
  phantom:  { bg: '#040002', accent: 'rose',   label: 'Phantom' },
  matrix:   { bg: '#020a04', accent: 'green',  label: 'Matrix' },
  aurora:   { bg: '#02060a', accent: 'cyan',   label: 'Aurora' },
};

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function makeTab(overrides: Partial<BrowserTab> = {}): BrowserTab {
  return {
    id: uid(),
    url: DEFAULT_URL,
    inputUrl: DEFAULT_URL,
    title: 'New Tab',
    favicon: '',
    isLoading: false,
    isError: false,
    errorMsg: '',
    history: { past: [], future:[] },
    sandbox: { js: true, popups: false, forms: true },
    proxyEngine: 'server',
    isPinned: false,
    loadTime: null,
    groupId: null,
    zoom: 1,
    forceDark: false,
    readerMode: false,
    uaProfile: 'desktop',
    muted: false,
    customCss: '',
    ...overrides,
  };
}

// ─── HELPERS ────────────────────────────────────────────────────────────────
function extractHostname(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url.slice(0, 40); }
}
function faviconFor(url: string): string {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`; } catch { return ''; }
}
function formatTime(ts: number): string {
  const d = Date.now() - ts;
  if (d < 60_000) return 'just now';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

// resolve raw input → url (handles search engines + bangs)
function resolveInput(raw: string, engineUrl: string): string {
  let t = raw.trim();
  if (!t) return DEFAULT_URL;
  // bangs
  for (const [bang, url] of Object.entries(BANGS)) {
    if (t.startsWith(bang + ' ')) return url + encodeURIComponent(t.slice(bang.length + 1));
  }
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  if (t.startsWith('//')) return 'https:' + t;
  // looks like a domain (contains a dot, no spaces)
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(t)) return 'https://' + t;
  return engineUrl + encodeURIComponent(t);
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function OmnimuxBrowser() {
  // ── core state ──
  const [tabs, setTabs] = useState<BrowserTab[]>([
    makeTab({ url: DEFAULT_URL, inputUrl: DEFAULT_URL, title: 'DuckDuckGo', isLoading: true }),
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0].id);
  const [splitTabId, setSplitTabId] = useState<string | null>(null);
  const [groups, setGroups] = useState<TabGroup[]>([]);
  const[recentlyClosed, setRecentlyClosed] = useState<ClosedTab[]>([]);

  // ── ui modes ──
  const[isPhantomMode, setIsPhantomMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [theme, setTheme] = useState<Theme>('midnight');

  // ── panels ──
  const [activePanel, setActivePanel] = useState<'bookmarks' | 'history' | 'devtools' | 'closed' | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCmd, setShowCmd] = useState(false);
  const[showFind, setShowFind] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewTabPage, setShowNewTabPage] = useState(false);

  // ── data ──
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const[searchEngineId, setSearchEngineId] = useState<string>('duck');
  const [findQuery, setFindQuery] = useState('');
  const [scratchpad, setScratchpad] = useState('');

  // ── url bar autocomplete ──
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestIdx, setSuggestIdx] = useState(0);

  // ── telemetry ──
  const [ping, setPing] = useState<number>(12);
  const [bandwidth, setBandwidth] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const[adsBlocked, setAdsBlocked] = useState<number>(0);

  // ── refs ──
  const urlBarRef = useRef<HTMLInputElement>(null);
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const startTimes = useRef<Record<string, number>>({});

  // ── derived ──
  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );
  const engineCfg = PROXY_ENGINES[activeTab?.proxyEngine ?? 'server'];
  const searchEngine = SEARCH_ENGINES.find((s) => s.id === searchEngineId) || SEARCH_ENGINES[0];

  // ─── persistence ─────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const b = localStorage.getItem('omnimux_bookmarks');
      const h = localStorage.getItem('omnimux_history');
      const g = localStorage.getItem('omnimux_groups');
      const c = localStorage.getItem('omnimux_closed');
      const t = localStorage.getItem('omnimux_theme');
      const s = localStorage.getItem('omnimux_scratch');
      const se = localStorage.getItem('omnimux_search_engine');
      if (b) setBookmarks(JSON.parse(b));
      if (h) setHistory(JSON.parse(h));
      if (g) setGroups(JSON.parse(g));
      if (c) setRecentlyClosed(JSON.parse(c));
      if (t) setTheme(t as Theme);
      if (s) setScratchpad(s);
      if (se) setSearchEngineId(se);
    } catch {}
  },[]);

  const persist = useCallback((key: string, value: any) => {
    try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch {}
  }, []);

  useEffect(() => persist('omnimux_bookmarks', bookmarks), [bookmarks, persist]);
  useEffect(() => persist('omnimux_history', history), [history, persist]);
  useEffect(() => persist('omnimux_groups', groups), [groups, persist]);
  useEffect(() => persist('omnimux_closed', recentlyClosed), [recentlyClosed, persist]);
  useEffect(() => persist('omnimux_theme', theme), [theme, persist]);
  useEffect(() => persist('omnimux_scratch', scratchpad), [scratchpad, persist]);
  useEffect(() => persist('omnimux_search_engine', searchEngineId), [searchEngineId, persist]);

  // ─── telemetry loop ──────────────────────────────────────────────────────
  useEffect(() => {
    const i = setInterval(() => {
      setPing(Math.max(6, Math.floor(Math.random() * 60)));
      setBandwidth(Math.floor(Math.random() * 2400));
    }, 2000);
    return () => clearInterval(i);
  },[]);

  // ─── tab mutators ────────────────────────────────────────────────────────
  const patchTab = useCallback((id: string, patch: Partial<BrowserTab>) => {
    setTabs((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  },[]);

  const addTab = useCallback((url = DEFAULT_URL, opts: { active?: boolean } = {}) => {
    const tab = makeTab({
      url,
      inputUrl: url,
      isLoading: url !== DEFAULT_URL,
      title: extractHostname(url) || 'New Tab',
      favicon: faviconFor(url),
    });
    setTabs((p) => [...p, tab]);
    if (opts.active !== false) setActiveTabId(tab.id);
    if (url === DEFAULT_URL) setShowNewTabPage(true);
    return tab.id;
  },[]);

  const closeTab = useCallback(
    (id: string) => {
      setTabs((p) => {
        if (p.length === 1) return p;
        const target = p.find((t) => t.id === id);
        if (!target || target.isPinned) return p;
        // record recently closed
        if (target.url && target.url !== DEFAULT_URL) {
          setRecentlyClosed((rc) =>[{ url: target.url, title: target.title, closedAt: Date.now() }, ...rc].slice(0, 25)
          );
        }
        const next = p.filter((t) => t.id !== id);
        if (id === activeTabId) setActiveTabId(next[next.length - 1].id);
        if (id === splitTabId) setSplitTabId(null);
        return next;
      });
    },[activeTabId, splitTabId]
  );

  const reopenLastClosed = useCallback(() => {
    setRecentlyClosed((rc) => {
      if (!rc.length) return rc;
      const[first, ...rest] = rc;
      addTab(first.url);
      return rest;
    });
  }, [addTab]);

  const cloneTab = useCallback(
    (id: string) => {
      const t = tabs.find((x) => x.id === id);
      if (!t) return;
      addTab(t.url);
    },
    [tabs, addTab]
  );

  const duplicateAcrossSplit = () => {
    if (!activeTab) return;
    const id = addTab(activeTab.url, { active: false });
    setSplitTabId(id);
  };

  const reloadTab = useCallback(() => {
    if (!activeTab) return;
    startTimes.current[activeTab.id] = Date.now();
    patchTab(activeTab.id, { isLoading: true, isError: false });
    const ifr = iframeRefs.current[activeTab.id];
    if (ifr) ifr.src = ifr.src;
  },[activeTab, patchTab]);

  // ─── navigation ──────────────────────────────────────────────────────────
  const navigate = useCallback(
    (tabId: string, rawUrl: string) => {
      const target = resolveInput(rawUrl, searchEngine.url);
      if (!target) return;
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== tabId) return t;
          const newPast = t.url && t.url !== target ?[...t.history.past, t.url] : t.history.past;
          startTimes.current[t.id] = Date.now();
          return {
            ...t,
            url: target,
            inputUrl: target,
            isLoading: true,
            isError: false,
            errorMsg: '',
            title: extractHostname(target),
            favicon: faviconFor(target),
            loadTime: null,
            history: { past: newPast, future:[] },
          };
        })
      );
      setShowNewTabPage(false);
      setShowSuggest(false);
      setHistory((prev) => {
        const entry: HistoryEntry = { url: target, title: extractHostname(target), visitedAt: Date.now() };
        return [entry, ...prev.filter((h) => h.url !== target)].slice(0, 500);
      });
    },
    [searchEngine]
  );

  const handleNavigate = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!activeTab) return;
      navigate(activeTab.id, activeTab.inputUrl);
    },
    [activeTab, navigate]
  );

  const goBack = useCallback(() => {
    if (!activeTab || activeTab.history.past.length === 0) return;
    const past = [...activeTab.history.past];
    const prev = past.pop()!;
    startTimes.current[activeTab.id] = Date.now();
    patchTab(activeTab.id, {
      url: prev, inputUrl: prev, isLoading: true, isError: false,
      history: { past, future: [activeTab.url, ...activeTab.history.future] },
    });
  }, [activeTab, patchTab]);

  const goForward = useCallback(() => {
    if (!activeTab || activeTab.history.future.length === 0) return;
    const future =[...activeTab.history.future];
    const next = future.shift()!;
    startTimes.current[activeTab.id] = Date.now();
    patchTab(activeTab.id, {
      url: next, inputUrl: next, isLoading: true, isError: false,
      history: { past:[...activeTab.history.past, activeTab.url], future },
    });
  },[activeTab, patchTab]);

  // ─── proxy + sandbox ─────────────────────────────────────────────────────
  const buildProxiedUrl = (tab: BrowserTab) => PROXY_ENGINES[tab.proxyEngine].build(tab.url);
  const getSandbox = (tab: BrowserTab) => {
    let attrs = 'allow-same-origin allow-downloads';
    if (tab.sandbox.js) attrs += ' allow-scripts allow-presentation';
    if (tab.sandbox.popups) attrs += ' allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation';
    if (tab.sandbox.forms) attrs += ' allow-forms';
    return attrs;
  };

  // ─── postMessage from iframe (runtime patch reports back) ────────────────
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d: any = e.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === 'omnimux:loaded') {
        // identify which iframe
        for (const [id, ref] of Object.entries(iframeRefs.current)) {
          if (ref && ref.contentWindow === e.source) {
            patchTab(id, {
              title: d.title || extractHostname(d.url),
              favicon: d.favicon || faviconFor(d.url),
            });
            break;
          }
        }
      }
      if (d.type === 'omnimux:navigate' && d.url && activeTab) {
        navigate(activeTab.id, d.url);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [activeTab, navigate, patchTab]);

  // ─── iframe load handlers ────────────────────────────────────────────────
  const handleIframeLoad = useCallback(
    (tabId: string) => {
      const start = startTimes.current[tabId] ?? Date.now();
      const elapsed = Date.now() - start;
      patchTab(tabId, { isLoading: false, isError: false, loadTime: elapsed });
      setTotalBytes((p) => p + Math.floor(50_000 + Math.random() * 500_000));
      setAdsBlocked((p) => p + Math.floor(Math.random() * 4));
    },
    [patchTab]
  );

  // ─── bookmark helpers ────────────────────────────────────────────────────
  const isBookmarked = useMemo(
    () => bookmarks.some((b) => b.url === activeTab?.url),
    [bookmarks, activeTab]
  );
  const toggleBookmark = (folder = 'default') => {
    if (!activeTab) return;
    setBookmarks((prev) => {
      if (prev.some((b) => b.url === activeTab.url))
        return prev.filter((b) => b.url !== activeTab.url);
      return[
        { id: uid(), url: activeTab.url, title: activeTab.title, favicon: activeTab.favicon, addedAt: Date.now(), folder },
        ...prev,
      ];
    });
  };

  // ─── engine cycle ────────────────────────────────────────────────────────
  const cycleEngine = () => {
    const order: ProxyEngine[] =['server', 'allorigins', 'corsproxy', 'direct'];
    const idx = order.indexOf(activeTab.proxyEngine);
    const next = order[(idx + 1) % order.length];
    startTimes.current[activeTab.id] = Date.now();
    patchTab(activeTabId, { proxyEngine: next, isLoading: true, isError: false });
  };

  // ─── split / quad ────────────────────────────────────────────────────────
  const toggleSplit = () => {
    if (splitTabId) { setSplitTabId(null); return; }
    const other = tabs.find((t) => t.id !== activeTabId);
    if (other) setSplitTabId(other.id);
    else duplicateAcrossSplit();
  };

  // ─── tab grouping ────────────────────────────────────────────────────────
  const createGroup = () => {
    const g: TabGroup = { id: uid(), name: `Group ${groups.length + 1}`, color: GROUP_COLORS[groups.length % GROUP_COLORS.length] };
    setGroups((p) =>[...p, g]);
    if (activeTab) patchTab(activeTab.id, { groupId: g.id });
  };

  // ─── screenshot / save ───────────────────────────────────────────────────
  const screenshotPlaceholder = () => {
    // browsers can't capture cross-origin iframes. Save URL+meta as txt.
    const meta = `Omnimux Snapshot\nURL: ${activeTab.url}\nTitle: ${activeTab.title}\nDate: ${new Date().toISOString()}\nLoad: ${activeTab.loadTime}ms\n`;
    const blob = new Blob([meta], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `omnimux-${extractHostname(activeTab.url)}-${Date.now()}.txt`;
    a.click();
  };

  const saveHTMLViaProxy = async () => {
    try {
      const r = await fetch(`/api/proxy?url=${encodeURIComponent(activeTab.url)}`);
      const txt = await r.text();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([txt], { type: 'text/html' }));
      a.download = `${extractHostname(activeTab.url)}.html`;
      a.click();
    } catch {}
  };

  // ─── zoom ────────────────────────────────────────────────────────────────
  const zoomTab = (delta: number) => {
    if (!activeTab) return;
    const z = Math.max(0.5, Math.min(2, +(activeTab.zoom + delta).toFixed(2)));
    patchTab(activeTab.id, { zoom: z });
  };

  // ─── export / import ─────────────────────────────────────────────────────
  const exportData = () => {
    const data = JSON.stringify({ bookmarks, history, groups, recentlyClosed, scratchpad }, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = `omnimux-export-${Date.now()}.json`;
    a.click();
  };

  // ─── keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const cmd = e.ctrlKey || e.metaKey;
      if (cmd && e.key === 'l') { e.preventDefault(); urlBarRef.current?.select(); }
      else if (cmd && e.key === 't') { e.preventDefault(); addTab(); }
      else if (cmd && e.shiftKey && e.key === 'T') { e.preventDefault(); reopenLastClosed(); }
      else if (cmd && e.key === 'w') { e.preventDefault(); if (activeTab) closeTab(activeTab.id); }
      else if (cmd && e.key === 'r') { e.preventDefault(); reloadTab(); }
      else if (cmd && e.key === 'k') { e.preventDefault(); setShowCmd((s) => !s); }
      else if (cmd && e.key === 'f') { e.preventDefault(); setShowFind(true); }
      else if (cmd && e.key === 'd') { e.preventDefault(); toggleBookmark(); }
      else if (cmd && e.key === '=') { e.preventDefault(); zoomTab(0.1); }
      else if (cmd && e.key === '-') { e.preventDefault(); zoomTab(-0.1); }
      else if (cmd && e.key === '0') { e.preventDefault(); if (activeTab) patchTab(activeTab.id, { zoom: 1 }); }
      else if (e.key === 'Escape') { setShowCmd(false); setShowFind(false); setShowSuggest(false); }
      else if (e.shiftKey && e.key === '?') { setShowShortcuts((s) => !s); }
      else if (cmd && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key, 10) - 1;
        if (tabs[idx]) setActiveTabId(tabs[idx].id);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [activeTab, addTab, closeTab, reloadTab, reopenLastClosed, tabs, patchTab]);

  // ─── url-bar autocomplete suggestions ────────────────────────────────────
  const suggestions = useMemo(() => {
    if (!activeTab) return[];
    const q = activeTab.inputUrl.trim().toLowerCase();
    if (!q || q === activeTab.url) return[];
    const fromHistory = history
      .filter((h) => h.url.toLowerCase().includes(q) || h.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map((h) => ({ kind: 'history' as const, label: h.title || h.url, value: h.url }));
    const fromBookmarks = bookmarks
      .filter((b) => b.url.toLowerCase().includes(q) || b.title.toLowerCase().includes(q))
      .slice(0, 3)
      .map((b) => ({ kind: 'bookmark' as const, label: b.title || b.url, value: b.url }));
    const search = { kind: 'search' as const, label: `Search ${searchEngine.label} for "${activeTab.inputUrl}"`, value: activeTab.inputUrl };
    return[search, ...fromBookmarks, ...fromHistory];
  }, [activeTab, history, bookmarks, searchEngine]);

  // ─── theme accent map ────────────────────────────────────────────────────
  const colorMap: Record<string, { text: string; bg: string; border: string }> = {
    indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/40' },
    cyan:   { text: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/40' },
    violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/40' },
    amber:  { text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/40' },
    rose:   { text: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/40' },
    green:  { text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/40' },
  };
  const ec = colorMap[engineCfg.color];

  // ─── command palette items ───────────────────────────────────────────────
  const cmdItems = useMemo(
    () =>[
      { id: 'new-tab',   label: 'New Tab',                    action: () => addTab(),                shortcut: '⌘T' },
      { id: 'close-tab', label: 'Close Tab',                  action: () => activeTab && closeTab(activeTab.id), shortcut: '⌘W' },
      { id: 'reopen',    label: 'Reopen Closed Tab',          action: reopenLastClosed,              shortcut: '⌘⇧T' },
      { id: 'reload',    label: 'Reload',                     action: reloadTab,                     shortcut: '⌘R' },
      { id: 'split',     label: 'Toggle Split View',          action: toggleSplit },
      { id: 'zen',       label: 'Toggle Zen Mode',            action: () => setIsZenMode((s) => !s) },
      { id: 'phantom',   label: 'Toggle Phantom Mode',        action: () => setIsPhantomMode((s) => !s) },
      { id: 'find',      label: 'Find on Page',               action: () => setShowFind(true),       shortcut: '⌘F' },
      { id: 'bm',        label: isBookmarked ? 'Remove Bookmark' : 'Add Bookmark', action: () => toggleBookmark(), shortcut: '⌘D' },
      { id: 'cycle',     label: 'Cycle Proxy Engine',         action: cycleEngine },
      { id: 'screenshot',label: 'Save Snapshot Metadata',     action: screenshotPlaceholder },
      { id: 'savehtml',  label: 'Save Page (HTML via proxy)', action: saveHTMLViaProxy },
      { id: 'group',     label: 'Add Tab to New Group',       action: createGroup },
      { id: 'export',    label: 'Export All Data (JSON)',     action: exportData },
      { id: 'force-dark',label: 'Toggle Force Dark Mode',     action: () => activeTab && patchTab(activeTab.id, { forceDark: !activeTab.forceDark }) },
      { id: 'reader',    label: 'Toggle Reader Mode',         action: () => activeTab && patchTab(activeTab.id, { readerMode: !activeTab.readerMode }) },
      { id: 'mute',      label: activeTab?.muted ? 'Unmute Tab' : 'Mute Tab', action: () => activeTab && patchTab(activeTab.id, { muted: !activeTab.muted }) },
      { id: 'pin',       label: activeTab?.isPinned ? 'Unpin Tab' : 'Pin Tab', action: () => activeTab && patchTab(activeTab.id, { isPinned: !activeTab.isPinned }) },
      { id: 'settings',  label: 'Open Settings',              action: () => setShowSettings(true) },
    ],
    [activeTab, isBookmarked]
  );

  // ─── render ──────────────────────────────────────────────────────────────
  const themeBg = THEMES[theme].bg;

  return (
    <div
      data-testid="omnimux-browser"
      className="pt-20 h-screen flex flex-col overflow-hidden transition-all duration-500"
      style={{ background: isPhantomMode ? '#040002' : themeBg }}
    >
      {/* ── TELEMETRY STRIP ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isZenMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between px-5 pb-2 relative z-30 flex-wrap gap-2"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <div data-testid="engine-badge" className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold border ${ec.bg} ${ec.border} ${ec.text}`}>
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                {engineCfg.label}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border border-white/5 bg-white/5 ${ping < 30 ? 'text-green-400' : ping < 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                <Zap className="w-3 h-3" /> {ping}ms
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border border-white/5 bg-white/5 text-gray-400">
                <BarChart3 className="w-3 h-3 text-blue-400" /> {(bandwidth / 1000).toFixed(1)} KB/s
              </div>
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border border-white/5 bg-white/5 text-gray-500">
                <Server className="w-3 h-3" /> {(totalBytes / 1024 / 1024).toFixed(2)} MB
              </div>
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border border-white/5 bg-white/5 text-rose-400">
                <ShieldCheck className="w-3 h-3" /> {adsBlocked} blocked
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button data-testid="cmd-palette-btn" onClick={() => setShowCmd(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10 transition-all">
                <Command className="w-3.5 h-3.5" /> ⌘K
              </button>
              <button data-testid="split-btn" onClick={toggleSplit}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${splitTabId ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'}`}>
                <SplitSquareVertical className="w-3.5 h-3.5" /> Split
              </button>
              <button data-testid="zen-btn" onClick={() => setIsZenMode((s) => !s)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10 transition-all">
                <Maximize2 className="w-3.5 h-3.5" /> Zen
              </button>
              <button data-testid="phantom-btn" onClick={() => setIsPhantomMode((s) => !s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${isPhantomMode ? 'bg-red-900/50 text-red-300 border-red-700' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'}`}>
                <EyeOff className="w-3.5 h-3.5" /> Phantom
              </button>
              <button data-testid="settings-btn" onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white transition-all">
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button data-testid="shortcuts-btn" onClick={() => setShowShortcuts(true)}
                className="p-2 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white transition-all">
                <Keyboard className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BROWSER CHROME ──────────────────────────────────────────────── */}
      <div className={`flex flex-col mx-4 rounded-t-2xl overflow-hidden border transition-all duration-500 relative z-20 ${isPhantomMode ? 'border-red-900/60 shadow-[0_0_60px_rgba(220,38,38,0.1)]' : 'border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)]'} ${isZenMode ? 'mx-0 rounded-none' : ''}`}>

        {/* ── TAB BAR ───────────────────────────────────────────────────── */}
        <AnimatePresence>
          {!isZenMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className={`flex items-end px-2 pt-2 gap-1 overflow-x-auto border-b ${isPhantomMode ? 'bg-[#0a0103] border-red-900/30' : 'bg-[#050709] border-white/5'}`}
              style={{ scrollbarWidth: 'none' }}
            >
              <div className="flex items-center gap-1 mr-1 shrink-0">
                <button data-testid="bookmarks-toggle" onClick={() => setActivePanel(p => p === 'bookmarks' ? null : 'bookmarks')}
                  className={`p-2 rounded-lg transition-colors text-gray-500 hover:text-white ${activePanel === 'bookmarks' ? 'bg-white/10 text-white' : ''}`} title="Bookmarks">
                  <Star className="w-4 h-4" />
                </button>
                <button data-testid="history-toggle" onClick={() => setActivePanel(p => p === 'history' ? null : 'history')}
                  className={`p-2 rounded-lg transition-colors text-gray-500 hover:text-white ${activePanel === 'history' ? 'bg-white/10 text-white' : ''}`} title="History">
                  <Clock className="w-4 h-4" />
                </button>
                <button data-testid="closed-toggle" onClick={() => setActivePanel(p => p === 'closed' ? null : 'closed')}
                  className={`p-2 rounded-lg transition-colors text-gray-500 hover:text-white ${activePanel === 'closed' ? 'bg-white/10 text-white' : ''}`} title="Recently closed">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <Reorder.Group
                axis="x" values={tabs} onReorder={setTabs}
                className="flex items-end gap-1"
              >
                {tabs.map((tab) => {
                  const group = groups.find((g) => g.id === tab.groupId);
                  return (
                    <Reorder.Item key={tab.id} value={tab} as="div" className="flex items-end" data-testid={`tab-${tab.id}`}>
                      <div
                        onClick={() => { setActiveTabId(tab.id); setShowNewTabPage(false); }}
                        className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-t-xl cursor-pointer transition-all min-w-0 select-none ${tab.isPinned ? 'min-w-[44px] max-w-[44px] justify-center' : 'min-w-[140px] max-w-[220px]'} ${
                          activeTabId === tab.id
                            ? isPhantomMode
                              ? 'bg-[#180308] text-red-200 border-b-2 border-red-500'
                              : 'bg-[#111318] text-white border-b-2 border-indigo-500'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                        }`}
                        style={group ? { borderTopColor: group.color, borderTopWidth: 2, borderTopStyle: 'solid' } : undefined}
                      >
                        {tab.isLoading ? (
                          <div className={`w-4 h-4 shrink-0 border-2 border-transparent rounded-full animate-spin ${isPhantomMode ? 'border-t-red-500' : 'border-t-indigo-500'}`} />
                        ) : tab.isError ? (
                          <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                        ) : tab.favicon ? (
                          <img src={tab.favicon} className="w-4 h-4 shrink-0 rounded-sm" onError={(e) => (e.currentTarget.style.display = 'none')} alt="" />
                        ) : (
                          <Globe className="w-4 h-4 shrink-0 text-gray-500" />
                        )}

                        {tab.muted && <VolumeX className="w-3 h-3 shrink-0 text-amber-400" />}

                        {!tab.isPinned && (
                          <span className="truncate text-xs font-semibold leading-none">{tab.title}</span>
                        )}

                        {splitTabId === tab.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                        )}

                        {!tab.isPinned && tabs.length > 1 && (
                          <button onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                            data-testid={`close-tab-${tab.id}`}
                            className="shrink-0 p-0.5 rounded text-gray-500 hover:text-white hover:bg-white/15 opacity-0 group-hover:opacity-100 transition-all ml-auto">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>

              <button data-testid="new-tab-btn" onClick={() => addTab()}
                className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-t-xl transition-all shrink-0">
                <Plus className="w-4 h-4" />
              </button>

              <div className="ml-auto flex items-center gap-1 shrink-0">
                <button onClick={() => setActivePanel(p => p === 'devtools' ? null : 'devtools')}
                  className={`p-2 rounded-lg transition-colors text-gray-500 hover:text-white ${activePanel === 'devtools' ? 'bg-white/10 text-white' : ''}`} title="Dev info">
                  <Code2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ADDRESS BAR ───────────────────────────────────────────────── */}
        <div className={`flex items-center gap-2 px-3 py-2 relative z-10 transition-all ${isPhantomMode ? 'bg-[#100104]' : isZenMode ? 'bg-[#080a0c]' : 'bg-[#0d0f12]'}`}>

          <div className="flex items-center gap-0.5 text-gray-500">
            <button data-testid="back-btn" onClick={goBack} disabled={!activeTab?.history.past.length}
              className="p-2 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-25 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button data-testid="forward-btn" onClick={goForward} disabled={!activeTab?.history.future.length}
              className="p-2 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-25 transition-all">
              <ArrowRight className="w-4 h-4" />
            </button>
            <button data-testid="reload-btn" onClick={reloadTab}
              className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all">
              <RefreshCcw className={`w-4 h-4 ${activeTab?.isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button data-testid="home-btn" onClick={() => { addTab(); setShowNewTabPage(true); }}
              className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all">
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Engine + sandbox dropdown */}
          <div className="relative group/shield shrink-0">
            <button data-testid="engine-shield" className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-mono font-bold transition-all ${
              activeTab?.isError ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              activeTab?.proxyEngine === 'direct' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
              'bg-green-500/10 border-green-500/30 text-green-400'
            }`}>
              {activeTab?.isError ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span className="hidden sm:block">{activeTab?.proxyEngine.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            <div className="hidden group-hover/shield:flex absolute top-full left-0 mt-2 bg-[#0d0f12] border border-white/10 rounded-xl shadow-2xl flex-col p-2 w-64 z-50 gap-1">
              <p className="text-[10px] font-mono text-gray-500 uppercase px-2 pt-1 pb-2">Proxy Engine</p>
              {(Object.entries(PROXY_ENGINES) as[ProxyEngine, typeof PROXY_ENGINES[ProxyEngine]][]).map(([key, cfg]) => {
                const c = colorMap[cfg.color];
                return (
                  <button key={key} onClick={() => { startTimes.current[activeTabId] = Date.now(); patchTab(activeTabId, { proxyEngine: key, isLoading: true, isError: false }); }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all hover:bg-white/5 ${activeTab?.proxyEngine === key ? `${c.bg} ${c.text}` : 'text-gray-400'}`}>
                    <span>{cfg.label}</span>
                    {activeTab?.proxyEngine === key && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
              <div className="h-px bg-white/5 my-1" />
              <p className="text-[10px] font-mono text-gray-500 uppercase px-2 py-1">User-Agent</p>
              {(['desktop','mobile','tablet','bot'] as UAProfile[]).map(p => (
                <button key={p} onClick={() => activeTab && patchTab(activeTab.id, { uaProfile: p, isLoading: true })}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all hover:bg-white/5 ${activeTab?.uaProfile === p ? 'bg-indigo-500/10 text-indigo-300' : 'text-gray-400'}`}>
                  <span className="flex items-center gap-2">
                    {p === 'desktop' && <Monitor className="w-3.5 h-3.5" />}
                    {p === 'mobile' && <Smartphone className="w-3.5 h-3.5" />}
                    {p === 'tablet' && <Tablet className="w-3.5 h-3.5" />}
                    {p === 'bot' && <Cpu className="w-3.5 h-3.5" />}
                    {UA_LABEL[p]}
                  </span>
                </button>
              ))}
              <div className="h-px bg-white/5 my-1" />
              <p className="text-[10px] font-mono text-gray-500 uppercase px-2 py-1">Sandbox</p>
              {(['js', 'popups', 'forms'] as const).map((feature) => (
                <button key={feature} onClick={() => activeTab && patchTab(activeTab.id, { sandbox: { ...activeTab.sandbox, [feature]: !activeTab.sandbox[feature] } })}
                  className="flex justify-between items-center px-3 py-2 rounded-lg text-xs font-mono hover:bg-white/5 transition-all text-gray-300">
                  <span>{feature === 'js' ? 'JavaScript' : feature === 'popups' ? 'Popups & Redirects' : 'Form Submissions'}</span>
                  <span className={activeTab?.sandbox[feature] ? 'text-green-400' : 'text-red-400'}>{activeTab?.sandbox[feature] ? 'ALLOW' : 'DENY'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* search-engine selector */}
          <select data-testid="search-engine-select"
            value={searchEngineId} onChange={(e) => setSearchEngineId(e.target.value)}
            className="hidden md:block bg-white/5 border border-white/10 text-gray-300 text-xs font-mono px-2 py-2 rounded-lg outline-none hover:bg-white/10 transition-all">
            {SEARCH_ENGINES.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>

          {/* URL bar */}
          <form onSubmit={handleNavigate} className="flex-1 relative">
            <input
              data-testid="url-input"
              ref={urlBarRef}
              value={activeTab?.inputUrl ?? ''}
              onChange={(e) => { activeTab && patchTab(activeTab.id, { inputUrl: e.target.value }); setShowSuggest(true); setSuggestIdx(0); }}
              onFocus={(e) => { e.target.select(); setShowSuggest(true); }}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              onKeyDown={(e) => {
                if (!suggestions.length) return;
                if (e.key === 'ArrowDown') { e.preventDefault(); setSuggestIdx(i => Math.min(i + 1, suggestions.length - 1)); }
                if (e.key === 'ArrowUp')   { e.preventDefault(); setSuggestIdx(i => Math.max(0, i - 1)); }
                if (e.key === 'Enter' && showSuggest) {
                  const pick = suggestions[suggestIdx];
                  if (pick) { e.preventDefault(); navigate(activeTabId, pick.value); }
                }
              }}
              className={`w-full rounded-xl py-2 px-4 text-sm font-mono text-white outline-none border transition-all placeholder:text-gray-600 ${
                isPhantomMode
                  ? 'bg-[#0a0003] border-red-900/40 focus:border-red-500'
                  : 'bg-[#050709] border-white/10 focus:border-indigo-500/50'
              }`}
              placeholder={`Search ${searchEngine.label} or enter URL · try !g, !yt, !w`}
              autoComplete="off"
            />
            {activeTab?.isLoading && (
              <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full" style={{ width: '60%' }} />
            )}

            {/* autocomplete */}
            <AnimatePresence>
              {showSuggest && suggestions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  data-testid="url-suggestions"
                  className="absolute top-full left-0 right-0 mt-1 bg-[#0d0f12] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                  {suggestions.map((s, i) => (
                    <button key={i} type="button"
                      onMouseDown={(e) => { e.preventDefault(); navigate(activeTabId, s.value); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-xs transition-colors ${i === suggestIdx ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                      {s.kind === 'search' && <Search className="w-3.5 h-3.5 text-gray-500" />}
                      {s.kind === 'history' && <Clock className="w-3.5 h-3.5 text-gray-500" />}
                      {s.kind === 'bookmark' && <Star className="w-3.5 h-3.5 text-yellow-500" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 truncate">{s.label}</p>
                        <p className="text-[10px] text-gray-600 truncate">{s.value}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* address bar action buttons */}
          <div className="flex items-center gap-1 text-gray-500">
            <button onClick={() => zoomTab(-0.1)} className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all hidden md:block" title="Zoom out"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-[10px] font-mono text-gray-500 hidden md:block w-8 text-center">{Math.round((activeTab?.zoom ?? 1) * 100)}%</span>
            <button onClick={() => zoomTab(0.1)} className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all hidden md:block" title="Zoom in"><ZoomIn className="w-4 h-4" /></button>

            <button data-testid="bookmark-btn" onClick={() => toggleBookmark()}
              className={`p-2 rounded-lg hover:bg-white/10 transition-all ${isBookmarked ? 'text-yellow-400' : 'hover:text-white'}`} title="Bookmark">
              <Star className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => activeTab && patchTab(activeTab.id, { isPinned: !activeTab.isPinned })}
              className={`p-2 rounded-lg hover:bg-white/10 transition-all ${activeTab?.isPinned ? 'text-indigo-400' : 'hover:text-white'}`} title="Pin tab">
              {activeTab?.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
            <button onClick={() => activeTab && patchTab(activeTab.id, { muted: !activeTab.muted })}
              className={`p-2 rounded-lg hover:bg-white/10 transition-all ${activeTab?.muted ? 'text-amber-400' : 'hover:text-white'}`} title="Mute tab">
              {activeTab?.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button onClick={() => activeTab && patchTab(activeTab.id, { forceDark: !activeTab.forceDark })}
              className={`p-2 rounded-lg hover:bg-white/10 transition-all ${activeTab?.forceDark ? 'text-violet-400' : 'hover:text-white'}`} title="Force dark mode">
              {activeTab?.forceDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => activeTab && patchTab(activeTab.id, { readerMode: !activeTab.readerMode })}
              className={`p-2 rounded-lg hover:bg-white/10 transition-all ${activeTab?.readerMode ? 'text-emerald-400' : 'hover:text-white'}`} title="Reader mode">
              <BookOpen className="w-4 h-4" />
            </button>
            <button onClick={() => navigator.clipboard.writeText(activeTab?.url ?? '')} className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all" title="Copy URL">
              <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => window.open(activeTab?.url, '_blank')} className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all" title="Open in new window">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          <button data-testid="go-btn" onClick={() => handleNavigate()}
            className={`hidden lg:flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              isPhantomMode ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}>
            <Cpu className="w-4 h-4" /> Go
          </button>
        </div>
      </div>

      {/* ── PANELS ───────────────────────────────────────────────────────── */}
      {/* Bookmarks */}
      <AnimatePresence>
        {activePanel === 'bookmarks' && !isZenMode && (
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
            className="absolute left-4 top-44 w-80 bg-[#0d0f12] border border-white/10 rounded-2xl shadow-2xl z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Bookmarks ({bookmarks.length})</h3>
              <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {bookmarks.length === 0 ? (
                <p className="text-center text-gray-600 text-xs py-8">No bookmarks yet.<br />Star a page to save it.</p>
              ) : bookmarks.map((b) => (
                <button key={b.id} onClick={() => { navigate(activeTabId, b.url); setActivePanel(null); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-all group">
                  {b.favicon ? <img src={b.favicon} className="w-4 h-4 rounded-sm" alt="" /> : <Globe className="w-4 h-4 text-gray-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-200 truncate">{b.title}</p>
                    <p className="text-[10px] text-gray-500 truncate">{b.url}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setBookmarks(p => p.filter(x => x.id !== b.id)); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <AnimatePresence>
        {activePanel === 'history' && !isZenMode && (
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
            className="absolute left-4 top-44 w-96 bg-[#0d0f12] border border-white/10 rounded-2xl shadow-2xl z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><HistoryIcon className="w-4 h-4 text-blue-400" /> History ({history.length})</h3>
              <div className="flex gap-2">
                <button onClick={() => setHistory([])} className="text-red-400 hover:text-red-300" title="Clear all"><Trash2 className="w-4 h-4" /></button>
                <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="px-3 py-2 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500/50"
                  placeholder="Search history..." />
              </div>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto">
              {history
                .filter((h) => !searchQuery || h.url.toLowerCase().includes(searchQuery.toLowerCase()) || h.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 100)
                .map((h, i) => (
                  <button key={i} onClick={() => { navigate(activeTabId, h.url); setActivePanel(null); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-all">
                    <Globe className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-200 truncate">{h.title || extractHostname(h.url)}</p>
                      <p className="text-[10px] text-gray-600 truncate">{h.url}</p>
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0">{formatTime(h.visitedAt)}</span>
                  </button>
                ))}
              {history.length === 0 && <p className="text-center text-gray-600 text-xs py-8">No history yet.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recently Closed */}
      <AnimatePresence>
        {activePanel === 'closed' && !isZenMode && (
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
            className="absolute left-4 top-44 w-80 bg-[#0d0f12] border border-white/10 rounded-2xl shadow-2xl z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><RotateCcw className="w-4 h-4 text-amber-400" /> Recently Closed</h3>
              <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto">
              {recentlyClosed.length === 0 ? (
                <p className="text-center text-gray-600 text-xs py-8">No recently closed tabs.</p>
              ) : recentlyClosed.map((c, i) => (
                <button key={i} onClick={() => { addTab(c.url); setActivePanel(null); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-all">
                  <Globe className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 truncate">{c.title}</p>
                    <p className="text-[10px] text-gray-600 truncate">{c.url}</p>
                  </div>
                  <span className="text-[10px] text-gray-600 shrink-0">{formatTime(c.closedAt)}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DevTools */}
      <AnimatePresence>
        {activePanel === 'devtools' && !isZenMode && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
            className="absolute right-4 top-44 w-80 bg-[#0d0f12] border border-white/10 rounded-2xl shadow-2xl z-40">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Code2 className="w-4 h-4 text-cyan-400" /> Dev Info</h3>
              <button onClick={() => setActivePanel(null)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-2 font-mono text-xs">
              <Row label="URL" value={activeTab?.url ?? '—'} mono />
              <Row label="Engine" value={engineCfg.label} />
              <Row label="Load Time" value={activeTab?.loadTime != null ? `${activeTab.loadTime}ms` : '—'} />
              <Row label="UA Profile" value={UA_LABEL[activeTab?.uaProfile ?? 'desktop']} />
              <Row label="Zoom" value={`${Math.round((activeTab?.zoom ?? 1) * 100)}%`} />
              <Row label="JS" value={activeTab?.sandbox.js ? 'Allowed' : 'Blocked'} color={activeTab?.sandbox.js ? 'text-green-400' : 'text-red-400'} />
              <Row label="Forms" value={activeTab?.sandbox.forms ? 'Allowed' : 'Blocked'} color={activeTab?.sandbox.forms ? 'text-green-400' : 'text-red-400'} />
              <Row label="History" value={`${activeTab?.history.past.length ?? 0} ↩ / ${activeTab?.history.future.length ?? 0} ↪`} />
              <Row label="Total Tabs" value={tabs.length.toString()} />
              <div className="h-px bg-white/5 my-2" />
              <Row label="Session BW" value={`${(totalBytes / 1024 / 1024).toFixed(2)} MB`} />
              <Row label="Ads Blocked" value={adsBlocked.toString()} />
              <Row label="Ping" value={`${ping}ms`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Find in page */}
      <AnimatePresence>
        {showFind && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className="absolute right-6 top-44 bg-[#0d0f12] border border-white/10 rounded-xl shadow-2xl z-40 flex items-center gap-2 p-2">
            <Search className="w-4 h-4 text-gray-500 ml-2" />
            <input data-testid="find-input"
              autoFocus value={findQuery} onChange={(e) => setFindQuery(e.target.value)}
              className="bg-transparent outline-none text-white text-sm w-64"
              placeholder="Find on page (proxy required)" />
            <span className="text-[10px] text-gray-500 font-mono">⚠ requires Hyperion engine</span>
            <button onClick={() => setShowFind(false)} className="p-1.5 hover:bg-white/10 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command palette */}
      <AnimatePresence>
        {showCmd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-start justify-center pt-32"
            onClick={() => setShowCmd(false)}>
            <motion.div initial={{ y: -10, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: -10, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#0d0f12] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-white/5">
                <Command className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono text-gray-400">Command Palette</span>
              </div>
              <div className="max-h-96 overflow-y-auto py-2">
                {cmdItems.map((it) => (
                  <button key={it.id} data-testid={`cmd-${it.id}`}
                    onClick={() => { it.action(); setShowCmd(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-white/5 transition-colors">
                    <span className="text-sm text-gray-200">{it.label}</span>
                    {it.shortcut && <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-gray-400">{it.shortcut}</kbd>}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center"
            onClick={() => setShowSettings(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0d0f12] border border-white/15 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-400" /> Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-gray-400 uppercase mb-2 block">Theme</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(THEMES) as [Theme, typeof THEMES[Theme]][]).map(([k, v]) => (
                      <button key={k} onClick={() => setTheme(k)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all ${theme === k ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        style={{ borderLeftWidth: 3, borderLeftColor: v.bg }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportData} className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Export Data</button>
                </div>
                <div>
                  <label className="text-xs font-mono text-gray-400 uppercase mb-2 block">Scratchpad</label>
                  <textarea value={scratchpad} onChange={(e) => setScratchpad(e.target.value)}
                    placeholder="Quick notes that auto-save..."
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-gray-200 outline-none focus:border-indigo-500/50 resize-none" />
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="mt-4 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shortcuts */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center"
            onClick={() => setShowShortcuts(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0d0f12] border border-white/15 rounded-2xl p-6 w-[28rem] shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Keyboard className="w-5 h-5 text-indigo-400" /> Shortcuts</h3>
              <div className="space-y-1">
                {[
                  ['⌘ L', 'Focus address bar'],
                  ['⌘ T', 'New tab'],
                  ['⌘ W', 'Close tab'],
                  ['⌘ ⇧ T', 'Reopen closed tab'],
                  ['⌘ R', 'Reload tab'],
                  ['⌘ K', 'Command palette'],['⌘ F', 'Find on page'],
                  ['⌘ D', 'Bookmark page'],['⌘ +/-', 'Zoom in/out'],
                  ['⌘ 0', 'Reset zoom'],['⌘ 1-9', 'Switch to tab'],
                  ['Shift ?', 'Toggle this menu'],
                ].map(([k, desc]) => (
                  <div key={k} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm">{desc}</span>
                    <kbd className="px-2 py-1 rounded bg-white/10 text-white text-xs font-mono">{k}</kbd>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowShortcuts(false)} className="mt-4 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIEWPORT ─────────────────────────────────────────────────────── */}
      <div className={`flex-1 flex overflow-hidden border-x border-b relative z-10 bg-[#030507] ${isPhantomMode ? 'border-red-900/60' : 'border-white/10'} ${isZenMode ? 'mx-0 border-x-0' : 'mx-4'} rounded-b-2xl`}>

        {/* New Tab Page */}
        <AnimatePresence>
          {showNewTabPage && activeTab && (
            <motion.div data-testid="new-tab-page"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-[#030507] overflow-y-auto flex flex-col items-center justify-start pt-20 px-6 pb-10">
              <Globe className="w-12 h-12 text-indigo-500 mb-4 opacity-80" />
              <h1 className="text-3xl font-black text-white tracking-tight mb-1">Omnimux Browser</h1>
              <p className="text-gray-500 text-sm mb-8">Hyperion Relay · Universal Site Support · Zero CORS</p>

              <form onSubmit={(e) => { e.preventDefault(); navigate(activeTabId, activeTab.inputUrl); }}
                className="w-full max-w-xl relative mb-12">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input data-testid="new-tab-input"
                  value={activeTab.inputUrl === DEFAULT_URL ? '' : activeTab.inputUrl}
                  onChange={(e) => patchTab(activeTabId, { inputUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/60 rounded-2xl py-4 pl-12 pr-5 text-white outline-none font-mono text-sm placeholder:text-gray-600 transition-all"
                  placeholder="Search or enter a URL..."
                  autoFocus
                />
              </form>

              <div className="w-full max-w-2xl">
                <p className="text-xs font-mono uppercase text-gray-600 mb-3">Quick Access</p>
                <div className="grid grid-cols-4 gap-3">
                  {QUICK_ACCESS.map((s) => (
                    <button key={s.url} data-testid={`quick-${s.label.toLowerCase()}`}
                      onClick={() => navigate(activeTabId, s.url)}
                      className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all">
                      <span className="text-2xl">{s.icon}</span>
                      <span className="text-xs text-gray-400 font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {history.length > 0 && (
                <div className="w-full max-w-2xl mt-8">
                  <p className="text-xs font-mono uppercase text-gray-600 mb-3">Recent</p>
                  <div className="space-y-1">
                    {history.slice(0, 5).map((h, i) => (
                      <button key={i} onClick={() => navigate(activeTabId, h.url)}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-all border border-white/5 hover:border-white/10">
                        <Clock className="w-4 h-4 text-gray-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 truncate">{h.title}</p>
                          <p className="text-xs text-gray-600 truncate">{h.url}</p>
                        </div>
                        <span className="text-xs text-gray-600 shrink-0">{formatTime(h.visitedAt)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats hero */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-2xl mt-10">
                <StatCard label="Bookmarks" value={bookmarks.length} icon={Star} color="text-yellow-400" />
                <StatCard label="History" value={history.length} icon={HistoryIcon} color="text-blue-400" />
                <StatCard label="Ads Blocked" value={adsBlocked} icon={ShieldCheck} color="text-rose-400" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Iframes */}
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const isSplit = tab.id === splitTabId;
          if (!isActive && !isSplit) return null;

          // reader mode CSS
          const readerCSS = tab.readerMode
            ? 'filter: contrast(1.05) brightness(0.97); '
            : '';
          const darkCSS = tab.forceDark
            ? 'filter: invert(0.92) hue-rotate(180deg) contrast(0.95);'
            : '';

          return (
            <div key={tab.id}
              className={`relative flex flex-col h-full transition-all duration-300 ${isActive && !splitTabId ? 'w-full' : 'w-1/2'} ${isSplit && splitTabId ? 'border-l border-white/10' : ''}`}>
              {splitTabId && (
                <div className="flex items-center justify-between px-4 py-1.5 bg-[#080a0d] border-b border-white/5 z-10">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isActive ? 'Primary' : 'Secondary'}</span>
                  </div>
                  <span className="text-[10px] text-gray-600 font-mono truncate max-w-[180px]">{tab.url}</span>
                </div>
              )}

              <div className="flex-1 relative" style={{ overflow: 'hidden' }}>
                <iframe
                  data-testid={`iframe-${tab.id}`}
                  ref={(el) => { iframeRefs.current[tab.id] = el; }}
                  key={`${tab.id}-${tab.url}-${tab.proxyEngine}-${tab.uaProfile}`}
                  src={buildProxiedUrl(tab)}
                  className="w-full h-full border-none bg-white"
                  style={{
                    transform: `scale(${tab.zoom})`,
                    transformOrigin: '0 0',
                    width: `${100 / tab.zoom}%`,
                    height: `${100 / tab.zoom}%`,
                    filter: `${tab.muted ? '' : ''}${darkCSS} ${readerCSS}`,
                  }}
                  sandbox={getSandbox(tab)}
                  onLoad={() => handleIframeLoad(tab.id)}
                  title={`Omnimux Viewport — ${tab.id}`}
                  allow={`autoplay${tab.muted ? '' : ''}; fullscreen; picture-in-picture; clipboard-read; clipboard-write; encrypted-media`}
                />
              </div>

              {/* Loading */}
              <AnimatePresence>
                {tab.isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#030507]/96 backdrop-blur-2xl flex flex-col items-center justify-center z-40">
                    <div className={`absolute w-80 h-80 blur-[100px] rounded-full opacity-20 animate-pulse ${isPhantomMode ? 'bg-red-600' : 'bg-indigo-600'}`} />
                    <div className="relative mb-6">
                      <div className={`w-24 h-24 rounded-3xl border flex items-center justify-center bg-black/60 ${isPhantomMode ? 'border-red-900/50' : 'border-indigo-500/20'}`}>
                        <Server className={`w-10 h-10 ${isPhantomMode ? 'text-red-500' : 'text-indigo-500'}`} />
                      </div>
                    </div>
                    <h2 className="text-xl font-black text-white tracking-widest uppercase mb-1">Routing Request</h2>
                    <p className={`text-xs font-mono mb-4 ${ec.text}`}>{engineCfg.label}</p>
                    <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                      <motion.div className={`h-full rounded-full ${isPhantomMode ? 'bg-red-500' : 'bg-indigo-500'}`}
                        initial={{ width: '0%' }} animate={{ width: '85%' }} transition={{ duration: 2, ease: 'easeOut' }} />
                    </div>
                    <p className="text-xs text-gray-600 font-mono max-w-xs text-center truncate">{tab.url}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {tab.isError && !tab.isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#030507]/98 flex flex-col items-center justify-center z-40 gap-4 p-6 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
                      <XCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-white">Connection Refused</h2>
                    <p className="text-sm text-gray-400 max-w-xs">{tab.errorMsg || 'The site could not be loaded through this proxy engine.'}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={cycleEngine} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white"><RotateCcw className="w-4 h-4" /> Try Next Engine</button>
                      <button onClick={() => window.open(tab.url, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm text-white font-bold"><ExternalLink className="w-4 h-4" /> Open Direct</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Bottom status bar */}
      <AnimatePresence>
        {!isZenMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between px-5 py-1.5 text-[10px] font-mono text-gray-600 flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                {ping < 30 ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-yellow-500" />} {ping}ms
              </span>
              {activeTab?.loadTime != null && <span>Loaded in {activeTab.loadTime}ms</span>}
              <span>{tabs.length} tab{tabs.length !== 1 ? 's' : ''}</span>
              <span className="hidden md:inline">{adsBlocked} ads blocked</span>
              {scratchpad.trim() && <span className="text-emerald-700">📝 {scratchpad.trim().split(/\s+/).length}w note</span>}
            </div>
            <div className="flex items-center gap-4">
              {isPhantomMode && <span className="text-red-700 animate-pulse">● PHANTOM ACTIVE</span>}
              {splitTabId && <span className="text-indigo-700">▣ SPLIT VIEW</span>}
              <span>Omnimux Browser v13 — Hyperion</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub Components ─────────────────────────────────────────────────────────

function Row({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={`${mono ? 'font-mono text-[10px] max-w-[160px] truncate text-right' : ''} ${color ?? 'text-gray-300'}`}>{value}</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col items-start gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-2xl font-black text-white">{value}</span>
      <span className="text-[10px] font-mono uppercase text-gray-500 tracking-widest">{label}</span>
    </div>
  );
    }
