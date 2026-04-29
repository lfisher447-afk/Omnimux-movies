'use client';
import { useState, useEffect } from 'react';
import { Sparkles, BrainCircuit, Search, Mic, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const querySuggestions = [
  "A mind-bending sci-fi with a plot twist",
  "Visually stunning animated movie for adults",
  "A dark comedy about dysfunctional families",
  "Something like Blade Runner but more modern"
];

const mockSearchResults = [
  { id: 157336, title: "Interstellar", desc: "High emotional stakes, stunning space visuals, and complex time dilation themes.", type: 'movie', poster: '/interstellar_poster.jpg', match: 96, tags: ['Time Travel', 'Emotional Score', 'Hard Sci-Fi'] },
  { id: 68718, title: "Django Unchained", desc: "A stylish revenge western with sharp dialogue and intense action sequences.", type: 'movie', poster: '/django_poster.jpg', match: 92, tags: ['Revenge', 'Western', 'Sharp Dialogue'] }
];

// Component for a single animated loading step
const LoadingStep = ({ text, delay }: { text: string; delay: number }) => (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"/>
        <span className="text-indigo-300 font-medium">{text}</span>
    </motion.div>
);

export default function AISearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

  // The multi-step loading simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setInterval(() => {
        setLoadingStep(prev => {
          if (prev >= 3) {
            clearInterval(timer);
            setResults(mockSearchResults);
            setLoading(false);
            return 3;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleSearch = () => {
    if (!query) return;
    setLoading(true);
    setResults([]);
    setLoadingStep(0);
  };
  
  return (
    <div className="pt-32 max-w-5xl mx-auto px-6 min-h-screen pb-20">
      <div className="text-center mb-12">
        <motion.div
           initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 10, stiffness: 100 }}
           className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/50 shadow-[0_0_50px_rgba(79,70,229,0.3)]">
          <BrainCircuit className="w-12 h-12 text-indigo-400" />
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Semantic AI Search</h1>
        <p className="text-gray-400 text-lg">Describe cinematic vibes, not just titles. Our AI understands nuance.</p>
      </div>

      <div className="relative mb-8 group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500 animate-pulse-glow"></div>
        <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl p-2">
            <textarea value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder='e.g., "A sci-fi movie about time travel that makes you cry"' className="w-full bg-transparent p-4 text-xl outline-none text-white h-24 resize-none" />
            <button onClick={handleSearch} className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition shadow-lg active:scale-95 self-end mb-2 mr-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> Generate
            </button>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {querySuggestions.map((s, i) => (
            <motion.button key={s} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i * 0.1}} onClick={() => setQuery(s)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-400 hover:bg-white/10 hover:text-white transition">
                {s}
            </motion.button>
        ))}
      </div>

       <AnimatePresence>
        {loading && (
            <motion.div className="space-y-3 max-w-md mx-auto">
                {loadingStep >= 1 && <LoadingStep text="Analyzing semantic query..." delay={0} />}
                {loadingStep >= 2 && <LoadingStep text="Scanning vector embeddings..." delay={0} />}
                {loadingStep >= 3 && <LoadingStep text="Compiling recommendations..." delay={0} />}
            </motion.div>
        )}
       </AnimatePresence>
      
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <AnimatePresence>
        {results.map((r, i) => (
          <motion.div 
             key={r.id} 
             initial={{opacity: 0, y: 30}} animate={{opacity: 1, y: 0}} transition={{delay: i * 0.2}} exit={{opacity: 0}}
             onClick={()=>router.push(`/movie/${r.id}?type=${r.type}`)}
             className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col gap-4 hover:bg-white/10 transition cursor-pointer group hover:border-indigo-500/50"
          >
            <div className="flex gap-4">
                <img src={r.poster} className="w-24 h-36 rounded-lg object-cover shadow-lg"/>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-400 transition">{r.title}</h3>
                    <div className="font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full text-sm inline-block">{r.match}% Match</div>
                </div>
            </div>
            <div>
                <p className="text-gray-400 font-medium">✨ AI Analysis: <span className="text-gray-300">{r.desc}</span></p>
                <div className="flex flex-wrap gap-2 mt-3">
                    {r.tags.map((t: string) => <span key={t} className="text-xs bg-white/10 px-2 py-1 rounded font-bold">{t}</span>)}
                </div>
            </div>
            <div className="flex-1 flex items-end justify-end">
                <div className="flex items-center gap-1 text-gray-500 group-hover:text-white transition-colors font-bold">
                    View Details <ArrowRight className="w-4 h-4"/>
                </div>
            </div>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
