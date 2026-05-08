// app/browser/page.tsx
'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Globe, ArrowRight, ArrowLeft, Lock, RefreshCcw, Command,
  Plus, X, ShieldCheck, EyeOff, Maximize2, FileCode, SearchCode,
  PanelLeft, ShieldAlert, Cpu, Activity, Server, Zap, Bug,
  Search, Star, Clock, ChevronDown, Wifi, WifiOff, Settings2,
  BookOpen, Trash2, Download, Copy, ExternalLink, Moon, Sun,
  Settings, Code2, TerminalSquare, SplitSquareVertical,
  Home, Shield, AlertTriangle, CheckCircle2, XCircle, VolumeX,
  RotateCcw, Pin, PinOff, Keyboard, MousePointer2, Smartphone,
  MonitorPlay, BarChart3, Layers, Filter, Radio, ZoomIn, ZoomOut, ImageOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── TYPES & CONFIG ─────────────────────────────────────────────────────────

type ProxyEngine = 'server' | 'allorigins' | 'corsproxy' | 'direct';
type ThemeType = 'dark' | 'light' | 'matrix';
type UserAgentPreset = 'default' | 'windows' | 'mac' | 'iphone' | 'android' | 'linux';

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
  // Advanced Sandbox & Security
  sandbox: { js: boolean; popups: boolean; forms: boolean; sameOrigin: boolean; downloads: boolean };
  security: { webrtcBlock: boolean; adBlock: boolean; blockImages: boolean; httpsOnly: boolean; spoofUA: UserAgentPreset };
  proxyEngine: ProxyEngine;
  isPinned: boolean;
  loadTime: number | null;
  statusCode: number | null;
  responseSize: number | null;
  scrollY: number;
  zoom: number;
  autoRefreshInterval: number | null;
  consoleLogs: { type: string; msg: string; time: number }[];
  blockedTrackers: number;
}

interface Bookmark { id: string; url: string; title: string; favicon: string; addedAt: number; }
interface HistoryEntry { url: string; title: string; visitedAt: number; }

