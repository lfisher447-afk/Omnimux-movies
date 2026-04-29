'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Film, Tv, Star, ArrowRight, History, Bolt, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

// Define action types for command palette for robust handling
type Action = { id: string; title: string; subtitle: string; icon: React.ReactNode; onSelect: () => void };

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'actions' | 'history'>('search');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { history, toggleSpoilerFree } = useStore();

  const actions: Action[] = [
    { id: 'toggle-spoilers', title: 'Toggle Spoiler-Free Mode', subtitle: 'Blur sensitive content', icon: <EyeOff />, onSelect: () => { toggleSpoilerFree(); onClose(); } },
    { id: 'force-reload', title: 'Force Reload', subtitle: 'Hard refresh the application', icon: <Bolt />, onSelect: () => window.location.reload() }
  ];

  const onSelect = useCallback((item: any, type: typeof activeTab) => {
    if (type === 'search' || type === 'history') {
      router.push(`/movie/${item.id}?type=${item.media_type || item.type}`);
    } else if (type === 'actions') {
      item.onSelect();
    }
    onClose();
  }, [router, onClose]);

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100);
        setQuery('');
        setActiveTab('search');
    }
  }, [isOpen]);

  // Debounced search logic
  useEffect(() => {
    if (activeTab === 'search' && query) {
      setLoading(true);
      const timer = setTimeout(() => {
        fetch(`/api/tmdb?endpoint=/search/multi&query=${encodeURIComponent(query)}`)
          .then(r => r.json())
          .then(d => setResults(d.results?.filter((r: any) => r.media_type !== 'person').slice(0, 6) || []))
          .finally(() => setLoading(false));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query, activeTab]);

  const activeList = activeTab === 'search' ? results : activeTab === 'actions' ? actions : history;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % activeList.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + activeList.length) % activeList.length);
      } else if (e.key === 'Enter' && activeList.length > 0) {
        e.preventDefault();
        onSelect(activeList[selectedIndex], activeTab);
      } else if (e.key === 'k' && e.metaKey) {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeList, selectedIndex, activeTab, onSelect, onClose]);

  const tabs = [
    { id: 'search', label: 'Search', icon: <Search /> },
    { id: 'actions', label: 'Actions', icon: <Bolt /> },
    { id: 'history', label: 'History', icon: <History /> }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] md:pt-[15vh] px-4" onClick={onClose}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -20 }} transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col"
          >
            <div className="flex items-center px-4 border-b border-white/10 relative bg-black/30">
              <div className="flex items-center gap-2 p-2">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === tab.id ? 'bg-white text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
            </div>
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder={activeTab === 'search' ? 'Search movies, tv shows...' : 'Filter actions or history...'} className="w-full bg-transparent border-none text-white px-4 py-5 outline-none text-lg font-medium placeholder:text-gray-600" />
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
              {loading && <div className="p-4 text-center text-gray-400">Loading...</div>}
              {!loading && activeList.length === 0 && <div className="p-4 text-center text-gray-500">No results found.</div>}
              {activeList.map((item, i) => (
                <motion.div
                  key={item.id}
                  onClick={() => onSelect(item, activeTab)}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer group transition-colors ${selectedIndex === i ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    {activeTab === 'actions' ? item.icon : <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} className="w-10 h-14 object-cover rounded"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold truncate">{item.title || item.name}</h4>
                    <p className="text-sm text-gray-400 truncate">{item.subtitle || (item.overview?.slice(0, 50) + '...')}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
