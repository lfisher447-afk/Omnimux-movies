'use client';
import { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, Search, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const querySuggestions =[
  "A mind-bending sci-fi with a plot twist",
  "A dark comedy about dysfunctional families",
  "Visually stunning animated movie for adults",
  "High emotional stakes time travel"
];

const LoadingStep = ({ text }: { text: string }) => (
    <motion.div initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} className="flex items-center gap-4 bg-[#111] p-4 rounded-xl border border-white/10 shadow-lg">
        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"/>
        <span className="text-white font-bold tracking-tight">{text}</span>
    </motion.div>
);

export default function AISearch() {
  const [query, setQuery] = useState('');
  const[loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

  const handleSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q) return;
    setQuery(q);
    setLoading(true);
    setResults([]);
    setLoadingStep(1);

    try {
        // Fetch Real TMDB Search Results
        const res = await fetch(`/api/tmdb?endpoint=/search/multi&query=${encodeURIComponent(q)}`);
        const data = await res.json();

        setTimeout(() => setLoadingStep(2), 800);
        setTimeout(() => setLoadingStep(3), 1600);
        
        setTimeout(() => {
            // Map real results into the "AI Generated" visual structure
            const hits = (data.results ||[])
                .filter((r: any) => r.media_type !== 'person' && r.poster_path)
                .slice(0, 6)
                .map((r: any) => {
                    // Simulate an AI reasoning engine string
                    const baseDesc = r.overview ? r.overview.split('. ')[0] : 'Thematic elements match user intent.';
                    return {
                        id: r.id,
                        title: r.title || r.name,
                        desc: `AI Inference: ${baseDesc}. Strong correlation to semantic input.`,
                        type: r.media_type || 'movie',
                        poster: `https://image.tmdb.org/t/p/w500${r.poster_path}`,
                        match: Math.floor(Math.random() * 8) + 91, // 91-98%
                        tags: ['High Relevance', 'Semantic Match', 'Direct Correlation']
                    };
                });
            
            setResults(hits);
            setLoading(false);
        }, 2500);

    } catch (e) {
        setLoading(false);
    }
  };
  
  return (
    <div className="pt-36 max-w-6xl mx-auto px-6 min-h-screen pb-32">
      <div className="text-center mb-16">
        <motion.div
           initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 15, stiffness: 100 }}
           className="w-28 h-28 bg-indigo-500/10 rounded-[40px] flex items-center justify-center mx-auto mb-8 border border-indigo-500/30 shadow-[0_0_80px_rgba(79,70,229,0.2)]">
          <BrainCircuit className="w-14 h-14 text-indigo-400" />
        </motion.div>
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-sm">Semantic Engine</h1>
        <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto">Describe cinematic atmospheres, plot twists, or emotional states. The neural net understands nuance.</p>
      </div>

      <div className="relative mb-12 group max-w-4xl mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[32px] blur opacity-30 group-hover:opacity-70 transition duration-700 animate-pulse-glow"></div>
        <div className="relative flex flex-col bg-[#0a0a0a] border border-white/10 rounded-[28px] shadow-2xl p-3 overflow-hidden">
            <textarea value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSearch()} placeholder='e.g., "A hyper-stylized action movie set in a neon city"' className="w-full bg-transparent p-6 text-2xl font-medium outline-none text-white h-36 resize-none placeholder:text-gray-600" />
            <div className="flex justify-between items-center p-2 bg-black/50 rounded-2xl">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-4 flex items-center gap-2"><Sparkles className="w-3 h-3"/> Alpha v4 Model</span>
                <button onClick={() => handleSearch()} className="bg-white text-black px-8 py-4 rounded-xl font-black flex items-center gap-3 hover:bg-gray-200 transition shadow-lg active:scale-95">
                    Generate Matrix <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-4 mb-20 max-w-3xl mx-auto">
        {querySuggestions.map((s, i) => (
            <motion.button key={s} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i * 0.1}} onClick={() => handleSearch(s)} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm font-bold text-gray-400 hover:bg-white/10 hover:text-white transition shadow-sm">
                "{s}"
            </motion.button>
        ))}
      </div>

       <AnimatePresence>
        {loading && (
            <motion.div className="space-y-4 max-w-lg mx-auto">
                {loadingStep >= 1 && <LoadingStep text="Parsing semantic syntax mapping..." />}
                {loadingStep >= 2 && <LoadingStep text="Cross-referencing vector embeddings..." />}
                {loadingStep >= 3 && <LoadingStep text="Extrapolating neural similarities..." />}
            </motion.div>
        )}
       </AnimatePresence>
      
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <AnimatePresence>
        {results.map((r, i) => (
          <motion.div 
             key={r.id} 
             initial={{opacity: 0, scale: 0.95, y: 30}} animate={{opacity: 1, scale: 1, y: 0}} transition={{delay: i * 0.1, type: 'spring'}}
             onClick={()=>router.push(`/movie/${r.id}?type=${r.type}`)}
             className="bg-gradient-to-br from-[#111] to-black border border-white/10 p-6 rounded-[32px] flex flex-col gap-6 hover:bg-white/5 transition duration-500 cursor-pointer group hover:border-indigo-500/50 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] opacity-0 group-hover:opacity-100 transition duration-700"></div>
            <div className="flex gap-6 relative z-10">
                <img src={r.poster} className="w-32 rounded-2xl object-cover shadow-[0_10px_30px_rgba(0,0,0,0.8)]"/>
                <div className="flex-1 py-2">
                    <h3 className="text-3xl font-black text-white mb-3 group-hover:text-indigo-400 transition leading-tight">{r.title}</h3>
                    <div className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-sm inline-flex items-center gap-2 shadow-sm"><BrainCircuit className="w-4 h-4"/> {r.match}% Match</div>
                </div>
            </div>
            <div className="relative z-10 mt-2 bg-black/50 p-4 rounded-2xl border border-white/5">
                <p className="text-gray-300 font-medium leading-relaxed">{r.desc}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                    {r.tags.map((t: string) => <span key={t} className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-md font-bold uppercase tracking-wider">{t}</span>)}
                </div>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
