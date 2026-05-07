'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { SERVERS } from '@/lib/servers';
import { VideoFilters } from '@/components/VideoFilters';
import { AudioFilters } from '@/components/AudioFilters';
import { NicoNicoComments } from '@/components/NicoNicoComments';
import { Server, Star, Calendar, Clock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const AmbilightPlayer = dynamic(() => import('@/components/AmbilightPlayer').then(mod => mod.AmbilightPlayer), { ssr: false });
const WebRTCVoice = dynamic(() => import('@/components/WebRTCVoice').then(mod => mod.WebRTCVoice), { ssr: false });

export default function AdvancedPlayerPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const room = searchParams.get('room');
  const router = useRouter();
  
  const { addToHistory, themeColor, setThemeColor } = useStore();
  const [movie, setMovie] = useState<any>(null);
  const[showNico, setShowNico] = useState(false);
  const [serverIdx, setServerIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tmdb?endpoint=/${type}/${params.id}`)
      .then(r => r.json())
      .then(d => { 
        setMovie(d); 
        addToHistory({ id: params.id, type, title: d.title || d.name, poster_path: d.poster_path, runtime: d.runtime || 45 }); 
        setThemeColor(d.vote_average > 7.5 ? '#10b981' : d.vote_average > 6 ? '#3b82f6' : '#8b5cf6');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  },[params.id, type]);

  if (loading) return <div className="h-screen bg-[#030508] flex items-center justify-center"><Loader2 className="w-16 h-16 text-indigo-500 animate-spin" /></div>;

  const currentServer = SERVERS[serverIdx];
  const streamUrl = currentServer.build(type, params.id, season, episode); 

  return (
    <div className={`transition-colors duration-1000 max-w-[1800px] mx-auto px-4 lg:px-8`} style={{ '--theme-color': themeColor } as any}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6 mt-4">
          <div className="flex-1">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-2xl mb-4 text-white">{movie?.title || movie?.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-gray-300">
              <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {movie?.vote_average?.toFixed(1)}</span>
              <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"><Calendar className="w-4 h-4" /> {movie?.release_date || movie?.first_air_date}</span>
              {(movie?.runtime || type === 'movie') && <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"><Clock className="w-4 h-4" /> {movie?.runtime || 120}m</span>}
              <span className="px-4 py-2 uppercase tracking-widest text-[#030508] bg-white font-black rounded-xl">{type}</span>
            </div>
          </div>
      </motion.div>

      <div className={`flex flex-col xl:flex-row gap-8`}>
        <div className={`flex-1 min-w-0 flex flex-col`}>
          
          <div className="relative">
             <AmbilightPlayer src={streamUrl} type={currentServer.type as any} />
             <NicoNicoComments active={showNico} />
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-8 p-4 glass-panel rounded-3xl overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-2 px-4 text-xs font-black tracking-widest text-indigo-400 uppercase border-r border-white/10 py-2"><Server className="w-4 h-4"/> Select Source</div>
            {SERVERS.map((s, i) => (
              <button key={s.id} onClick={() => setServerIdx(i)} className={`shrink-0 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${serverIdx === i ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' : 'text-gray-400 bg-black/50 hover:text-white hover:bg-white/10 border border-white/5'}`}>
                {s.badge} {s.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 items-start">
             <VideoFilters />
             <AudioFilters />
          </div>
        </div>

        <div className="w-full xl:w-[450px] flex-shrink-0 space-y-8">
            <div className="glass-panel p-8 rounded-[40px] relative overflow-hidden">
                <WebRTCVoice roomCode={room || `LOBBY-${params.id}`} />
            </div>

            {movie?.backdrop_path && (
               <div className="rounded-[40px] overflow-hidden border border-white/10 relative shadow-2xl h-[300px]">
                 <img src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`} className="w-full h-full object-cover grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-700" />
               </div>
            )}
        </div>
      </div>
    </div>
  );
}
