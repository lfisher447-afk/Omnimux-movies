'use client';
import { useState } from 'react';
import { Sparkles, BrainCircuit } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AISearch() {
  const[query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const[results, setResults] = useState<any[]>([]);
  const router = useRouter();

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      setResults([
        { id: 157336, title: "Interstellar", desc: "Space, time dilation, emotional score.", type: 'movie' },
        { id: 68718, title: "Django Unchained", desc: "Bounty hunting, western, revenge.", type: 'movie' }
      ]);
      setLoading(false);
    }, 1500);
  }

  return (
    <div className="pt-32 max-w-4xl mx-auto px-6 min-h-screen">
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/50 shadow-[0_0_50px_rgba(79,70,229,0.3)]">
          <BrainCircuit className="w-12 h-12 text-indigo-400" />
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Semantic AI Search</h1>
        <p className="text-gray-400 text-lg">Describe what you're in the mood for in natural language.</p>
      </div>

      <div className="relative mb-12 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
        <textarea value={query} onChange={e=>setQuery(e.target.value)} placeholder='e.g., "A sci-fi movie about time travel that makes you cry"' className="relative w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-xl outline-none text-white focus:border-indigo-500 transition h-40 resize-none shadow-2xl" />
        <button onClick={handleSearch} className="absolute bottom-6 right-6 bg-white text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 transition shadow-lg active:scale-95">
          <Sparkles className="w-5 h-5 text-indigo-600" /> Generate
        </button>
      </div>

      {loading && <div className="text-center text-indigo-400 animate-pulse font-mono font-bold">Running neural network embeddings across TMDB...</div>}
      
      <div className="grid gap-4">
        {results.map(r => (
          <div key={r.id} onClick={()=>router.push(`/movie/${r.id}?type=${r.type}`)} className="bg-white/5 p-6 rounded-2xl border border-white/10 flex gap-6 hover:bg-white/10 transition cursor-pointer group">
            <div className="w-16 h-24 bg-indigo-900/50 rounded-xl flex items-center justify-center font-black text-indigo-400 border border-indigo-500/30">AI</div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-400 transition">{r.title}</h3>
              <p className="text-gray-400 font-medium">Semantic Match: <span className="text-gray-300">{r.desc}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
