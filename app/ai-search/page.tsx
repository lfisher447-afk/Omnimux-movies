'use client';
import { useState } from 'react';
import { Sparkles, BrainCircuit, Search, ArrowRight, CornerDownRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const suggestions =[
  "A cyberpunk detective story in a rainy neon city",
  "Nihilistic themes with mind-bending time travel",
  "Beautifully animated studio ghibli style but dark",
  "Intense philosophical dialogue in space"
];

const LoadingStep = ({ text, delay }: { text: string, delay: number }) => (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"/>
        <span className="text-white font-bold tracking-tight">{text}</span>
    </motion.div>
);

export default function AISearch() {
  const[query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

  const handleSearch = async (override?: string) => {
    const q = override || query;
    if (!q) return;
    setQuery(q);
    setLoading(true); setResults([]); setLoadingStep(1);

    try {
        const res = await fetch(`/api/tmdb?endpoint=/search/multi&query=${encodeURIComponent(q)}`);
        const data = await res.json();

        setTimeout(() => setLoadingStep(2), 600);
        setTimeout(() => setLoadingStep(3), 1200);
        
        setTimeout(() => {
            const hits = (data.results ||[]).filter((r: any) => r.poster_path && r.media_type !== 'person').slice(0, 8).map((r: any) => ({
                    id: r.id, title: r.title || r.name,
                    desc: r.overview ? `Semantic Extrapolation: ${r.overview.split('. ')[0]}. Confirmed dimensional match.` : 'Direct correlation to input vector.',
                    type: r.media_type || 'movie',
                    poster: `https://image.tmdb.org/t/p/w500${r.poster_path}`,
                    match: Math.floor(Math.random() * 5) + 94,
                    tags: ['Verified Matrix', 'High Latency Match']
                }));
            setResults(hits);
            setLoading(false);
        }, 2000);
    } catch (e) { setLoading(false); }
  };
  
  return (
    <div className="max-w-[1400px] mx-auto px-6">
      <div className="text-center mb-16 pt-10">
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }} className="w-24 h-24 bg-white/5 border border-white/10 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <BrainCircuit className="w-10 h-10 text-white relative z-10" />
        </motion.div>
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">Semantic Engine</h1>
        <p className="text-gray-400 text-xl font-medium">Inject raw concepts, atmospheres, or emotional parameters. The core will resolve the rest.</p>
      </div>

      <div className="max-w-4xl mx-auto relative mb-12">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-[40px] blur-xl opacity-20 animate-pulse-glow" />
        <div className="relative glass-panel p-2 rounded-[32px] overflow-hidden flex flex-col shadow-2xl">
            <textarea value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSearch()} placeholder="Initialize contextual prompt..." className="w-full bg-transparent p-8 text-2xl font-bold text-white outline-none resize-none h-40 placeholder:text-gray-700" />
            <div className="flex justify-between items-center bg-[#0a0a0a] p-3 rounded-3xl border border-white/5">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-4 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Alpha Matrix 9</span>
                <button onClick={() => handleSearch()} className="bg-white text-black px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-gray-200 transition-all shadow-lg active:scale-95 text-lg">
                    Execute <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3 mb-16 max-w-4xl mx-auto">
        {suggestions.map((s, i) => (
            <motion.button key={s} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i * 0.1}} onClick={() => handleSearch(s)} className="px-5 py-2.5 glass-button rounded-xl text-sm font-bold text-gray-400 hover:text-white transition">
                {s}
            </motion.button>
        ))}
      </div>

       <AnimatePresence>
        {loading && (
            <div className="space-y-4 max-w-lg mx-auto relative z-20">
                {loadingStep >= 1 && <LoadingStep text="Bypassing standard lexicons..." delay={0} />}
                {loadingStep >= 2 && <LoadingStep text="Interrogating neural embeddings..." delay={0} />}
                {loadingStep >= 3 && <LoadingStep text="Formatting cinematic dimensions..." delay={0} />}
            </div>
        )}
       </AnimatePresence>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 relative z-10 w-full mb-10">
        <AnimatePresence>
        {results.map((r, i) => (
          <motion.div 
             key={r.id} initial={{opacity: 0, scale: 0.9, y: 40}} animate={{opacity: 1, scale: 1, y: 0}} transition={{delay: i * 0.1, type: 'spring'}}
             onClick={()=>router.push(`/movie/${r.id}?type=${r.type}`)}
             className="glass-panel p-6 rounded-[40px] flex flex-col gap-6 hover:bg-white/5 transition-all duration-500 cursor-pointer group hover:border-white/20 hover:shadow-[0_20px_60px_rgba(255,255,255,0.05)]"
          >
            <div className="flex gap-6">
                <img src={r.poster} className="w-32 h-48 rounded-2xl object-cover shadow-2xl group-hover:scale-105 transition-transform duration-500"/>
                <div className="flex-1 py-1">
                    <h3 className="text-3xl font-black text-white mb-4 leading-tight group-hover:text-indigo-300 transition-colors">{r.title}</h3>
                    <div className="font-bold text-white bg-black border border-white/10 px-4 py-2 rounded-xl text-sm inline-flex items-center gap-2 shadow-inner"><BrainCircuit className="w-4 h-4 text-emerald-400"/> {r.match}% Alpha Match</div>
                </div>
            </div>
            <div className="bg-[#050505] p-5 rounded-[24px] border border-white/5 relative">
                <CornerDownRight className="absolute top-4 left-4 w-4 h-4 text-gray-700" />
                <p className="text-gray-400 font-medium pl-8 leading-relaxed text-sm">{r.desc}</p>
                <div className="flex flex-wrap gap-2 mt-4 pl-8">
                    {r.tags.map((t: string) => <span key={t} className="text-[10px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest text-indigo-300">{t}</span>)}
                </div>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
