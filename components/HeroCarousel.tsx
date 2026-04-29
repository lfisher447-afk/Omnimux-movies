'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';
import Link from 'next/link';

export function HeroCarousel({ movies }: { movies: any[] }) {
  const[index, setIndex] = useState(0);
  useEffect(() => { const t = setInterval(() => setIndex(p => (p + 1) % Math.min(movies.length, 5)), 8000); return () => clearInterval(t); }, [movies]);
  if (!movies.length) return <div className="h-[80vh] bg-[#0a0a0a]" />;
  const hero = movies[index];

  return (
    <div className="relative h-[80vh] w-full overflow-hidden bg-black">
      <AnimatePresence mode="popLayout">
        <motion.div key={hero.id} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2 }} className="absolute inset-0 ken-burns">
          <img src={`https://image.tmdb.org/t/p/original${hero.backdrop_path}`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030508] via-transparent to-transparent" />
          
          <div className="absolute top-1/3 left-6 md:left-16 max-w-3xl z-20">
             <div className="flex gap-2 mb-4">
                <span className="bg-white text-black px-3 py-1 rounded text-xs font-black uppercase tracking-widest">Trending #1</span>
                <span className="bg-white/10 backdrop-blur px-3 py-1 rounded text-xs font-bold text-yellow-400 border border-white/10">4K HDR</span>
             </div>
             <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-2xl leading-none mb-4 tracking-tighter">{hero.title || hero.name}</h1>
             <p className="text-gray-300 text-lg line-clamp-3 mb-8 drop-shadow-lg">{hero.overview}</p>
             <div className="flex gap-4">
                <Link href={`/movie/${hero.id}?type=${hero.media_type || 'movie'}`} className="bg-white hover:bg-gray-200 text-black px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition-all">
                   <Play className="w-5 h-5 fill-current"/> Watch Now
                </Link>
             </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
