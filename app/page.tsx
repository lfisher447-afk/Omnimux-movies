'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeroCarousel } from '@/components/HeroCarousel';
import { MovieCard } from '@/components/MovieCard';
import { useStore } from '@/store/useStore';
import { Film, TrendingUp, Compass, Zap, Search, Sparkles, Globe, Terminal, Server } from 'lucide-react';
import { motion } from 'framer-motion';

// Defined outside to prevent React from remounting during state changes
const Section = ({ title, icon: Icon, data, color }: { title: string, icon: any, data: any[], color: string }) => {
  if (!data || data.length === 0) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }} 
      className="mb-16"
    >
      <h2 className="text-3xl font-black flex items-center gap-3 mb-8 tracking-tighter">
        <Icon className={`w-8 h-8 ${color}`}/> {title}
      </h2>
      <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar px-2 -mx-2">
        {data.map((m: any, idx: number) => (
          <MovieCard key={`${m.id || m.name}-${idx}`} movie={m} />
        ))}
      </div>
    </motion.div>
  );
};

// New Module Button Component to link your folders
const ModuleButton = ({ href, icon: Icon, label, baseColor }: any) => (
  <Link href={href} className="glass-panel p-6 rounded-[24px] flex flex-col items-center justify-center gap-4 hover:bg-white/5 hover:border-white/20 transition-all duration-300 group hover:-translate-y-2 cursor-pointer relative overflow-hidden">
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-t ${baseColor} to-transparent`} />
    <Icon className={`w-8 h-8 ${baseColor.split(' ')[0].replace('from-', 'text-')} group-hover:scale-110 transition-transform duration-500`} />
    <span className="font-bold text-sm tracking-widest uppercase text-gray-300 group-hover:text-white transition-colors">{label}</span>
  </Link>
);

export default function Home() {
  const [trending, setTrending] = useState<any[]>([]);
  const[topRated, setTopRated] = useState<any[]>([]);
  const [sciFi, setSciFi] = useState<any[]>([]);
  
  const { history, activeProfile } = useStore();

  useEffect(() => {
    // Graceful error handling added to prevent crashes if TMDB hangs
    Promise.all([
      fetch('/api/tmdb?endpoint=/trending/all/week').then(r => r.json()),
      fetch('/api/tmdb?endpoint=/movie/top_rated').then(r => r.json()),
      fetch('/api/tmdb?endpoint=/discover/movie&with_genres=878').then(r => r.json())
    ])
    .then(([trendData, topData, sfData]) => {
      setTrending(trendData.results || []);
      setTopRated(topData.results ||[]);
      setSciFi(sfData.results ||[]);
    })
    .catch(err => console.error("Initial load failed", err));
  },[]);

  if (!activeProfile) return null; 

  return (
    <div className="pb-32 bg-[#030508]">
       <HeroCarousel movies={trending} />
       
       <div className="max-w-[1800px] mx-auto px-6 -mt-40 relative z-20">
         
         {/* --- NEW SYSTEM MODULES GRID linking your sub-folders --- */}
         <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <h2 className="text-3xl font-black flex items-center gap-3 mb-8 tracking-tighter text-white">
               <Server className="w-8 h-8 text-gray-300"/> SYSTEM MODULES
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <ModuleButton href="/discover" icon={Search} label="Discover Engine" baseColor="from-indigo-500" />
                <ModuleButton href="/ai-search" icon={Sparkles} label="Semantic AI" baseColor="from-fuchsia-500" />
                <ModuleButton href="/browser" icon={Globe} label="Neural Browser" baseColor="from-cyan-500" />
                <ModuleButton href="/terminal" icon={Terminal} label="OS Terminal" baseColor="from-emerald-500" />
                <ModuleButton href="/admin" icon={Server} label="Admin Core" baseColor="from-rose-500" />
            </div>
         </motion.div>

         <Section title="CONTINUE EXPLORING" icon={Film} color="text-indigo-400" data={history} />
         <Section title="GLOBAL TRENDS" icon={TrendingUp} color="text-rose-500" data={trending} />
         <Section title="CRITICALLY ACCLAIMED" icon={Compass} color="text-amber-400" data={topRated} />
         <Section title="SCI-FI FRONTIER" icon={Zap} color="text-cyan-400" data={sciFi} />
       </div>
    </div>
  );
}
