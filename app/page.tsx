'use client';
import { useEffect, useState } from 'react';
import { HeroCarousel } from '@/components/HeroCarousel';
import { MovieCard } from '@/components/MovieCard';
import { useStore } from '@/store/useStore';
import { Film, TrendingUp, Sparkles } from 'lucide-react';

export default function Home() {
  const[trending, setTrending] = useState<any[]>([]);
  const { history, watchlist, activeProfile } = useStore();

  useEffect(() => {
    fetch('/api/tmdb?endpoint=/trending/all/week').then(r => r.json()).then(d => setTrending(d.results || []));
  },[]);

  if (!activeProfile) return null; // Wait for profile selection

  return (
    <div className="pb-32">
       <HeroCarousel movies={trending} />
       <div className="max-w-[1800px] mx-auto px-6 -mt-32 relative z-20 space-y-16">
         {history.length > 0 && (
           <div>
             <h2 className="text-2xl font-black flex items-center gap-3 mb-6"><Film className="text-indigo-400"/> CONTINUE WATCHING</h2>
             <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar">{history.map(m => <MovieCard key={m.id} movie={m} />)}</div>
           </div>
         )}
         <div>
           <h2 className="text-2xl font-black flex items-center gap-3 mb-6"><TrendingUp className="text-orange-500"/> TRENDING GLOBALLY</h2>
           <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar">{trending.map(m => <MovieCard key={m.id} movie={m} />)}</div>
         </div>
       </div>
    </div>
  );
}
