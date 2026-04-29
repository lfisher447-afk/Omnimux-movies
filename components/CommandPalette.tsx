'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const[query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); isOpen ? onClose() : document.dispatchEvent(new CustomEvent('open-cmd')); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/tmdb?endpoint=/search/multi&query=${encodeURIComponent(query)}`)
        .then(r => r.json()).then(d => setResults(d.results?.filter((r:any)=>r.media_type!=='person').slice(0, 5) ||[]));
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.stopPropagation()} 
          className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden liquid-panel">
          <div className="flex items-center px-4 border-b border-white/10 relative">
            <Search className="w-5 h-5 text-gray-400" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Database..." className="w-full bg-transparent border-none text-white px-4 py-5 outline-none text-lg" />
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-gray-400"><X className="w-5 h-5"/></button>
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-2 custom-scrollbar">
            {results.map((m) => (
              <div key={m.id} onClick={() => { router.push(`/movie/${m.id}?type=${m.media_type}`); onClose(); }} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer group transition-all">
                <img src={m.poster_path ? `https://image.tmdb.org/t/p/w92${m.poster_path}` : 'https://via.placeholder.com/92'} className="w-12 h-16 rounded object-cover shadow-lg" />
                <div className="flex-1">
                  <h4 className="text-white font-bold group-hover:text-indigo-400 transition">{m.title || m.name}</h4>
                  <p className="text-sm text-gray-400 uppercase tracking-widest">{m.media_type} • ⭐ {m.vote_average?.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
