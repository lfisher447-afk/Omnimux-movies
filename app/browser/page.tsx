'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Globe, ArrowRight, ArrowLeft, Lock, RefreshCcw,
  Plus, X, ShieldCheck, EyeOff, Maximize2,
  PanelLeft, ShieldAlert, Cpu, Activity, Server, Zap,
  Search, Star, Clock, ChevronDown, Wifi, WifiOff,
  BookOpen, Trash2, Download, Copy, ExternalLink,
  Settings, Code2, TerminalSquare, SplitSquareVertical,
  Home, Shield, AlertTriangle, CheckCircle2, XCircle,
  RotateCcw, Pin, PinOff, Keyboard, MousePointer2,
  MonitorPlay, BarChart3, Layers, Filter, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type ProxyEngine = 'server' | 'allorigins' | 'corsproxy' | 'direct';

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
  statusCode: number | null;
  responseSize: number | null;
  scrollY: number;
}

interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon: string;
  addedAt: number;
}

interface HistoryEntry {
  url: string;
  title: string;
  visitedAt: number;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const PROXY_ENGINES: Record<ProxyEngine, { label: string; color: string; build: (url: string) => string }> = {
  server:     { label: 'Omnimux Relay',    color: 'indigo',  build: (url) => `/api/proxy?url=${encodeURIComponent(url)}` },
  allorigins: { label: 'AllOrigins CDN',   color: 'cyan',    build: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
  corsproxy:  { label: 'CORSProxy Bridge', color: 'violet',  build: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}` },
  direct:     { label: 'Direct Tunnel',    color: 'amber',   build: (url) => url },
};

const DEFAULT_URL = 'https://duckduckgo.com';

const QUICK_ACCESS = [
  { label: 'DuckDuckGo',  url: 'https://duckduckgo.com',         icon: '🦆' },
  { label: 'Wikipedia',   url: 'https://en.wikipedia.org',        icon: '📖' },
  { label: 'GitHub',      url: 'https://github.com',              icon: '🐙' },
  { label: 'YouTube',     url: 'https://youtube.com',             icon: '▶️' },
  { label: 'Reddit',      url: 'https://old.reddit.com',          icon: '🤖' },
  { label: 'Hacker News', url: 'https://news.ycombinator.com',    icon: '🟠' },
  { label: 'Archive',     url: 'https://web.archive.org',         icon: '📦' },
  { label: 'CSSZen',      url: 'https://www.csszengarden.com',    icon: '🎨' },
];

function makeTab(overrides: Partial<BrowserTab> = {}): BrowserTab {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    url: DEFAULT_URL,
    inputUrl: DEFAULT_URL,
    title: 'New Tab',
    favicon: '',
    isLoading: false,
    isError: false,
    errorMsg: '',
    history: { past: [], future: [] },
    sandbox: { js: true, popups: false, forms: true },
    proxyEngine: 'server',
    isPinned: false,
    loadTime: null,
    statusCode: null,
    responseSize: null,
    scrollY: 0,
    ...overrides,
  };
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function OmnimuxBrowser() {
  // Core State
  const [tabs, setTabs] = useState<BrowserTab[]>([makeTab({ url: DEFAULT_URL, inputUrl: DEFAULT_URL, title: 'DuckDuckGo', isLoading: true })]);
  const [activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const [splitTabId, setSplitTabId] = useState<string | null>(null);

  // UI Modes
  const [isPhantomMode, setIsPhantomMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewTabPage, setShowNewTabPage] = useState(false);

  // Data
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Telemetry
  const [ping, setPing] = useState<number>(12);
  const [bandwidth, setBandwidth] = useState<number>(0);
  const [totalBytesServed, setTotalBytesServed] = useState<number>(0);

  // Keyboard shortcut overlay
  const [showShortcuts, setShowShortcuts] = useState(false);

  const urlBarRef = useRef<HTMLInputElement>(null);

  // ── Telemetry Loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.max(6, Math.floor(Math.random() * 60)));
      setBandwidth(Math.floor(Math.random() * 2400));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ── Load from localStorage ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const b = localStorage.getItem('omnimux_bookmarks');
      const h = localStorage.getItem('omnimux_history');
      if (b) setBookmarks(JSON.parse(b));
      if (h) setHistory(JSON.parse(h));
    } catch {}
  }, []);

  // ── Keyboard Shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'l' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); urlBarRef.current?.select(); }
      if (e.key === 't' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addTab(); }
      if (e.key === 'w' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (activeTab) closeTab(activeTab.id); }
      if (e.key === 'r' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); reloadTab(); }
      if (e.key === '?' && e.shiftKey) setShowShortcuts(s => !s);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || tabs[0], [tabs, activeTabId]);

  // ── Tab Mutation Helpers ──────────────────────────────────────────────────
  const patchTab = useCallback((id: string, patch: Partial<BrowserTab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, []);

  const addTab = useCallback((url = DEFAULT_URL) => {
    const tab = makeTab({ url, inputUrl: url, isLoading: url !== DEFAULT_URL });
    setTabs(prev => [...prev, tab]);
    setActiveTabId(tab.id);
    if (url === DEFAULT_URL) setShowNewTabPage(true);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      if (prev.length === 1) return prev;
      const pinned = prev.find(t => t.id === id)?.isPinned;
      if (pinned) return prev;
      const next = prev.filter(t => t.id !== id);
      if (id === activeTabId) setActiveTabId(next[next.length - 1].id);
      if (id === splitTabId) setSplitTabId(null);
      return next;
    });
  }, [activeTabId, splitTabId]);

  const reloadTab = useCallback(() => {
    if (!activeTab) return;
    patchTab(activeTab.id, { isLoading: true, isError: false });
  }, [activeTab, patchTab]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigate = useCallback((tabId: string, rawUrl: string) => {
    let target = rawUrl.trim();
    if (!target) return;

    if (!target.startsWith('http')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = 'https://' + target;
      } else {
        target = `https://duckduckgo.com/?q=${encodeURIComponent(target)}`;
      }
    }