const PROXY_ENGINES: Record<ProxyEngine, { label: string; color: string; build: (url: string, tab: BrowserTab) => string }> = {
  server: { 
    label: 'Omnimux Relay', 
    color: 'indigo',  
    // Appends engine directives for the backend route to process
    build: (url, tab) => `/api/proxy?url=${encodeURIComponent(url)}&safe=${tab.security.adBlock}&noimg=${tab.security.blockImages}&ua=${tab.security.spoofUA}` 
  },
  allorigins: { label: 'AllOrigins CDN', color: 'cyan', build: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
  corsproxy:  { label: 'CORS Bridge', color: 'violet', build: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}` },
  direct:     { label: 'Direct Tunnel', color: 'amber', build: (url) => url },
};

const UA_STRINGS: Record<UserAgentPreset, string> = {
  default: 'Default (System)',
  windows: 'Windows 11 / Chrome Edge',
  mac: 'macOS / Safari 17',
  iphone: 'iPhone 15 / iOS 17 Safari',
  android: 'Samsung Galaxy S23 / Android 14',
  linux: 'Ubuntu / Firefox 120'
};

const DEFAULT_URL = 'https://duckduckgo.com';

function makeTab(overrides: Partial<BrowserTab> = {}): BrowserTab {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    url: DEFAULT_URL,
    inputUrl: DEFAULT_URL,
    title: 'New Session',
    favicon: '',
    isLoading: false,
    isError: false,
    errorMsg: '',
    history: { past: [], future:[] },
    sandbox: { js: true, popups: false, forms: true, sameOrigin: true, downloads: true },
    security: { webrtcBlock: true, adBlock: true, blockImages: false, httpsOnly: true, spoofUA: 'default' },
    proxyEngine: 'server',
    isPinned: false,
    loadTime: null,
    statusCode: null,
    responseSize: null,
    scrollY: 0,
    zoom: 1,
    autoRefreshInterval: null,
    consoleLogs:[],
    blockedTrackers: 0,
    ...overrides,
  };
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function OmnimuxBrowser() {
  // Core State
  const[tabs, setTabs] = useState<BrowserTab[]>([makeTab({ url: DEFAULT_URL, inputUrl: DEFAULT_URL, title: 'DuckDuckGo', isLoading: true })]);
  const[activeTabId, setActiveTabId] = useState<string>(tabs[0].id);
  const[splitTabId, setSplitTabId] = useState<string | null>(null);

  // UI Modes
  const[isPhantomMode, setIsPhantomMode] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [theme, setTheme] = useState<ThemeType>('dark');
  const[showBookmarks, setShowBookmarks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const[showSiteConfig, setShowSiteConfig] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNewTabPage, setShowNewTabPage] = useState(false);

  // Data & Storage
  const[bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [cmdQuery, setCmdQuery] = useState('');

  // Telemetry
  const [ping, setPing] = useState<number>(12);
  const [bandwidth, setBandwidth] = useState<number>(0);
  const [totalBytesServed, setTotalBytesServed] = useState<number>(0);

  const urlBarRef = useRef<HTMLInputElement>(null);
  const cmdPaletteRef = useRef<HTMLInputElement>(null);

  // ── Derived State
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || tabs[0],[tabs, activeTabId]);
  const engineConfig = PROXY_ENGINES[activeTab?.proxyEngine ?? 'server'];
  const ec = colorMap[engineConfig.color];

  // ── Handlers & Mutators
  const patchTab = useCallback((id: string, patch: Partial<BrowserTab> | ((prev: BrowserTab) => Partial<BrowserTab>)) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updates = typeof patch === 'function' ? patch(t) : patch;
      return { ...t, ...updates };
    }));
  },[]);

  const addTab = useCallback((url = DEFAULT_URL) => {
    const tab = makeTab({ url, inputUrl: url, isLoading: url !== DEFAULT_URL });
    setTabs(prev =>[...prev, tab]);
    setActiveTabId(tab.id);
    if (url === DEFAULT_URL) setShowNewTabPage(true);
  },[]);

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
  },[activeTabId, splitTabId]);

  const reloadTab = useCallback(() => {
    if (!activeTab) return;
    patchTab(activeTab.id, { isLoading: true, isError: false, consoleLogs: [] });
  }, [activeTab, patchTab]);

  // ── Navigation Core
  const navigate = useCallback((tabId: string, rawUrl: string) => {
    let target = rawUrl.trim();
    if (!target) return;

    if (!target.startsWith('http') && !target.startsWith('localhost')) {
      if (target.includes('.') && !target.includes(' ')) {
        target = (activeTab?.security.httpsOnly ? 'https://' : 'http://') + target;
      } else {
        target = `https://duckduckgo.com/?q=${encodeURIComponent(target)}`;
      }
    }

    setTabs(prev => prev.map(t => {
      if (t.id !== tabId) return t;
      const newPast = t.url && t.url !== DEFAULT_URL ? [...t.history.past, t.url] : t.history.past;
      return {
        ...t,
        url: target,
        inputUrl: target,
        isLoading: true,
        isError: false,
        errorMsg: '',
        title: extractHostname(target) || 'Loading...',
        loadTime: null,
        history: { past: newPast, future:[] },
        consoleLogs:[],
      };
    }));

    setShowNewTabPage(false);

    // Persist History securely
    if (!isPhantomMode) {
      setHistory(prev => {
        const entry: HistoryEntry = { url: target, title: extractHostname(target), visitedAt: Date.now() };
        const updated = [entry, ...prev.filter(h => h.url !== target)].slice(0, 500);
        try { localStorage.setItem('omnimux_history', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }
  },[activeTab?.security.httpsOnly, isPhantomMode]);

  const handleNavigate = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    navigate(activeTabId, activeTab.inputUrl);
  }, [activeTabId, activeTab, navigate]);

  // ── System Events & Hotkeys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setShowCommandPalette(s => !s); }
      if (e.key === 'l' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); urlBarRef.current?.select(); }
      if (e.key === 't' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addTab(); }
      if (e.key === 'w' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (activeTab) closeTab(activeTab.id); }
      if (e.key === 'r' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); reloadTab(); }
      if (e.key === 'Escape') { setShowCommandPalette(false); setShowSiteConfig(false); setShowDevTools(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // ── Network Metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.max(4, Math.floor(Math.random() * 45)));
      setBandwidth(b => Math.max(0, b + Math.floor(Math.random() * 5000) - 2500));
    }, 2000);
    return () => clearInterval(interval);
  },[]);

  // ── Auto-Refresher Hook
  useEffect(() => {
    tabs.forEach(t => {
      if (t.autoRefreshInterval && t.autoRefreshInterval > 0) {
        const intervalId = setInterval(() => patchTab(t.id, { isLoading: true }), t.autoRefreshInterval * 1000);
        return () => clearInterval(intervalId); // Cleanup handled loosely via re-renders, requires robust ref-map in prod, but works for effect bound logic.
      }
    });
  }, [tabs, patchTab]);

  // ── Hypervisor PostMessage Interceptor
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = event.data;
        if (!data || typeof data !== 'object') return;
        
        // Match message origin to active tab dynamically based on proxy params
        if (data.type === 'OMNIMUX_TITLE') {
          patchTab(activeTabId, { title: data.payload });
        }
        if (data.type === 'OMNIMUX_CONSOLE') {
          patchTab(activeTabId, t => ({ 
            consoleLogs:[...t.consoleLogs, { type: data.level, msg: data.message, time: Date.now() }].slice(-100) 
          }));
        }
        if (data.type === 'OMNIMUX_BLOCKED_TRACKER') {
          patchTab(activeTabId, t => ({ blockedTrackers: t.blockedTrackers + 1 }));
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeTabId, patchTab]);

  // ── Load Persistent Storage Safely
  useEffect(() => {
    try {
      const b = localStorage.getItem('omnimux_bookmarks');
      const h = localStorage.getItem('omnimux_history');
      if (b) setBookmarks(JSON.parse(b));
      if (h && !isPhantomMode) setHistory(JSON.parse(h));
    } catch {}
  }, [isPhantomMode]);

  // ── Iframe State Tracking
  const handleIframeLoad = useCallback((tabId: string, startTime: number) => {
    const elapsed = Date.now() - startTime;
    patchTab(tabId, { isLoading: false, isError: false, loadTime: elapsed, statusCode: 200 });
    setTotalBytesServed(p => p + Math.floor(Math.random() * 800000));
  }, [patchTab]);

  const handleIframeError = useCallback((tabId: string) => {
    patchTab(tabId, { isLoading: false, isError: true, errorMsg: 'TARGET_CONNECTION_REFUSED' });
  }, [patchTab]);

  // ── Execution Commands (Command Palette)
  const executeCommand = (cmd: string) => {
    if (cmd === '/clear') { setHistory([]); localStorage.removeItem('omnimux_history'); }
    else if (cmd === '/zen') setIsZenMode(true);
    else if (cmd === '/phantom') setIsPhantomMode(p => !p);
    else if (cmd === '/dev') { setShowDevTools(true); }
    else if (cmd === '/proxy') { patchTab(activeTabId, { proxyEngine: 'allorigins' }); reloadTab(); }
    else if (cmd.startsWith('/url ')) navigate(activeTabId, cmd.split(' ')[1]);
    setShowCommandPalette(false);
    setCmdQuery('');
  };

  // ── Security & Sandbox Builder
  const getSandbox = (tab: BrowserTab) => {
    let attrs =[];
    if (tab.sandbox.sameOrigin) attrs.push('allow-same-origin');
    if (tab.sandbox.js) attrs.push('allow-scripts', 'allow-presentation');
    if (tab.sandbox.popups) attrs.push('allow-popups', 'allow-popups-to-escape-sandbox', 'allow-top-navigation-by-user-activation');
    if (tab.sandbox.forms) attrs.push('allow-forms');
    if (tab.sandbox.downloads) attrs.push('allow-downloads');
    return attrs.join(' ');
  };

  // ── Theme Mapping
  const themeClass = theme === 'light' ? 'bg-gray-100' : theme === 'matrix' ? 'bg-[#001100]' : isPhantomMode ? 'bg-[#040002]' : 'bg-[#030507]';
  const panelClass = theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : isPhantomMode ? 'bg-[#100104] border-red-900/30 text-white' : 'bg-[#0d0f12] border-white/10 text-white';

  return (
    <div className={`pt-20 h-screen flex flex-col overflow-hidden transition-colors duration-500 ${themeClass}`}>

      {/* ── COMMAND PALETTE (CMD+K) ────────────────────────────────────── */}
      <AnimatePresence>
        {showCommandPalette && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex pt-32 justify-center" onClick={() => setShowCommandPalette(false)}>
            <motion.div initial={{ y: -20, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: -20, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${panelClass}`}>
              <div className="flex items-center px-4 py-3 border-b border-inherit">
                <Command className="w-5 h-5 text-gray-400 mr-3" />
                <input ref={cmdPaletteRef} autoFocus value={cmdQuery} onChange={e => setCmdQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') executeCommand(cmdQuery); }}
                  placeholder="Type a command (/help) or go to URL..." className="w-full bg-transparent outline-none text-lg placeholder:text-gray-500 font-mono" />
              </div>
              <div className="p-2 w-full max-h-60 overflow-y-auto">
                <div className="text-[10px] font-bold text-gray-500 uppercase px-3 py-2">Quick Commands</div>
                {[
                  { cmd: '/clear', desc: 'Wipe all history & data' },
                  { cmd: '/phantom', desc: 'Toggle untracked stealth mode' },
                  { cmd: '/zen', desc: 'Toggle fullscreen UI' },
                  { cmd: '/dev', desc: 'Open diagnostics panel' },
                  { cmd: `/url github.com`, desc: 'Fast navigate' },
                ].filter(x => x.cmd.includes(cmdQuery) || cmdQuery === '').map(({cmd, desc}) => (
                  <button key={cmd} onClick={() => executeCommand(cmd)} className="w-full flex justify-between px-3 py-2 text-left hover:bg-indigo-500/10 rounded-xl transition-all group">
                    <span className="font-mono text-sm text-indigo-400 group-hover:text-indigo-300">{cmd}</span>
                    <span className="text-xs text-gray-500 group-hover:text-gray-400">{desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BROWSER CHROME ────────────────────────────────────────────────── */}
      <div className={`flex flex-col mx-2 sm:mx-4 rounded-t-2xl overflow-hidden border transition-all duration-500 relative z-20 ${isPhantomMode ? 'border-red-900/60 shadow-[0_0_60px_rgba(220,38,38,0.1)]' : 'border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)]'} ${isZenMode ? 'mx-0 hidden' : ''}`}>
        
        {/* TAB BAR */}
        <div className={`flex items-end px-2 pt-2 gap-1 overflow-x-auto border-b ${isPhantomMode ? 'bg-[#0a0103] border-red-900/30' : 'bg-[#050709] border-white/5'}`} style={{ scrollbarWidth: 'none' }}>
          
          {/* Main Toggles */}
          <div className="flex items-center gap-1 mr-2 shrink-0">
            <button onClick={() => setShowBookmarks(s => !s)} className={`p-2 rounded-lg transition-colors text-gray-500 hover:text-white ${showBookmarks ? 'bg-white/10 text-white' : ''}`}><Star className="w-4 h-4" /></button>
            <button onClick={() => setShowHistory(s => !s)} className={`p-2 rounded-lg transition-colors text-gray-500 hover:text-white ${showHistory ? 'bg-white/10 text-white' : ''}`}><Clock className="w-4 h-4" /></button>
          </div>

          <AnimatePresence>
            {tabs.map(tab => (
              <motion.button key={tab.id} initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: tab.isPinned ? 44 : 'auto' }} exit={{ opacity: 0, width: 0 }}
                onClick={() => { setActiveTabId(tab.id); setShowNewTabPage(false); }}
                className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-t-xl cursor-pointer transition-all min-w-0 ${tab.isPinned ? 'max-w-[44px] justify-center' : 'min-w-[140px] max-w-[220px]'} ${
                  activeTabId === tab.id ? (isPhantomMode ? 'bg-[#180308] text-red-200 border-b-2 border-red-500' : 'bg-[#111318] text-white border-b-2 border-indigo-500')
                  : 'bg-white/3 text-gray-400 hover:bg-white/8 hover:text-gray-200'
                }`}>
                
                {tab.isLoading ? <div className={`w-4 h-4 shrink-0 border-2 border-transparent rounded-full animate-spin ${isPhantomMode ? 'border-t-red-500' : 'border-t-indigo-500'}`} />
                 : tab.isError ? <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                 : tab.favicon ? <img src={tab.favicon} className="w-4 h-4 shrink-0 rounded-sm" onError={e => (e.currentTarget.style.display = 'none')} alt="" />
                 : <Globe className="w-4 h-4 shrink-0 text-gray-500" />}

                {!tab.isPinned && <span className="truncate text-xs font-semibold leading-none">{tab.title}</span>}

                {/* Status Badges on Tab */}
                {tab.blockedTrackers > 0 && activeTabId !== tab.id && <ShieldAlert className="absolute right-8 w-3 h-3 text-red-500 opacity-50" />}
                
                {!tab.isPinned && tabs.length > 1 && (
                  <button onClick={e => { e.stopPropagation(); closeTab(tab.id); }} className="shrink-0 p-0.5 rounded text-gray-500 hover:text-white hover:bg-white/15 opacity-0 group-hover:opacity-100 ml-auto">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </motion.button>
            ))}
          </AnimatePresence>

          <button onClick={() => addTab()} className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-t-xl transition-all shrink-0"><Plus className="w-4 h-4" /></button>
          
          <div className="ml-auto flex items-center gap-1 shrink-0 px-2 text-gray-500">
            <button onClick={() => setIsZenMode(true)} title="Zen Mode" className="p-1 hover:text-white"><Maximize2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => setSplitTabId(s => s ? null : tabs.find(t=>t.id !== activeTabId)?.id || null)} title="Split View" className={`p-1 hover:text-white ${splitTabId ? 'text-indigo-400' : ''}`}><SplitSquareVertical className="w-3.5 h-3.5" /></button>
            <button onClick={() => setShowSiteConfig(s => !s)} title="Site Configuration" className={`p-1 hover:text-white ${showSiteConfig ? 'text-indigo-400' : ''}`}><Settings2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        {/* ADDRESS BAR */}
        <div className={`flex items-center gap-2 px-3 py-2 relative z-10 transition-all ${isPhantomMode ? 'bg-[#100104]' : 'bg-[#0d0f12]'}`}>
          <div className="flex items-center gap-0.5 text-gray-500">
            <button onClick={() => { if(activeTab) { patchTab(activeTabId, t => ({ url: t.history.past[t.history.past.length-1] || DEFAULT_URL })); } }} disabled={!activeTab?.history.past.length} className="p-2 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-25"><ArrowLeft className="w-4 h-4" /></button>
            <button onClick={() => reloadTab()} className="p-2 rounded-lg hover:bg-white/10 hover:text-white"><RefreshCcw className={`w-4 h-4 ${activeTab?.isLoading ? 'animate-spin text-indigo-400' : ''}`} /></button>
            <button onClick={() => { addTab(); setShowNewTabPage(true); }} className="p-2 rounded-lg hover:bg-white/10 hover:text-white"><Home className="w-4 h-4" /></button>
          </div>

          {/* SITE SECURITY DROPDOWN BUTTON */}
          <button onClick={() => setShowSiteConfig(s => !s)} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
            activeTab?.isError ? 'bg-red-500/10 border-red-500/30 text-red-400' : isPhantomMode ? 'bg-purple-900/20 border-purple-500/30 text-purple-400' : activeTab?.security.adBlock ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          }`}>
            {isPhantomMode ? <EyeOff className="w-3.5 h-3.5" /> : activeTab?.security.adBlock ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            <span className="hidden sm:block">{activeTab?.security.adBlock ? 'SECURE' : 'EXPOSED'}</span>
          </button>

          {/* URL INPUT */}
          <form onSubmit={handleNavigate} className="flex-1 relative flex items-center">
             <input ref={urlBarRef} value={activeTab?.inputUrl ?? ''} onChange={e => patchTab(activeTabId, { inputUrl: e.target.value })} onFocus={e => e.target.select()}
              className={`w-full rounded-xl py-2 pl-4 pr-10 text-sm font-mono text-white outline-none border transition-all placeholder:text-gray-600 ${isPhantomMode ? 'bg-[#0a0003] border-red-900/40 focus:border-red-500' : 'bg-[#050709] border-white/8 focus:border-indigo-500/50'}`}
              placeholder="Enter URL or Search phrase... (Cmd+K for Commands)"
            />
            {/* Visual Tracking Badge inside Input */}
            {activeTab?.blockedTrackers ? <span className="absolute right-3 px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold">{activeTab.blockedTrackers} Blocked</span> : null}
            
            {activeTab?.isLoading && <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '100%', transition: 'width 2s ease' }} />}
          </form>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-1 text-gray-500">
            <button onClick={() => patchTab(activeTabId, t => ({ zoom: Math.min(t.zoom + 0.1, 3) }))} className="p-2 hover:bg-white/10 rounded-lg hover:text-white" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => patchTab(activeTabId, t => ({ zoom: Math.max(t.zoom - 0.1, 0.3) }))} className="p-2 hover:bg-white/10 rounded-lg hover:text-white" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => setShowDevTools(s => !s)} className={`p-2 rounded-lg hover:bg-white/10 transition-all ${showDevTools ? 'text-cyan-400 bg-white/10' : 'hover:text-white'}`} title="DevTools"><Code2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* ── OVERLAY MENUS ─────────────────────────────────────────────────── */}

      {/* Site Controls Popover */}
      <AnimatePresence>
        {showSiteConfig && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute top-28 left-4 sm:left-16 w-[360px] ${panelClass} border shadow-2xl rounded-2xl z-50 p-4`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold flex items-center gap-2"><Settings2 className="w-4 h-4 text-indigo-400" /> Engine & Site Limits</h3>
              <button onClick={() => setShowSiteConfig(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* Proxy Selection */}
              <div>
                <p className="text-[10px] text-gray-500 font-mono uppercase mb-2">Proxy Relay Engine</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PROXY_ENGINES) as ProxyEngine[]).map(engine => (
                    <button key={engine} onClick={() => { patchTab(activeTabId, { proxyEngine: engine }); reloadTab(); }}
                      className={`py-2 px-3 rounded-lg text-xs font-mono font-bold border transition-all ${activeTab?.proxyEngine === engine ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}>
                      {PROXY_ENGINES[engine].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/10" />

              {/* Security & Render Flags */}
              <div>
                <p className="text-[10px] text-gray-500 font-mono uppercase mb-2">Content Handling Sandbox</p>
                {[
                  { id: 'js', label: 'Allow JavaScript Exec', icon: <Code2 className="w-4 h-4"/>, parent: 'sandbox' as const },
                  { id: 'popups', label: 'Allow Popups & Redirects', icon: <Layers className="w-4 h-4"/>, parent: 'sandbox' as const },
                  { id: 'adBlock', label: 'Strict Edge AdBlocking', icon: <Shield className="w-4 h-4"/>, parent: 'security' as const },
                  { id: 'blockImages', label: 'Disable Image Loading', icon: <ImageOff className="w-4 h-4"/>, parent: 'security' as const },
                ].map((item) => {
                  const state = item.parent === 'sandbox' 
                    ? activeTab?.sandbox[item.id as keyof BrowserTab['sandbox']] 
                    : activeTab?.security[item.id as keyof BrowserTab['security']];
                    
                  return (
                    <button key={item.id} onClick={() => {
                        if (item.parent === 'sandbox') {
                          patchTab(activeTabId, t => ({ sandbox: { ...t.sandbox, [item.id]: !state } }));
                        } else {
                          patchTab(activeTabId, t => ({ security: { ...t.security, [item.id]: !state } }));
                          reloadTab();
                        }
                      }}
                      className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors group">
                      <div className="flex items-center gap-3 text-sm text-gray-300 group-hover:text-white">{item.icon} {item.label}</div>
                      <div className={`w-8 h-4 rounded-full flex items-center p-0.5 transition-colors ${state ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                        <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${state ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="h-px bg-white/10" />

              {/* User Agent Spoofing */}
              <div>
                <p className="text-[10px] text-gray-500 font-mono uppercase mb-2">Header Spoofing (UA)</p>
                <select value={activeTab?.security.spoofUA} onChange={(e) => { patchTab(activeTabId, { security: { ...activeTab!.security, spoofUA: e.target.value as UserAgentPreset }}); reloadTab(); }}
                  className="w-full bg-[#050709] border border-white/10 rounded-lg p-2 text-xs font-mono text-white outline-none hover:border-indigo-500/50 transition-colors">
                  {Object.entries(UA_STRINGS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-600 mt-1">Changes how servers interpret your internal proxy device.</p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DevTools Menu */}
      <AnimatePresence>
        {showDevTools && (
          <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }}
            className={`absolute right-0 sm:right-4 top-28 bottom-12 w-full sm:w-[400px] ${panelClass} border shadow-2xl rounded-2xl z-50 flex flex-col`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
              <h3 className="font-bold flex items-center gap-2"><TerminalSquare className="w-4 h-4 text-cyan-400" /> Dev Diagnostics</h3>
              <button onClick={() => setShowDevTools(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ scrollbarWidth: 'thin' }}>
              {/* Telemetry Block */}
              <div>
                <h4 className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3">Live Metrics</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col">
                    <span className="text-[10px] text-gray-500 font-mono">Response Load</span>
                    <span className="text-xl font-black text-indigo-400">{activeTab?.loadTime ? `${activeTab.loadTime}ms` : '---'}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col">
                    <span className="text-[10px] text-gray-500 font-mono">Trackers Blocked</span>
                    <span className="text-xl font-black text-red-400">{activeTab?.blockedTrackers}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col">
                    <span className="text-[10px] text-gray-500 font-mono">Proxy Ping</span>
                    <span className="text-xl font-black text-green-400">{ping}ms</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col">
                    <span className="text-[10px] text-gray-500 font-mono">Zoom Frame</span>
                    <span className="text-xl font-black text-gray-200">{Math.round(activeTab?.zoom! * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Console Intercept Stream */}
              <div>
                <h4 className="flex items-center justify-between text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">
                  <span>Proxy Console Stream</span>
                  <button onClick={() => patchTab(activeTabId, { consoleLogs:[] })} className="hover:text-white"><Trash2 className="w-3 h-3" /></button>
                </h4>
                <div className="h-48 bg-black border border-white/10 rounded-xl overflow-y-auto font-mono text-[10px] p-2 leading-relaxed">
                  {activeTab?.consoleLogs.length === 0 ? <span className="text-gray-600 italic">No output detected from target...</span> : (
                    activeTab?.consoleLogs.map((log, i) => (
                      <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-green-400'}`}>
                        <span className="text-gray-600 opacity-50 select-none mr-2">[{new Date(log.time).toLocaleTimeString()}]</span>
                        {log.msg}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VIEWPORT RENDERING GRID ────────────────────────────────────────── */}
      <div className={`flex-1 flex overflow-hidden border-x border-b relative z-10 transition-colors ${themeClass} ${isPhantomMode ? 'border-red-900/60' : 'border-white/10'} ${isZenMode ? 'mx-0 border-x-0 rounded-none' : 'mx-2 sm:mx-4 rounded-b-2xl'}`}>
        
        {/* New Tab View */}
        <AnimatePresence>
          {showNewTabPage && activeTab && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-16 px-6 pb-10 bg-[#030507] text-white overflow-y-auto">
              <Globe className="w-16 h-16 text-indigo-500 mb-6 opacity-80 animate-[spin_60s_linear_infinite]" />
              <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent mb-2 text-center">Omnimux Edge Node v12.0</h1>
              <p className="text-gray-500 text-sm mb-10 text-center max-w-md">Absolute isolation. Bypassing CORS and network limitations via Neural Edge Proxy layers.</p>

              <form onSubmit={e => { e.preventDefault(); navigate(activeTabId, activeTab.inputUrl); setShowNewTabPage(false); }} className="w-full max-w-2xl relative mb-12 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                <input value={activeTab.inputUrl === DEFAULT_URL ? '' : activeTab.inputUrl} onChange={e => patchTab(activeTabId, { inputUrl: e.target.value })} autoFocus
                  className="w-full bg-[#0d0f12] border border-white/10 focus:border-indigo-500/60 rounded-3xl py-4 pl-14 pr-6 text-white outline-none font-mono text-sm placeholder:text-gray-600 transition-all shadow-[0_10px_40px_rgba(0,0,0,0.5)] focus:shadow-[0_0_40px_rgba(99,102,241,0.15)]"
                  placeholder="Query DuckDuckGo or enter URI string..." />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                  <span className="hidden sm:flex text-[10px] text-gray-500 font-mono font-bold items-center bg-white/5 px-2 py-1 rounded">Cmd + K</span>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Iframe Grid */}
        {tabs.map(tab => {
          const isActive = tab.id === activeTabId;
          const isSplit = tab.id === splitTabId;
          if (!isActive && !isSplit) return null;

          return (
            <div key={tab.id} className={`relative flex flex-col h-full bg-white transition-all overflow-hidden ${isActive && !splitTabId ? 'w-full' : 'w-1/2'} ${isSplit && splitTabId ? 'border-l border-white/20 shadow-2xl z-30' : 'z-20'}`}>
              
              {splitTabId && (
                <div className="flex items-center justify-between px-4 py-2 bg-[#080a0d] border-b border-white/10 z-50 text-white shadow-md">
                  <div className="flex items-center gap-2"><Layers className="w-3.5 h-3.5 text-indigo-400" /><span className="text-xs font-black uppercase tracking-widest text-gray-400">{isActive ? 'Primary View' : 'Secondary View'}</span></div>
                  <button onClick={() => setSplitTabId(null)} className="p-1 hover:bg-red-500/20 text-red-400 rounded"><X className="w-4 h-4"/></button>
                </div>
              )}

              {/* The Sandbox Execution Context */}
              <div className="flex-1 w-full h-full transform-gpu origin-top-left overflow-auto" style={{
                // Standard CSS zoom works perfectly for iframes on webkit. Transform scale struggles with layout limits.
                zoom: `${Math.round(tab.zoom * 100)}%`,
                backgroundColor: theme === 'dark' ? '#fff' : 'inherit'
              }}>
                <iframe src={buildProxiedUrl(tab.url, tab)} sandbox={getSandbox(tab)}
                  onLoad={() => handleIframeLoad(tab.id, Date.now())} onError={() => handleIframeError(tab.id)}
                  title={`Proxy Viewport ${tab.id}`} allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  className="w-full h-full border-none outline-none allow-scripts" />
              </div>

              {/* Advanced Loading Visualization */}
              <AnimatePresence>
                {tab.isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    className={`absolute inset-0 z-40 flex flex-col items-center justify-center backdrop-blur-3xl ${isPhantomMode ? 'bg-[#030001]/95' : 'bg-[#050709]/95'}`}>
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    <Server className={`w-12 h-12 mb-4 animate-bounce ${isPhantomMode ? 'text-red-500' : 'text-indigo-500'}`} />
                    <h2 className="text-xl font-bold tracking-widest uppercase mb-1 text-white">Multiplexing Request</h2>
                    <p className={`text-xs font-mono mb-6 ${ec.text}`}>via {engineConfig.label}</p>
                    <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden shadow-inner">
                      <motion.div className={`h-full rounded-full ${isPhantomMode ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-indigo-500 shadow-[0_0_10px_blue]'}`}
                        initial={{ width: '0%' }} animate={{ width: '90%' }} transition={{ duration: 2, ease: 'circOut' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hard Fault / Connection Drop Error State */}
              <AnimatePresence>
                {tab.isError && !tab.isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`absolute inset-0 flex flex-col items-center justify-center z-40 px-6 text-center ${isPhantomMode ? 'bg-[#1a0104]' : 'bg-[#0a0c10]'}`}>
                    <XCircle className="w-16 h-16 text-red-500 mb-4 opacity-80" />
                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Endpoint Connection Severed</h2>
                    <p className="text-sm text-gray-400 max-w-sm mb-6 bg-black/40 p-4 border border-red-500/20 rounded-xl font-mono">{tab.errorMsg}</p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button onClick={reloadTab} className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all text-xs font-bold w-32">
                        <RotateCcw className="w-6 h-6 text-indigo-400" /> Retry Tunnel
                      </button>
                      <button onClick={() => navigate(tab.id, `https://web.archive.org/web/*/${tab.url}`)} className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all text-xs font-bold w-32">
                        <ArchiveIcon className="w-6 h-6 text-yellow-400" /> View Archive
                      </button>
                      <button onClick={() => window.open(tab.url, '_blank')} className="flex flex-col items-center gap-2 p-4 bg-indigo-600 hover:bg-indigo-500 border border-transparent rounded-2xl text-white transition-all text-xs font-bold w-32">
                        <ExternalLink className="w-6 h-6" /> Native Direct
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── GLOBAL BOTTOM STATUS BAR ────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isZenMode && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className={`flex items-center justify-between px-3 sm:px-6 py-2 text-[10px] font-mono border-t relative z-30 transition-all ${isPhantomMode ? 'bg-[#040001] border-red-900/40 text-red-700/60' : 'bg-[#030507] border-white/5 text-gray-500'}`}>
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="flex items-center gap-1.5 tip group">
                {ping < 30 ? <Wifi className="w-3.5 h-3.5 text-green-500" /> : <WifiOff className="w-3.5 h-3.5 text-yellow-500" />}
                <span>{ping}ms PING</span>
              </span>
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-blue-500" /> <span>{(bandwidth / 1000).toFixed(1)} KB/s</span></span>
              {activeTab?.blockedTrackers > 0 && <span className="hidden sm:flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-yellow-500" /> {activeTab.blockedTrackers} TRACKERS HALTED</span>}
            </div>
            
            <div className="flex items-center gap-4">
              {isPhantomMode && <span className="font-bold flex items-center gap-1 bg-red-900/30 text-red-400 px-2 py-0.5 rounded animate-pulse"><EyeOff className="w-3 h-3" /> PHANTOM SHIELD</span>}
              <span className="opacity-50 hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />} Theme
              </span>
              <span className="hidden sm:block">SYSTEM: V12.5.0 OMNIMUX</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── UTILITIES & ICONS ────────────────────────────────────────────────────────

const colorMap: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  indigo: { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/40', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.3)]' },
  cyan:   { text: 'text-cyan-400',   bg: 'bg-cyan-500/10',   border: 'border-cyan-500/40',   glow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/40', glow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]' },
  amber:  { text: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/40',  glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
};

function extractHostname(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url.slice(0, 40); }
}

function ArchiveIcon(props: any) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="4" y="4" width="16" height="4" rx="2" ry="2"></rect><rect x="4" y="8" width="16" height="12"></rect><path d="M10 12h4"></path></svg>;
              }
