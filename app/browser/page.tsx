'use client';
import { useState, useEffect, useMemo } from 'react';
import { 
  Globe, ArrowRight, ArrowLeft, Lock, RefreshCcw, Command, 
  Plus, X, MonitorGlobe, ShieldCheck, EyeOff, Maximize2, 
  PanelLeft, ShieldAlert, Cpu, Activity, Server, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Advanced Tab Interface with History Stack
interface BrowserTab {
  id: string;
  url: string;
  inputUrl: string;
  title: string;
  isLoading: boolean;
  history: { past: string[], future: string[] };
  sandbox: { js: boolean, popups: boolean };
  proxyRoute: 'corsproxy.io' | 'api.allorigins.win' | 'direct';
}

export default function NeuralBrowser() {
  const [tabs, setTabs] = useState<BrowserTab[]>([{
    id: '1', url: 'https://duckduckgo.com', inputUrl: 'https://duckduckgo.com',
    title: 'DuckDuckGo', isLoading: true, history: { past: [], future:[] },
    sandbox: { js: true, popups: false }, proxyRoute: 'corsproxy.io'
  }]);
  
  const[activeTabId, setActiveTabId] = useState<string>('1');
  const [isPhantomMode, setIsPhantomMode] = useState(false);
  const [splitScreenTabId, setSplitScreenTabId] = useState<string | null>(null);
  
  // Simulated Telemetry Ping
  const [ping, setPing] = useState(12);
  useEffect(() => {
    const int = setInterval(() => setPing(Math.max(8, Math.floor(Math.random() * 45))), 2000);
    return () => clearInterval(int);
  },[]);

  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId) || tabs[0],[tabs, activeTabId]);

  // -- BROWSER ENGINE FUNCTIONS -- //
  
  const addTab = () => {
    const newId = Date.now().toString();
    setTabs([...tabs, { 
       id: newId, url: 'https://duckduckgo.com', inputUrl: '', title: 'New Sector', 
       isLoading: true, history: { past: [], future:[] }, 
       sandbox: { js: true, popups: false }, proxyRoute: 'corsproxy.io'
    }]);
    setActiveTabId(newId);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return; 
    if (splitScreenTabId === id) setSplitScreenTabId(null);

    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    
    if (activeTabId === id) setActiveTabId(newTabs[newTabs.length - 1].id);
  };

  const executeNavigation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let target = activeTab.inputUrl.trim();
    if (!target) return;

    if (!target.startsWith('http') && !target.includes('.')) target = 'https://duckduckgo.com/?q=' + encodeURIComponent(target);
    else if (!target.startsWith('http')) target = 'https://' + target;
    
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId && t.url !== target) {
        return { 
          ...t, url: target, inputUrl: target, isLoading: true, 
          title: new URL(target).hostname.replace('www.', ''),
          history: { past: [...t.history.past, t.url], future:[] } 
        };
      }
      return t;
    }));
  };

  const goBack = () => {
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId && t.history.past.length > 0) {
        const pastStack =[...t.history.past];
        const prevUrl = pastStack.pop()!;
        return { 
          ...t, url: prevUrl, inputUrl: prevUrl, isLoading: true,
          history: { past: pastStack, future: [t.url, ...t.history.future] }
        };
      }
      return t;
    }));
  };

  const goForward = () => {
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId && t.history.future.length > 0) {
        const futureStack = [...t.history.future];
        const nextUrl = futureStack.shift()!;
        return { 
          ...t, url: nextUrl, inputUrl: nextUrl, isLoading: true,
          history: { past: [...t.history.past, t.url], future: futureStack }
        };
      }
      return t;
    }));
  };

  const toggleSandbox = (feature: 'js' | 'popups') => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, sandbox: { ...t.sandbox, [feature]: !t.sandbox[feature] } } : t));
  };

  const changeProxyRoute = () => {
     const routes: BrowserTab['proxyRoute'][] =['corsproxy.io', 'api.allorigins.win', 'direct'];
     const nextIdx = (routes.indexOf(activeTab.proxyRoute) + 1) % routes.length;
     setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, proxyRoute: routes[nextIdx], isLoading: true } : t));
  };

  const buildEngineUrl = (tab: BrowserTab) => {
    if (tab.proxyRoute === 'direct') return tab.url;
    if (tab.proxyRoute === 'api.allorigins.win') return `https://api.allorigins.win/raw?url=${encodeURIComponent(tab.url)}`;
    return `https://corsproxy.io/?${encodeURIComponent(tab.url)}`;
  };

  const getSandboxAttributes = (tab: BrowserTab) => {
     let config = "allow-same-origin allow-forms allow-downloads";
     if (tab.sandbox.js) config += " allow-scripts allow-presentation";
     if (tab.sandbox.popups) config += " allow-popups allow-popups-to-escape-sandbox";
     return config;
  };

  // --- RENDERING ---

  return (
    <div className={`pt-24 max-w-[1800px] mx-auto px-4 md:px-6 h-screen flex flex-col pb-6 transition-colors duration-1000 ${isPhantomMode ? 'bg-[#050000]' : ''}`}>
      
      {/* GLOBAL HUD / TELEMETRY */}
      <div className="flex items-center justify-between mb-4 px-2 relative z-20">
         <div className="flex items-center gap-4 text-xs font-mono font-bold">
            <span className={`px-3 py-1.5 rounded-full flex items-center gap-2 border ${isPhantomMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'}`}>
                <Activity className="w-4 h-4"/> N-Link Extracted
            </span>
            <span className="text-gray-500 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                <Zap className="w-3.5 h-3.5 text-yellow-500"/> Ping: {ping}ms
            </span>
         </div>
         <div className="flex gap-2">
            <button onClick={() => setSplitScreenTabId(splitScreenTabId ? null : tabs.find(t => t.id !== activeTabId)?.id || null)} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${splitScreenTabId ? 'bg-indigo-500 text-white border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'bg-[#111] text-gray-400 border-white/10 hover:text-white'}`}>
                <PanelLeft className="w-4 h-4"/> Dual-Viewport Compute
            </button>
            <button onClick={() => setIsPhantomMode(!isPhantomMode)} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${isPhantomMode ? 'bg-red-900/50 text-red-200 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-[#111] text-gray-400 border-white/10 hover:text-white'}`}>
                <EyeOff className="w-4 h-4"/> Phantom Route
            </button>
         </div>
      </div>

      <div className={`flex flex-col bg-[#0a0a0a]/90 backdrop-blur-2xl rounded-t-3xl border shadow-2xl relative z-20 overflow-hidden ${isPhantomMode ? 'border-red-900/50' : 'border-white/10'}`}>
        
        {/* Tab Row Elements */}
        <div className={`flex pt-2 px-3 gap-2 overflow-x-auto custom-scrollbar border-b ${isPhantomMode ? 'bg-[#080202] border-red-900/30' : 'bg-[#030508] border-white/5'}`}>
           <AnimatePresence>
             {tabs.map(tab => (
                <motion.div 
                   key={tab.id} initial={{ opacity: 0, y: 10, width: 0 }} animate={{ opacity: 1, y: 0, width: 'auto' }} exit={{ opacity: 0, scale: 0.9, width: 0 }}
                   onClick={() => setActiveTabId(tab.id)} 
                   className={`group relative flex items-center justify-between gap-4 px-4 py-3 min-w-[180px] max-w-[260px] cursor-pointer rounded-t-xl transition-all duration-300 ${activeTabId === tab.id ? (isPhantomMode ? 'bg-[#1a0505] text-red-100 border-b-2 border-red-500 shadow-lg' : 'bg-[#1a1a1a] text-white border-b-2 border-indigo-500 shadow-lg') : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                >
                   <div className="flex items-center gap-3 overflow-hidden">
                      {tab.isLoading ? <Command className={`w-4 h-4 animate-spin shrink-0 ${isPhantomMode ? 'text-red-400' : 'text-indigo-400'}`} /> : <img src={`https://www.google.com/s2/favicons?sz=64&domain_url=${tab.url}`} className="w-4 h-4 shrink-0 rounded-sm" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                      <span className="truncate text-sm font-bold tracking-tight">{tab.title}</span>
                      {splitScreenTabId === tab.id && <div className="absolute right-8 w-2 h-2 rounded-full bg-indigo-500 animate-pulse"/>}
                   </div>
                   <button onClick={(e) => closeTab(e, tab.id)} className={`p-1 rounded-full transition-all text-gray-400 hover:text-white hover:bg-white/10 ${tabs.length === 1 ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}>
                      <X className="w-3.5 h-3.5" />
                   </button>
                </motion.div>
             ))}
           </AnimatePresence>
           <button onClick={addTab} className="px-4 py-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-t-xl transition-all"><Plus className="w-5 h-5" /></button>
        </div>

        {/* Address Bar Complex */}
        <div className={`p-3 flex items-center gap-3 relative z-20 ${isPhantomMode ? 'bg-[#1a0505]' : 'bg-[#1a1a1a]'}`}>
           
           <div className="flex gap-1 text-gray-400">
             <button onClick={goBack} disabled={activeTab.history.past.length === 0} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors hover:text-white disabled:opacity-30"><ArrowLeft className="w-5 h-5"/></button>
             <button onClick={goForward} disabled={activeTab.history.future.length === 0} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors hover:text-white disabled:opacity-30"><ArrowRight className="w-5 h-5"/></button>
             <button onClick={() => setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isLoading: true } : t))} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors hover:text-white"><RefreshCcw className={`w-5 h-5 ${activeTab.isLoading ? 'animate-spin text-indigo-400' : ''}`}/></button>
           </div>
           
           <form onSubmit={executeNavigation} className="flex-1 relative flex items-center group">
             {/* Security Box */}
             <div className="absolute left-1.5 flex items-center gap-1 bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-white/5 z-10 hover:bg-white/10 cursor-pointer group/sec">
                 {isPhantomMode ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <ShieldCheck className="w-4 h-4 text-green-500" />}
                 
                 {/* Quick Engine Dropdown */}
                 <div className="hidden group-hover/sec:flex absolute top-full left-0 mt-2 bg-[#111] border border-white/10 p-3 rounded-xl shadow-2xl flex-col gap-2 w-56 text-xs text-white">
                    <span className="font-mono text-gray-500 uppercase">Engine Sandbox</span>
                    <button type="button" onClick={(e) => { e.preventDefault(); toggleSandbox('js') }} className="flex justify-between w-full hover:bg-white/5 p-2 rounded">
                       Strict JS Exec <span className={activeTab.sandbox.js ? 'text-green-400' : 'text-red-400'}>{activeTab.sandbox.js ? 'ALLOW' : 'DENY'}</span>
                    </button>
                    <button type="button" onClick={(e) => { e.preventDefault(); toggleSandbox('popups') }} className="flex justify-between w-full hover:bg-white/5 p-2 rounded">
                       Popups/Redirects <span className={activeTab.sandbox.popups ? 'text-green-400' : 'text-red-400'}>{activeTab.sandbox.popups ? 'ALLOW' : 'DENY'}</span>
                    </button>
                    <div className="h-px w-full bg-white/10 my-1"/>
                    <button type="button" onClick={(e) => { e.preventDefault(); changeProxyRoute(); }} className="flex justify-between w-full hover:bg-white/5 p-2 rounded text-indigo-400 font-bold">
                       Route: {activeTab.proxyRoute}
                    </button>
                 </div>
             </div>

             <input 
                value={activeTab.inputUrl} 
                onChange={e => setTabs(tabs.map(t => t.id === activeTabId ? { ...t, inputUrl: e.target.value } : t))} 
                className={`w-full border rounded-xl py-3 pl-[120px] pr-12 text-white font-mono outline-none transition-all ${isPhantomMode ? 'bg-[#0a0000] border-red-900/30 focus:border-red-500 focus:shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-[#0a0a0a] border-white/10 focus:border-indigo-500 focus:shadow-[0_0_20px_rgba(79,70,229,0.2)]'}`} 
                placeholder="Initialize Query Vector..." 
             />
             <div className="absolute right-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                <Cpu className="w-5 h-5" />
             </div>
           </form>
           
           <button onClick={() => executeNavigation()} className={`hidden md:flex text-black px-6 py-3 rounded-xl font-black text-sm tracking-widest uppercase transition-colors items-center gap-2 ${isPhantomMode ? 'bg-red-500 hover:bg-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-white hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]'}`}>
              Commit
           </button>
        </div>
      </div>

      {/* --- HARDCORE MULTI-RENDER ENGINE VIEWPORT --- */}
      <div className={`flex-1 relative rounded-b-3xl border-x border-b overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] flex bg-[#030508] ${isPhantomMode ? 'border-red-900/50' : 'border-white/10'}`}>
        
        {/* We map all tabs. If not split screen, only active is visible. If split screen, both target tabs are mapped side-by-side. */}
        {tabs.map(tab => {
           const isActive = activeTabId === tab.id;
           const isSplitSecondary = splitScreenTabId === tab.id;
           const isVisible = isActive || isSplitSecondary;
           
           if (!isVisible) return null; // Unmount hidden tabs completely to save RAM in a 10x complex state, or keep them relative depending on preference. Here we utilize display none for better UX.

           return (
            <div 
               key={tab.id} 
               className={`h-full relative transition-all duration-500 border-r border-[#111] flex-col flex bg-white ${isActive && !splitScreenTabId ? 'w-full' : 'w-1/2'}`}
            >
               {splitScreenTabId && (
                  <div className="bg-[#111] border-b border-white/10 px-4 py-1 flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-gray-400 z-50">
                      <span>Node Viewport {isActive ? 'Alpha' : 'Beta'}</span>
                      <span className="text-white truncate max-w-[200px]">{tab.url}</span>
                  </div>
               )}
               
               <iframe 
                 src={buildEngineUrl(tab)}
                 className="flex-1 w-full border-none bg-white"
                 sandbox={getSandboxAttributes(tab)}
                 onLoad={() => setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, isLoading: false } : t))}
                 title={`Engine Grid - ${tab.id}`}
               />

               {/* Matrix-Style Hyper-Loader Overlay */}
               <AnimatePresence>
                  {tab.isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0a0a0a]/95 backdrop-blur-3xl flex flex-col items-center justify-center z-50 overflow-hidden">
                      {/* Background hex grids overlaying loader */}
                      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIvPjwvc3ZnPg==')] pointer-events-none" />
                      
                      <div className="relative">
                         <div className={`absolute -inset-10 blur-3xl opacity-30 rounded-full animate-pulse-glow ${isPhantomMode ? 'bg-red-600' : 'bg-indigo-600'}`} />
                         <div className="w-32 h-32 relative flex items-center justify-center mb-8 border border-white/10 rounded-2xl bg-black/60 shadow-2xl backdrop-blur-md">
                            <Server className={`w-12 h-12 animate-pulse ${isPhantomMode ? 'text-red-500' : 'text-indigo-500'}`} />
                            <div className={`absolute top-0 right-0 w-3 h-3 m-2 rounded-full animate-ping ${isPhantomMode ? 'bg-red-400' : 'bg-green-400'}`}/>
                         </div>
                      </div>

                      <h2 className="text-2xl font-black text-white tracking-widest uppercase mb-1">Bridging Tunnels</h2>
                      <div className="flex items-center gap-3 font-mono text-xs">
                          <span className={isPhantomMode ? 'text-red-400' : 'text-indigo-400'}>Route: {tab.proxyRoute}</span>
                          <span className="text-gray-600">|</span>
                          <span className="text-gray-400 truncate max-w-xs">{tab.url}</span>
                      </div>

                      {/* Fake Telemetry output */}
                      <div className="absolute bottom-8 left-8 text-[10px] text-gray-600 font-mono flex flex-col gap-1 max-w-sm">
                          <span>{'>'} bypass_cors_headers: true</span>
                          <span>{'>'} intercept_dom_mutations: active</span>
                          {tab.sandbox.js === false && <span className="text-yellow-500">{'>'} SANDBOX: JS EXTENSIONS SUPPRESSED</span>}
                          <span>{'>'} streaming bytes...</span>
                      </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
           );
        })}
      </div>
    </div>
  );
}
