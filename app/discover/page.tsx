'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MovieCard } from '@/components/MovieCard';
import { Filter, Sparkles, Loader2 } from 'lucide-react';

const GENRES =[
  { id: 28, name: "Action", color: "from-red-500 to-orange-500" }, { id: 12, name: "Adventure", color: "from-emerald-500 to-teal-500" },
  { id: 16, name: "Animation", color: "from-pink-500 to-rose-500" }, { id: 35, name: "Comedy", color: "from-yellow-400 to-amber-500" },
  { id: 80, name: "Crime", color: "from-gray-700 to-gray-900" }, { id: 99, name: "Documentary", color: "from-blue-600 to-indigo-600" },
  { id: 18, name: "Drama", color: "from-purple-500 to-fuchsia-500" }, { id: 10751, name: "Family", color: "from-green-400 to-emerald-500" },
  { id: 14, name: "Fantasy", color: "from-violet-500 to-purple-600" }, { id: 36, name: "History", color: "from-amber-700 to-orange-800" },
  { id: 27, name: "Horror", color: "from-red-900 to-black" }, { id: 10402, name: "Music", color: "from-pink-400 to-purple-500" },
  { id: 9648, name: "Mystery", color: "from-slate-700 to-slate-900" }, { id: 10749, name: "Romance", color: "from-rose-400 to-pink-500" },
  { id: 878, name: "Science Fiction", color: "from-cyan-400 to-blue-500" }, { id: 53, name: "Thriller", color: "from-zinc-700 to-zinc-900" },
];

export default function Discover() {
  const [activeGenre, setActiveGenre] = useState<number>(28);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tmdb?endpoint=/discover/movie&with_genres=${activeGenre}&sort_by=popularity.desc`)
      .then(r => r.json())
      .then(d => { setMovies(d.results ||[]); setLoading(false); });
  }, [activeGenre]);

  return (
    <div className="max-w-[1800px] mx-auto px-6 pt-10 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 text-white drop-shadow-2xl">Discovery Matrix</h1>
              <p className="text-xl text-gray-400 font-medium">Filter the multiplex by emotional resonance and genre parameters.</p>
          </div>
          <button className="glass-button px-6 py-3 rounded-2xl flex items-center gap-2 font-bold"><Filter className="w-4 h-4"/> Advanced Filters</button>
      </div>

      <div className="flex flex-wrap gap-4 mb-16">
        {GENRES.map(g => (
          <motion.button 
             key={g.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
             onClick={() => setActiveGenre(g.id)}
             className={`px-6 py-3 rounded-2xl font-black tracking-widest uppercase text-sm transition-all duration-300 border shadow-lg ${activeGenre === g.id ? `bg-gradient-to-r ${g.color} border-transparent text-white shadow-[0_10px_30px_rgba(255,255,255,0.2)]` : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
          >
            {g.name}
          </motion.button>
        ))}
      </div>

      {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-16 h-16 text-indigo-500 animate-spin" /></div>
      ) : (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            <AnimatePresence>
                {movies.map((m: any, i) => (
                    <motion.div key={m.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                        <MovieCard movie={m} />
                    </motion.div>
                ))}
            </AnimatePresence>
          </motion.div>
      )}
    </div>
  );
}
