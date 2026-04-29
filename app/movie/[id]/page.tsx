'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { SERVERS } from '@/lib/servers';
import { AmbientPlayer } from '@/components/AmbientPlayer';
import { VideoFilters } from '@/components/VideoFilters';
import { NicoNicoComments } from '@/components/NicoNicoComments';
import { WebRTCVoice } from '@/components/WebRTCVoice';
import { Users, EyeOff, Activity, Share2, Server, Star, Calendar, Clock, Loader2, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdvancedPlayerPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const room = searchParams.get('room');
  const router = useRouter();
  
  const { addToHistory, spoilerFree, toggleSpoilerFree, themeColor, setThemeColor } = useStore();
  const [movie, setMovie] = useState<any>(null);
  const [showNico, setShowNico] = useState(false);
  const [ping, setPing] = useState(0);
  const [serverIdx, setServerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const[cinemaMode, setCinemaMode] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tmdb?endpoint=/${type}/${params.id}`)
      .then(r => r.json())
      .then(d => { 
        setMovie(d); 
        addToHistory({ id: params.id, type, title: d.title || d.name, poster_path: d.poster_path, runtime: d.runtime || 120 }); 
        setThemeColor(d.vote_average > 8 ? '#10b981' : d.vote_average > 6 ? '#3b82f6' : '#f59e0b');
        setLoading(false);
      })
      .catch(() => setLoading(false));
    
    const pingInt = setInterval(() => setPing(Math.floor(Math.random() * 25) + 12), 3000);
    return () => clearInterval(pingInt);
  },[params.id, type]);

  if (loading) return (
    <div className="h-screen bg-[#030508] flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
    </div>
  );

  if (!movie || movie.error) return <div className="h-screen bg-[#030508] flex items-center justify-center text-red-500 text-2xl font-bold">Failed to load content.</div>;

  const streamUrl = SERVERS[serverIdx].build(type, params.id, 1, 1); // Mock S1 E1 for initial load on index

  return (
    <div className={`pt-24 min-h-screen px-4 max-w-[1800px] mx-auto pb-32 transition-colors duration-1000 ${cinemaMode ? 'z-[9999] bg-black inset-0 fixed overflow-y-auto' : ''}`} style={{ '--theme-color': themeColor } as any}>
      
      {!cinemaMode && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-2xl" style={{ color: themeColor, textShadow: `0 0 40px ${themeColor}40` }}>{movie.title || movie.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-bold text-gray-300">
              <span className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 shadow-sm"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {movie.vote_average?.toFixed(1)}</span>
              <span className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><Calendar className="w-4 h-4 text-gray-400" /> {movie.release_date || movie.first_air_date || 'N/A'}</span>
              {(movie.runtime || type === 'movie') && <span className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5"><Clock className="w-4 h-4 text-gray-400" /> {movie.runtime || 120} min</span>}
              <span className="px-3 py-1.5 uppercase tracking-widest text-xs bg-white/10 border border-white/20 rounded-lg">{type}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setCinemaMode(true)} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 flex items-center gap-2 transition"><Maximize2 className="w-4 h-4"/> Cinema Mode</button>
            <button onClick={toggleSpoilerFree} className={`px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-lg ${spoilerFree ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-white/10 hover:bg-white/20'}`}><EyeOff className="w-4 h-4"/> Spoiler Free</button>
            <button onClick={() => setShowNico(!showNico)} className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg ${showNico ? 'bg-purple-600 text-white shadow-purple-600/20' : 'bg-white/10 hover:bg-white/20'}`}>NicoNico</button>
          </div>
        </motion.div>
      )}

      <div className={`flex flex-col ${cinemaMode ? '' : 'xl:flex-row'} gap-8`}>
        <div className={`flex-1 min-w-0 flex flex-col ${cinemaMode ? 'max-w-6xl mx-auto w-full mt-10' : ''}`}>
          
          {cinemaMode && (
            <button onClick={() => setCinemaMode(false)} className="mb-4 self-start bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition text-white">
              Exit Cinema Mode
            </button>
          )}

          <div className="relative group ring-1 ring-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <AmbientPlayer src={streamUrl} />
            <NicoNicoComments active={showNico} />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-4 bg-white/5 p-3 rounded-2xl backdrop-blur-xl border border-white/10 overflow-x-auto custom-scrollbar shadow-lg">
            <div className="flex items-center gap-2 px-3 text-xs font-bold text-gray-400 border-r border-white/10 py-1"><Server className="w-4 h-4"/> Server Source:</div>
            {SERVERS.map((s, i) => (
              <button key={s.id} onClick={() => setServerIdx(i)} className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${serverIdx === i ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                {s.badge} {s.name}
              </button>
            ))}
          </div>

          <VideoFilters />
          
          <div className={`mt-8 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md transition-all duration-500 shadow-xl relative overflow-hidden ${spoilerFree ? 'blur-md hover:blur-0 cursor-pointer' : ''}`}>
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
             <h3 className="font-bold mb-4 text-3xl tracking-tight text-white/90">Synopsis</h3>
             <p className="text-gray-300 leading-relaxed max-w-5xl text-lg md:text-xl font-medium">{movie.overview}</p>
             
             {movie.genres && (
               <div className="flex flex-wrap gap-2 mt-6">
                 {movie.genres.map((g: any) => (
                   <span key={g.id} className="bg-white/10 border border-white/10 px-4 py-1.5 rounded-lg text-sm text-gray-300 font-bold shadow-sm">{g.name}</span>
                 ))}
               </div>
             )}
          </div>
        </div>

        {!cinemaMode && (
          <div className="w-full xl:w-[420px] flex-shrink-0 space-y-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/20 blur-[50px] rounded-full group-hover:bg-indigo-500/30 transition duration-700"></div>
              
              <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 relative z-10">
                <span className="font-bold text-sm text-gray-300 uppercase tracking-widest flex items-center gap-2"><Server className="w-4 h-4"/> Edge Proxy</span>
                <span className="text-xs font-mono text-green-400 flex items-center gap-1 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]"><Activity className="w-3 h-3 animate-pulse"/> {ping}ms</span>
              </div>
              
              <div className="relative z-10">
                {room ? (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden bg-indigo-500/10 text-indigo-300 p-5 rounded-2xl text-center font-mono border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.15)] transition">
                      <p className="text-xs text-indigo-400/80 mb-1 font-sans font-bold uppercase">Invite Code</p>
                      <p className="text-2xl font-black tracking-widest">{room}</p>
                      <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Copied Link!'); }} className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded-lg transition"><Share2 className="w-4 h-4"/></button>
                    </div>
                    <WebRTCVoice roomCode={room} />
                  </div>
                ) : (
                  <button onClick={() => router.push(`?type=${type}&room=${Math.random().toString(36).substr(2,6).toUpperCase()}`)} className="w-full bg-indigo-600 hover:bg-indigo-500 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] transition-all active:scale-[0.98] text-white">
                    <Users className="w-6 h-6"/> Start Watch Party
                  </button>
                )}
              </div>
            </div>

            {movie.backdrop_path && (
               <div className="rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl group">
                 <img src={`https://image.tmdb.org/t/p/w500${movie.backdrop_path}`} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700 blur-[2px] group-hover:blur-none" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex items-end p-6">
                    <p className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded backdrop-blur">Scene Preview</p>
                 </div>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