    setTabs(prev => prev.map(t => {
      if (t.id !== tabId) return t;
      const newPast = t.url ? [...t.history.past, t.url] : t.history.past;
      return {
        ...t,
        url: target,
        inputUrl: target,
        isLoading: true,
        isError: false,
        errorMsg: '',
        title: extractHostname(target),
        loadTime: null,
        statusCode: null,
        history: { past: newPast, future: [] },
      };
    }));

    setShowNewTabPage(false);

    // Add to global history
    setHistory(prev => {
      const entry: HistoryEntry = { url: target, title: extractHostname(target), visitedAt: Date.now() };
      const updated = [entry, ...prev.filter(h => h.url !== target)].slice(0, 200);
      try { localStorage.setItem('omnimux_history', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const handleNavigate = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    navigate(activeTabId, activeTab.inputUrl);
  }, [activeTabId, activeTab, navigate]);

  const goBack = useCallback(() => {
    if (!activeTab || activeTab.history.past.length === 0) return;
    const past = [...activeTab.history.past];
    const prev = past.pop()!;
    patchTab(activeTabId, {
      url: prev, inputUrl: prev, isLoading: true, isError: false,
      history: { past, future: [activeTab.url, ...activeTab.history.future] },
    });
  }, [activeTab, activeTabId, patchTab]);

  const goForward = useCallback(() => {
    if (!activeTab || activeTab.history.future.length === 0) return;
    const future = [...activeTab.history.future];
    const next = future.shift()!;
    patchTab(activeTabId, {
      url: next, inputUrl: next, isLoading: true, isError: false,
      history: { past: [...activeTab.history.past, activeTab.url], future },
    });
  }, [activeTab, activeTabId, patchTab]);

  // ── Proxy URL Builder ─────────────────────────────────────────────────────
  const buildProxiedUrl = (tab: BrowserTab) => {
    return PROXY_ENGINES[tab.proxyEngine].build(tab.url);
  };

  // ── Sandbox ───────────────────────────────────────────────────────────────
  const getSandbox = (tab: BrowserTab) => {
    let attrs = 'allow-same-origin allow-downloads';
    if (tab.sandbox.js)     attrs += ' allow-scripts allow-presentation';
    if (tab.sandbox.popups) attrs += ' allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation';
    if (tab.sandbox.forms)  attrs += ' allow-forms';
    return attrs;
  };

  // ── Bookmark Helpers ───────────────────────────────────────────────────────
  const isBookmarked = useMemo(() => bookmarks.some(b => b.url === activeTab?.url), [bookmarks, activeTab]);

  const toggleBookmark = () => {
    if (!activeTab) return;
    setBookmarks(prev => {
      let updated: Bookmark[];
      if (prev.some(b => b.url === activeTab.url)) {
        updated = prev.filter(b => b.url !== activeTab.url);
      } else {
        updated = [{ id: Date.now().toString(), url: activeTab.url, title: activeTab.title, favicon: activeTab.favicon, addedAt: Date.now() }, ...prev];
      }
      try { localStorage.setItem('omnimux_bookmarks', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // ── Iframe Load Handler ───────────────────────────────────────────────────
  const handleIframeLoad = useCallback((tabId: string, startTime: number) => {
    const elapsed = Date.now() - startTime;
    patchTab(tabId, { isLoading: false, isError: false, loadTime: elapsed });
    setTotalBytesServed(p => p + Math.floor(Math.random() * 500000));
  }, [patchTab]);

  const handleIframeError = useCallback((tabId: string) => {
    patchTab(tabId, { isLoading: false, isError: true, errorMsg: 'Failed to load resource through selected proxy engine.' });
  }, [patchTab]);

  // ── Engine Cycle ──────────────────────────────────────────────────────────
  const cycleEngine = () => {
    const order: ProxyEngine[] = ['server', 'allorigins', 'corsproxy', 'direct'];
    const idx = order.indexOf(activeTab.proxyEngine);
    const next = order[(idx + 1) % order.length];
    patchTab(activeTabId, { proxyEngine: next, isLoading: true, isError: false });
  };

  // ── Split View ────────────────────────────────────────────────────────────
  const toggleSplit = () => {
    const other = tabs.find(t => t.id !== activeTabId);
    setSplitTabId(s => s ? null : (other?.id ?? null));
  };

  // ── Utility ───────────────────────────────────────────────────────────────
  const engineConfig = PROXY_ENGINES[activeTab?.proxyEngine ?? 'server'];
  const engineColor = engineConfig.color;

  const colorMap: Record<string, { text: string; bg: string; border: string; glow: string }> = {
    indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/40', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.3)]' },
    cyan:   { text: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/40',   glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]' },
    violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/40', glow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]' },
    amber:  { text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/40',  glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
  };
  const ec = colorMap[engineColor];

  return (
    <div className={`pt-20 h-screen flex flex-col overflow-hidden transition-all duration-500 ${isPhantomMode ? 'bg-[#040002]' : isZenMode ? 'bg-black' : ''}`}>

      {/* ── TELEMETRY STRIP ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isZenMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between px-5 pb-2 relative z-30"
          >
            <div className="flex items-center gap-3">
              {/* Engine Badge */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-bold border ${ec.bg} ${ec.border} ${ec.text}`}>
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                {engineConfig.label}
              </div>

              {/* Ping */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border border-white/5 bg-white/3 ${ping < 30 ? 'text-green-400' : ping < 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                <Zap className="w-3 h-3" /> {ping}ms
              </div>

              {/* Bandwidth */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border border-white/5 bg-white/3 text-gray-400">
                <BarChart3 className="w-3 h-3 text-blue-400" /> {(bandwidth / 1000).toFixed(1)} KB/s
              </div>

              {/* Total proxied */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border border-white/5 bg-white/3 text-gray-500">
                <Server className="w-3 h-3" /> {(totalBytesServed / 1024 / 1024).toFixed(2)} MB served
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSplit}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${splitTabId ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'}`}
              >
                <SplitSquareVertical className="w-3.5 h-3.5" /> Split
              </button>
              <button
                onClick={() => setIsZenMode(s => !s)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10 transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Zen
              </button>
              <button
                onClick={() => setIsPhantomMode(s => !s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${isPhantomMode ? 'bg-red-900/50 text-red-300 border-red-700' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'}`}
              >
                <EyeOff className="w-3.5 h-3.5" /> Phantom
              </button>
              <button
                onClick={() => setShowShortcuts(s => !s)}
                className="p-2 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white transition-all"
                title="Keyboard Shortcuts (?)"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BROWSER CHROME ────────────────────────────────────────────────── */}
      <div className={`flex flex-col mx-4 rounded-t-2xl overflow-hidden border transition-all duration-500 relative z-20 ${isPhantomMode ? 'border-red-900/60 shadow-[0_0_60px_rgba(220,38,38,0.1)]' : 'border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)]'} ${isZenMode ? 'mx-0 rounded-none' : ''}`}>

        {/* ── TAB BAR ─────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {!isZenMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className={`flex items-end px-2 pt-2 gap-1 overflow-x-auto border-b ${isPhantomMode ? 'bg-[#0a0103] border-red-900/30' : 'bg-[#050709] border-white/5'}`}
              style={{ scrollbarWidth: 'none' }}
            >
              {/* Left: Bookmarks + History */}
              <div className="flex items-center gap-1 mr-1 shrink-0">
                <button onClick={() => { setShowBookmarks(s => !s); setShowHistory(false); setShowDevTools(false); }}
                  className={`p-2 rounded-lg transition-colors text-gray-500 hover:text-white ${showBookmarks ? 'bg-white/10 text-white' : ''}`}
                  title="Bookmarks">
                  <Star className="w-4 h-4" />
                </button>
                <button onClick={() => { setShowHistory(s => !s); setShowBookmarks(false); setShowDevTools(false); }}
                  className={`p-2 rounded-lg transition-colors text-gray-500 hover:text-white ${showHistory ? 'bg-white/10 text-white' : ''}`}
                  title="History">
                  <Clock className="w-4 h-4" />
                </button>
              </div>

              <AnimatePresence>
                {tabs.map(tab => (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, x: 20, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: tab.isPinned ? 44 : 'auto' }}
                    exit={{ opacity: 0, x: -10, width: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => { setActiveTabId(tab.id); setShowNewTabPage(false); }}
                    className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-t-xl cursor-pointer transition-all min-w-0 ${tab.isPinned ? 'max-w-[44px] justify-center' : 'min-w-[140px] max-w-[220px]'} ${
                      activeTabId === tab.id
                        ? isPhantomMode
                          ? 'bg-[#180308] text-red-200 border-b-2 border-red-500 shadow-[0_-4px_20px_rgba(220,38,38,0.2)]'
                          : 'bg-[#111318] text-white border-b-2 border-indigo-500 shadow-[0_-4px_20px_rgba(99,102,241,0.15)]'
                        : 'bg-white/3 text-gray-400 hover:bg-white/8 hover:text-gray-200'
                    }`}
                  >
                    {/* Loading spinner / Favicon */}
                    {tab.isLoading ? (
                      <div className={`w-4 h-4 shrink-0 border-2 border-transparent rounded-full animate-spin ${isPhantomMode ? 'border-t-red-500' : 'border-t-indigo-500'}`} />
                    ) : tab.isError ? (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    ) : tab.favicon ? (
                      <img src={tab.favicon} className="w-4 h-4 shrink-0 rounded-sm" onError={e => (e.currentTarget.style.display = 'none')} alt="" />
                    ) : (
                      <Globe className="w-4 h-4 shrink-0 text-gray-500" />
                    )}

                    {!tab.isPinned && (
                      <span className="truncate text-xs font-semibold leading-none">{tab.title}</span>
                    )}

                    {/* Split indicator */}
                    {splitTabId === tab.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                    )}

                    {/* Close button */}
                    {!tab.isPinned && tabs.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
                        className="shrink-0 p-0.5 rounded text-gray-500 hover:text-white hover:bg-white/15 opacity-0 group-hover:opacity-100 transition-all ml-auto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>

              {/* New Tab */}
              <button onClick={() => addTab()} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-t-xl transition-all shrink-0">
                <Plus className="w-4 h-4" />
              </button>

              {/* Right: DevTools */}
              <div className="ml-auto flex items-center gap-1 shrink-0">
                <button onClick={() => { setShowDevTools(s => !s); setShowBookmarks(false); setShowHistory(false); }}
                  className={`p-2 rounded-lg transition-colors text-gray-500 hover:text-white ${showDevTools ? 'bg-white/10 text-white' : ''}`}
                  title="Dev Info">
                  <Code2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── ADDRESS BAR ─────────────────────────────────────────────────── */}
        <div className={`flex items-center gap-2 px-3 py-2 relative z-10 transition-all ${isPhantomMode ? 'bg-[#100104]' : isZenMode ? 'bg-[#080a0c]' : 'bg-[#0d0f12]'}`}>

          {/* Nav Buttons */}
          <div className="flex items-center gap-0.5 text-gray-500">
            <button onClick={goBack} disabled={!activeTab?.history.past.length}
              className="p-2 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-25 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={goForward} disabled={!activeTab?.history.future.length}
              className="p-2 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-25 transition-all">
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={reloadTab} className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all">
              <RefreshCcw className={`w-4 h-4 ${activeTab?.isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button onClick={() => { addTab(); setShowNewTabPage(true); }} className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all">
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Security Shield + Engine Dropdown */}
          <div className="relative group/shield shrink-0">
            <button className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-mono font-bold transition-all ${
              activeTab?.isError ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              activeTab?.proxyEngine === 'direct' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
              isPhantomMode ? 'bg-red-500/10 border-red-500/30 text-red-400' :
              'bg-green-500/10 border-green-500/30 text-green-400'
            }`}>
              {activeTab?.isError ? <ShieldAlert className="w-3.5 h-3.5" /> :
               activeTab?.proxyEngine === 'direct' ? <ShieldAlert className="w-3.5 h-3.5" /> :
               isPhantomMode ? <ShieldAlert className="w-3.5 h-3.5" /> :
               <ShieldCheck className="w-3.5 h-3.5" />}
              <span className="hidden sm:block">{activeTab?.proxyEngine.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Engine Dropdown */}
            <div className="hidden group-hover/shield:flex absolute top-full left-0 mt-2 bg-[#0d0f12] border border-white/10 rounded-xl shadow-2xl flex-col p-2 w-60 z-50 gap-1">
              <p className="text-[10px] font-mono text-gray-500 uppercase px-2 pt-1 pb-2">Proxy Engine</p>
              {(Object.entries(PROXY_ENGINES) as [ProxyEngine, typeof PROXY_ENGINES[ProxyEngine]][]).map(([key, cfg]) => {
                const c = colorMap[cfg.color];
                return (
                  <button key={key} onClick={() => { patchTab(activeTabId, { proxyEngine: key, isLoading: true, isError: false }); }}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all hover:bg-white/5 ${activeTab?.proxyEngine === key ? `${c.bg} ${c.text}` : 'text-gray-400'}`}>
                    <span>{cfg.label}</span>
                    {activeTab?.proxyEngine === key && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
              <div className="h-px bg-white/5 my-1" />
              {/* Sandbox Controls */}
              <p className="text-[10px] font-mono text-gray-500 uppercase px-2 py-1">Sandbox</p>
              {(['js', 'popups', 'forms'] as const).map(feature => (
                <button key={feature} onClick={() => patchTab(activeTabId, { sandbox: { ...activeTab!.sandbox, [feature]: !activeTab!.sandbox[feature] } })}
                  className="flex justify-between items-center px-3 py-2 rounded-lg text-xs font-mono hover:bg-white/5 transition-all text-gray-300">
                  <span>{feature === 'js' ? 'JavaScript' : feature === 'popups' ? 'Popups & Redirects' : 'Form Submissions'}</span>
                  <span className={activeTab?.sandbox[feature] ? 'text-green-400' : 'text-red-400'}>
                    {activeTab?.sandbox[feature] ? 'ALLOW' : 'DENY'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* URL Bar */}
          <form onSubmit={handleNavigate} className="flex-1 relative">
            <input
              ref={urlBarRef}
              value={activeTab?.inputUrl ?? ''}
              onChange={e => patchTab(activeTabId, { inputUrl: e.target.value })}
              onFocus={e => e.target.select()}
              className={`w-full rounded-xl py-2 px-4 text-sm font-mono text-white outline-none border transition-all placeholder:text-gray-600 ${
                isPhantomMode
                  ? 'bg-[#0a0003] border-red-900/40 focus:border-red-500 focus:shadow-[0_0_15px_rgba(220,38,38,0.2)]'
                  : 'bg-[#050709] border-white/8 focus:border-indigo-500/50 focus:shadow-[0_0_15px_rgba(99,102,241,0.15)]'
              }`}
              placeholder="Navigate to a URL or search DuckDuckGo..."
            />
            {activeTab?.isLoading && (
              <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '60%', transition: 'width 2s ease' }} />
            )}
          </form>

          {/* Action buttons */}
          <div className="flex items-center gap-1 text-gray-500">
            {/* Bookmark toggle */}
            <button onClick={toggleBookmark} className={`p-2 rounded-lg hover:bg-white/10 transition-all ${isBookmarked ? 'text-yellow-400' : 'hover:text-white'}`} title="Bookmark">
              <Star className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            {/* Pin tab */}
            <button onClick={() => patchTab(activeTabId, { isPinned: !activeTab?.isPinned })} className={`p-2 rounded-lg hover:bg-white/10 transition-all ${activeTab?.isPinned ? 'text-indigo-400' : 'hover:text-white'}`} title="Pin Tab">
              {activeTab?.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
            {/* Copy URL */}
            <button onClick={() => navigator.clipboard.writeText(activeTab?.url ?? '')} className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all" title="Copy URL">
              <Copy className="w-4 h-4" />
            </button>
            {/* Open in new browser tab */}
            <button onClick={() => window.open(activeTab?.url, '_blank')} className="p-2 rounded-lg hover:bg-white/10 hover:text-white transition-all" title="Open in New Window">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Navigate Button */}
          <button
            onClick={() => handleNavigate()}
            className={`hidden lg:flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              isPhantomMode
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]'
            }`}
          >
            <Cpu className="w-4 h-4" /> Go
          </button>
        </div>
      </div>

      {/* ── SIDE PANELS ─────────────────────────────────────────────────── */}

      {/* Bookmarks Panel */}
      <AnimatePresence>
        {showBookmarks && !isZenMode && (
          <motion.div
            initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}
            className="absolute left-4 top-44 w-72 bg-[#0d0f12] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Bookmarks</h3>
              <button onClick={() => setShowBookmarks(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {bookmarks.length === 0 ? (
                <p className="text-center text-gray-600 text-xs py-8">No bookmarks yet.<br />Star a page to save it.</p>
              ) : bookmarks.map(b => (
                <button key={b.id} onClick={() => { navigate(activeTabId, b.url); setShowBookmarks(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left transition-all group">
                  <Globe className="w-4 h-4 text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-200 truncate">{b.title}</p>
                    <p className="text-[10px] text-gray-500 truncate">{b.url}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setBookmarks(prev => { const u = prev.filter(x => x.id !== b.id); try { localStorage.setItem('omnimux_bookmarks', JSON.stringify(u)); } catch {} return u; }); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && !isZenMode && (
          <motion.div
            initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}
            className="absolute left-4 top-44 w-80 bg-[#0d0f12] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-blue-400" /> History</h3>
              <div className="flex gap-2">
                <button onClick={() => { setHistory([]); try { localStorage.removeItem('omnimux_history'); } catch {} }}
                  className="text-red-400 hover:text-red-300 transition-colors" title="Clear All">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
            </div>
            {/* Search */}
            <div className="px-3 py-2 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white outline-none placeholder:text-gray-600 focus:border-indigo-500/50"
                  placeholder="Search history..." />
              </div>
            </div>
            <div className="p-2 max-h-72 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {history.filter(h => !searchQuery || h.url.includes(searchQuery) || h.title.includes(searchQuery)).slice(0, 50).map((h, i) => (
                <button key={i} onClick={() => { navigate(activeTabId, h.url); setShowHistory(false); }}
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

      {/* DevTools Panel */}
      <AnimatePresence>
        {showDevTools && !isZenMode && (
          <motion.div
            initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
            className="absolute right-4 top-44 w-80 bg-[#0d0f12] border border-white/10 rounded-2xl shadow-2xl z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Code2 className="w-4 h-4 text-cyan-400" /> Dev Info</h3>
              <button onClick={() => setShowDevTools(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3 font-mono text-xs">
              <Row label="URL" value={activeTab?.url ?? '—'} mono />
              <Row label="Proxy Engine" value={engineConfig.label} />
              <Row label="Load Time" value={activeTab?.loadTime != null ? `${activeTab.loadTime}ms` : 'Loading...'} />
              <Row label="JS" value={activeTab?.sandbox.js ? 'Allowed' : 'Blocked'} color={activeTab?.sandbox.js ? 'text-green-400' : 'text-red-400'} />
              <Row label="Popups" value={activeTab?.sandbox.popups ? 'Allowed' : 'Blocked'} color={activeTab?.sandbox.popups ? 'text-green-400' : 'text-red-400'} />
              <Row label="Forms" value={activeTab?.sandbox.forms ? 'Allowed' : 'Blocked'} color={activeTab?.sandbox.forms ? 'text-green-400' : 'text-red-400'} />
              <Row label="History Depth" value={`${activeTab?.history.past.length ?? 0} back / ${activeTab?.history.future.length ?? 0} fwd`} />
              <Row label="Phantom Mode" value={isPhantomMode ? 'ACTIVE' : 'Inactive'} color={isPhantomMode ? 'text-red-400' : 'text-gray-500'} />
              <Row label="Total Tabs" value={tabs.length.toString()} />
              <div className="h-px bg-white/5 my-2" />
              <Row label="Session Bandwidth" value={`${(totalBytesServed / 1024 / 1024).toFixed(2)} MB`} />
              <Row label="Network Ping" value={`${ping}ms`} color={ping < 30 ? 'text-green-400' : ping < 60 ? 'text-yellow-400' : 'text-red-400'} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center"
            onClick={() => setShowShortcuts(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-[#0d0f12] border border-white/15 rounded-2xl p-6 w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Keyboard className="w-5 h-5 text-indigo-400" /> Shortcuts</h3>
              <div className="space-y-2">
                {[
                  ['Ctrl/⌘ + L', 'Focus address bar'],
                  ['Ctrl/⌘ + T', 'New tab'],
                  ['Ctrl/⌘ + W', 'Close tab'],
                  ['Ctrl/⌘ + R', 'Reload tab'],
                  ['Shift + ?', 'Toggle shortcuts'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm">{desc}</span>
                    <kbd className="px-2 py-1 rounded bg-white/10 text-white text-xs font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowShortcuts(false)} className="mt-4 w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIEWPORT AREA ────────────────────────────────────────────────── */}
      <div className={`flex-1 flex overflow-hidden border-x border-b relative z-10 bg-[#030507] ${isPhantomMode ? 'border-red-900/60' : 'border-white/10'} ${isZenMode ? 'mx-0 border-x-0' : 'mx-4'} rounded-b-2xl`}>

        {/* New Tab Page */}
        <AnimatePresence>
          {showNewTabPage && activeTab && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-[#030507] overflow-y-auto flex flex-col items-center justify-start pt-20 px-6 pb-10"
            >
              <div className="mb-2">
                <Globe className="w-12 h-12 text-indigo-500 mx-auto mb-4 opacity-80" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-1">Omnimux Browser</h1>
              <p className="text-gray-500 text-sm mb-8">Fully server-proxied. Zero CORS. All routes.</p>

              {/* Search Bar */}
              <form onSubmit={e => { e.preventDefault(); navigate(activeTabId, activeTab.inputUrl); setShowNewTabPage(false); }}
                className="w-full max-w-xl relative mb-12">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  value={activeTab.inputUrl === DEFAULT_URL ? '' : activeTab.inputUrl}
                  onChange={e => patchTab(activeTabId, { inputUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/60 rounded-2xl py-4 pl-12 pr-5 text-white outline-none font-mono text-sm placeholder:text-gray-600 transition-all shadow-[0_0_30px_rgba(99,102,241,0.1)]"
                  placeholder="Search or enter a URL..."
                  autoFocus
                />
              </form>

              {/* Quick Access */}
              <div className="w-full max-w-2xl">
                <p className="text-xs font-mono uppercase text-gray-600 mb-3">Quick Access</p>
                <div className="grid grid-cols-4 gap-3">
                  {QUICK_ACCESS.map(s => (
                    <button key={s.url} onClick={() => { navigate(activeTabId, s.url); setShowNewTabPage(false); }}
                      className="flex flex-col items-center gap-2 p-4 bg-white/3 hover:bg-white/8 border border-white/5 hover:border-white/15 rounded-xl transition-all group">
                      <span className="text-2xl">{s.icon}</span>
                      <span className="text-xs text-gray-400 group-hover:text-white transition-colors font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent History */}
              {history.length > 0 && (
                <div className="w-full max-w-2xl mt-8">
                  <p className="text-xs font-mono uppercase text-gray-600 mb-3">Recent</p>
                  <div className="space-y-1">
                    {history.slice(0, 5).map((h, i) => (
                      <button key={i} onClick={() => { navigate(activeTabId, h.url); setShowNewTabPage(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-white/3 hover:bg-white/6 rounded-xl text-left transition-all group border border-white/5 hover:border-white/10">
                        <Clock className="w-4 h-4 text-gray-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 truncate group-hover:text-white transition-colors">{h.title}</p>
                          <p className="text-xs text-gray-600 truncate">{h.url}</p>
                        </div>
                        <span className="text-xs text-gray-600 shrink-0">{formatTime(h.visitedAt)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Render all visible iframes */}
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId;
          const isSplit = tab.id === splitTabId;
          const isVisible = isActive || isSplit;
          if (!isVisible) return null;

          const startTime = Date.now();

          return (
            <div key={tab.id} className={`relative flex flex-col h-full transition-all duration-300 ${isActive && !splitTabId ? 'w-full' : 'w-1/2'} ${isSplit && splitTabId ? 'border-l border-white/10' : ''}`}>

              {/* Split header */}
              {splitTabId && (
                <div className="flex items-center justify-between px-4 py-1.5 bg-[#080a0d] border-b border-white/5 z-10">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isActive ? 'Primary' : 'Secondary'}</span>
                  </div>
                  <span className="text-[10px] text-gray-600 font-mono truncate max-w-[180px]">{tab.url}</span>
                </div>
              )}

              {/* The iframe */}
              <iframe
                key={`${tab.id}-${tab.url}-${tab.proxyEngine}`}
                src={buildProxiedUrl(tab)}
                className="flex-1 w-full border-none bg-white"
                sandbox={getSandbox(tab)}
                onLoad={() => handleIframeLoad(tab.id, startTime)}
                onError={() => handleIframeError(tab.id)}
                title={`Omnimux Viewport — ${tab.id}`}
                allow="autoplay; fullscreen; picture-in-picture"
              />

              {/* Loading Overlay */}
              <AnimatePresence>
                {tab.isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}
                    className="absolute inset-0 bg-[#030507]/96 backdrop-blur-2xl flex flex-col items-center justify-center z-40 overflow-hidden"
                  >
                    {/* Background grid */}
                    <div className="absolute inset-0 pointer-events-none opacity-5"
                      style={{ backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.3) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

                    {/* Glow orb */}
                    <div className={`absolute w-80 h-80 blur-[100px] rounded-full opacity-20 animate-pulse ${isPhantomMode ? 'bg-red-600' : 'bg-indigo-600'}`} />

                    {/* Icon */}
                    <div className="relative mb-6">
                      <div className={`w-24 h-24 rounded-3xl border flex items-center justify-center bg-black/60 backdrop-blur shadow-2xl ${isPhantomMode ? 'border-red-900/50' : 'border-indigo-500/20'}`}>
                        <Server className={`w-10 h-10 ${isPhantomMode ? 'text-red-500' : 'text-indigo-500'}`} />
                        <div className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full animate-ping ${isPhantomMode ? 'bg-red-400' : 'bg-green-400'}`} />
                      </div>
                    </div>

                    <h2 className="text-xl font-black text-white tracking-widest uppercase mb-1">Routing Request</h2>
                    <p className={`text-xs font-mono mb-4 ${ec.text}`}>{engineConfig.label}</p>

                    {/* Progress bar */}
                    <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                      <motion.div
                        className={`h-full rounded-full ${isPhantomMode ? 'bg-red-500' : 'bg-indigo-500'}`}
                        initial={{ width: '0%' }} animate={{ width: '85%' }} transition={{ duration: 2, ease: 'easeOut' }}
                      />
                    </div>

                    <p className="text-xs text-gray-600 font-mono max-w-xs text-center truncate">{tab.url}</p>

                    {/* Fake terminal lines */}
                    <div className="absolute bottom-6 left-6 text-[10px] text-gray-700 font-mono flex flex-col gap-1">
                      <span className={isPhantomMode ? 'text-red-900' : ''}>{'>'} engine: {tab.proxyEngine}</span>
                      <span>{'>'} bypass_cors: true</span>
                      {!tab.sandbox.js && <span className="text-yellow-700">{'>'} js: suppressed</span>}
                      <span>{'>'} streaming bytes...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Overlay */}
              <AnimatePresence>
                {tab.isError && !tab.isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#030507]/98 flex flex-col items-center justify-center z-40 gap-4">
                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
                      <XCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-xl font-black text-white">Connection Refused</h2>
                    <p className="text-sm text-gray-400 max-w-xs text-center">{tab.errorMsg || 'The site could not be loaded through this proxy engine.'}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={cycleEngine} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-all">
                        <RotateCcw className="w-4 h-4" /> Try Next Engine
                      </button>
                      <button onClick={() => window.open(tab.url, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm text-white font-bold transition-all">
                        <ExternalLink className="w-4 h-4" /> Open Direct
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── BOTTOM STATUS BAR ────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isZenMode && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-between px-5 py-1.5 text-[10px] font-mono text-gray-600"
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                {ping < 30 ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-yellow-500" />}
                {ping}ms
              </span>
              {activeTab?.loadTime && <span className="text-gray-700">Loaded in {activeTab.loadTime}ms</span>}
              <span>{tabs.length} tab{tabs.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-4">
              {isPhantomMode && <span className="text-red-700 animate-pulse">● PHANTOM ACTIVE</span>}
              {splitTabId && <span className="text-indigo-700">▣ SPLIT VIEW</span>}
              <span className="text-gray-700">Omnimux Browser v12.0</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function extractHostname(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url.slice(0, 40); }
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function Row({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={`${mono ? 'font-mono text-[10px] max-w-[160px] truncate text-right' : ''} ${color ?? 'text-gray-300'}`}>{value}</span>
    </div>
  );
}
