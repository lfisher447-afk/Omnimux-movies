'use client';
import { useEffect, useState } from 'react';
import { HeroCarousel } from '@/components/HeroCarousel';
import { MovieCard } from '@/components/MovieCard';
import { useStore } from '@/store/useStore';
import { Film, TrendingUp, Sparkles, Compass, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const[trending, setTrending] = useState<any[]>([]);
  const [topRated, setTopRated] = useState<any[]>([]);
  const [sciFi, setSciFi] = useState<any[]>([]);
  
  const { history, activeProfile } = useStore();

  useEffect(() => {
    // Parallel Fetching for massive performance boost
    Promise.all([
      fetch('/api/tmdb?endpoint=/trending/all/week').then(r=>r.json()),
      fetch('/api/tmdb?endpoint=/movie/top_rated').then(r=>r.json()),
      fetch('/api/tmdb?endpoint=/discover/movie&with_genres=878').then(r=>r.json())
    ]).then(([trendData, topData, sfData]) => {
      setTrending(trendData.results ||[]);
      setTopRated(topData.results || []);
      setSciFi(sfData.results || []);
    });
  },[]);

  // Safety net since ClientWrapper handles the auth, but types might complain
  if (!activeProfile) return null; 

  const Section = ({ title, icon: Icon, data, color }: any) => {
    if(!data || data.length === 0) return null;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
        <h2 className="text-3xl font-black flex items-center gap-3 mb-8 tracking-tighter"><Icon className={`w-8 h-8 ${color}`}/> {title}</h2>
        <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar px-2 -mx-2">{data.map((m:any) => <MovieCard key={m.id} movie={m} />)}</div>
      </motion.div>
    );
  };

  return (
    <div className="pb-32 bg-[#030508]">
       <HeroCarousel movies={trending} />
       <div className="max-w-[1800px] mx-auto px-6 -mt-40 relative z-20">
         <Section title="CONTINUE EXPLORING" icon={Film} color="text-indigo-400" data={history} />
         <Section title="GLOBAL TRENDS" icon={TrendingUp} color="text-rose-500" data={trending} />
         <Section title="CRITICALLY ACCLAIMED" icon={Compass} color="text-amber-400" data={topRated} />
         <Section title="SCI-FI FRONTIER" icon={Zap} color="text-cyan-400" data={sciFi} />
       </div>
    </div>
  );
}
