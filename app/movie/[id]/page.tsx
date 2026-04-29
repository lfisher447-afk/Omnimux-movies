'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { SERVERS } from '@/lib/servers';
import { AmbientPlayer } from '@/components/AmbientPlayer';
import { VideoFilters } from '@/components/VideoFilters';
import { NicoNicoComments } from '@/components/NicoNicoComments';
import { WebRTCVoice } from '@/components/WebRTCVoice';
import { EyeOff, Activity, Share2, Server, Star, Calendar, Clock, Loader2, Maximize2, Layers, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdvancedPlayerPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const room = searchParams.get('room');
  const router = useRouter();
  
  const { addToHistory, spoilerFree, toggleSpoilerFree, themeColor, setThemeColor } = useStore();
  const[movie, setMovie] = useState<any>(null);
  const [showNico, setShowNico] = useState(false);
  const [ping, setPing] = useState(24);
  const[serverIdx, setServerIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const[cinemaMode, setCinemaMode] = useState(false);

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
    
    const pingInt = setInterval(() => setPing(Math.floor(Math.random() * 15) + 18), 2500);
    return () => clearInterval(pingInt);
  },[params.id, type]);

  if (loading) return <div className="h-screen bg-[#030508] flex items-center justify-center"><Loader2 className="w-16 h-16 text-white/50 animate-spin" /></div>;
  if (!movie || movie.error) return <div className="h-screen flex items-center justify-center"><h1 className="text-4xl font-black text-red-500">SIGNAL LOST</h1></div>;

  const streamUrl = SERVERS[serverIdx].build(type, params.id, season, episode); 

  return (
    <div className={`transition-colors duration-1000 max-w-[1800px] mx-auto px-4 lg:px-8 ${cinemaMode ? 'fixed inset-0 z-[99999] bg-black overflow-y-auto px-0' : ''}`} style={{ '--theme-color': themeColor } as any}>
      {!cinemaMode && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6 mt-4">
          <div className="flex-1">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-2xl mb-4 text-white">{movie.title || movie.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-gray-300">
              <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {movie.vote_average?.toFixed(1)}</span>
              <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"><Calendar className="w-4 h-4" /> {movie.release_date || movie.first_air_date}</span>
              {(movie.runtime || type === 'movie') && <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"><Clock className="w-4 h-4" /> {movie.runtime || 120}m</span>}
              <span className="px-4 py-2 uppercase tracking-widest text-[#030508] bg-white font-black rounded-xl">{type}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setCinemaMode(true)} className="px-6 py-3 rounded-2xl font-bold text-sm bg-white hover:bg-gray-200 text-black shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center gap-2 transition-all"><Maximize2 className="w-4 h-4"/> Immersive Focus</button>
            <button onClick={toggleSpoilerFree} className={`px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold transition-all border ${spoilerFree ? 'bg-red-500/20 text-red-500 border-red-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}><EyeOff className="w-4 h-4"/> Spoilers {spoilerFree?'Blocked':'Visible'}</button>
            <button onClick={() => setShowNico(!showNico)} className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all border ${showNico ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}><Layers className="w-4 h-4"/> Comms Link</button>
          </div>
        </motion.div>
      )}

      <div className={`flex flex-col ${cinemaMode ? 'w-full max-w-[100vw]' : 'xl:flex-row'} gap-8`}>
        <div className={`flex-1 min-w-0 flex flex-col ${cinemaMode ? 'h-screen p-8 max-w-[1920px] mx-auto w-full' : ''}`}>
          
          {cinemaMode && (
            <button onClick={() => setCinemaMode(false)} className="absolute top-8 left-8 z-50 bg-black/50 hover:bg-white/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition text-white backdrop-blur-md border border-white/10">
              Exit Immersive Focus
            </button>
          )}

          <div className={`relative ${cinemaMode ? 'h-[85vh] w-full mt-16 rounded-[40px]' : ''} `}>
             <AmbientPlayer src={streamUrl} />
             <NicoNicoComments active={showNico} />
          </div>

          {!cinemaMode && type === 'tv' && movie.seasons && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 glass-panel rounded-3xl p-6 flex gap-6 md:items-center flex-col md:flex-row relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/5 pointer-events-none"/>
                 <div className="flex-1 relative z-10">
                     <label className="text-[11px] font-black text-indigo-400 tracking-widest uppercase mb-2 block">Initialize Season</label>
                     <select value={season} onChange={e=>setSeason(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-white/10 outline-none text-white px-5 py-4 rounded-xl font-bold appearance-none cursor-pointer focus:border-indigo-500 transition-colors shadow-inner">
                         {movie.seasons.filter((s:any) => s.season_number > 0).map((s:any) => <option key={s.id} value={s.season_number}>Season {s.season_number}</option>)}
                     </select>
                 </div>
                 <div className="flex-1 relative z-10">
                     <label className="text-[11px] font-black text-indigo-400 tracking-widest uppercase mb-2 block">Extract Episode</label>
                     <select value={episode} onChange={e=>setEpisode(Number(e.target.value))} className="w-full bg-[#0a0a0a] border border-white/10 outline-none text-white px-5 py-4 rounded-xl font-bold appearance-none cursor-pointer focus:border-indigo-500 transition-colors shadow-inner">
                         {Array.from({length: movie.seasons.find((s:any)=>s.season_number === season)?.episode_count || 1}).map((_, i) => <option key={i} value={i+1}>Episode {i+1}</option>)}
                     </select>
                 </div>
             </motion.div>
          )}

          {!cinemaMode && (
            <>
              <div className="flex flex-wrap items-center gap-3 mt-8 p-4 glass-panel rounded-3xl overflow-x-auto custom-scrollbar">
                <div className="flex items-center gap-2 px-4 text-xs font-black tracking-widest text-indigo-400 uppercase border-r border-white/10 py-2"><Server className="w-4 h-4"/> Node Resolver</div>
                {SERVERS.map((s, i) => (
                  <button key={s.id} onClick={() => setServerIdx(i)} className={`shrink-0 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${serverIdx === i ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' : 'text-gray-400 bg-black/50 hover:text-white hover:bg-white/10 border border-white/5'}`}>
                    {s.badge} {s.name}
                  </button>
                ))}
              </div>

              <VideoFilters />
              
              <div className={`mt-8 glass-panel rounded-[40px] p-10 md:p-14 relative overflow-hidden transition-all duration-500 ${spoilerFree ? 'blur-2xl hover:blur-none cursor-pointer' : ''}`}>
                <h3 className="font-black mb-6 text-3xl tracking-tighter text-white">Encrypted Overview</h3>
                <p className="text-gray-300 leading-relaxed max-w-5xl text-xl font-medium">{movie.overview}</p>
                {movie.genres && (
                  <div className="flex flex-wrap gap-3 mt-8">
                    {movie.genres.map((g: any) => <span key={g.id} className="bg-white/5 border border-white/10 px-6 py-2 rounded-xl text-sm text-white font-bold shadow-sm">{g.name}</span>)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {!cinemaMode && (
          <div className="w-full xl:w-[450px] flex-shrink-0 space-y-8">
            <div className="glass-panel p-8 rounded-[40px] relative overflow-hidden">
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                <span className="font-black text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-500"/> Social Layer</span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-bold"><Activity className="w-3 h-3 animate-pulse"/> {ping}ms Sync</span>
              </div>
              
              {room ? (
                <div className="space-y-6 relative z-10">
                  <div className="bg-black/50 border border-white/10 p-6 rounded-3xl text-center relative group">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Network Key</p>
                    <p className="text-4xl font-mono font-black text-white">{room}</p>
                    <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="absolute inset-0 bg-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl font-bold tracking-widest uppercase">Copy Directive</button>
                  </div>
                  <WebRTCVoice roomCode={room} />
                </div>
              ) : (
                <button onClick={() => router.push(`?type=${type}&room=${Math.random().toString(36).substr(2,6).toUpperCase()}`)} className="w-full bg-white text-black py-6 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-gray-200 transition-all active:scale-95 text-lg shadow-[0_10px_40px_rgba(255,255,255,0.2)] hover:shadow-[0_10px_60px_rgba(255,255,255,0.3)]">
                  <Users className="w-6 h-6"/> Broadcast Watch Party
                </button>
              )}
            </div>

            {movie.backdrop_path && (
               <div className="rounded-[40px] overflow-hidden border border-white/10 relative shadow-2xl h-[300px]">
                 <img src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`} className="w-full h-full object-cover grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-700" />
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
