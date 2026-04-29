'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { SERVERS } from '@/lib/servers';
import { AmbientPlayer } from '@/components/AmbientPlayer';
import { VideoFilters } from '@/components/VideoFilters';
import { NicoNicoComments } from '@/components/NicoNicoComments';
import { WebRTCVoice } from '@/components/WebRTCVoice';
import { Users, EyeOff, Activity, Share2, Server, Star, Calendar, Clock, Loader2, Maximize2, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [cinemaMode, setCinemaMode] = useState(false);

  // Television Selectors
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
    
    const pingInt = setInterval(() => setPing(Math.floor(Math.random() * 25) + 12), 3000);
    return () => clearInterval(pingInt);
  },[params.id, type]);

  if (loading) return (
    <div className="h-screen bg-[#030508] flex items-center justify-center">
      <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
    </div>
  );

  if (!movie || movie.error) return <div className="h-screen flex items-center justify-center text-red-500 text-3xl font-black tracking-tighter">SIGNAL LOST.</div>;

  const streamUrl = SERVERS[serverIdx].build(type, params.id, season, episode); 

  return (
    <div className={`pt-28 min-h-screen px-4 max-w-[1800px] mx-auto pb-32 transition-colors duration-1000 ${cinemaMode ? 'z-[9999] bg-black inset-0 fixed overflow-y-auto' : ''}`} style={{ '--theme-color': themeColor } as any}>
      
      {!cinemaMode && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
          <div className="flex-1">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter drop-shadow-2xl mb-2" style={{ color: themeColor, textShadow: `0 0 60px ${themeColor}50` }}>{movie.title || movie.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-300">
              <span className="flex items-center gap-1.5 bg-white/10 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md shadow-lg"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> {movie.vote_average?.toFixed(1)}</span>
              <span className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md"><Calendar className="w-4 h-4 text-gray-400" /> {movie.release_date || movie.first_air_date || 'N/A'}</span>
              {(movie.runtime || type === 'movie') && <span className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md"><Clock className="w-4 h-4 text-gray-400" /> {movie.runtime || 120} min</span>}
              <span className="px-4 py-2 uppercase tracking-widest text-xs bg-white/10 border border-white/20 rounded-xl backdrop-blur-md text-white">{type}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setCinemaMode(true)} className="px-6 py-3 rounded-2xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] flex items-center gap-2 transition-all hover:scale-105"><Maximize2 className="w-4 h-4"/> Immersive Mode</button>
            <button onClick={toggleSpoilerFree} className={`px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-bold transition-all shadow-lg ${spoilerFree ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-white/10 hover:bg-white/20'}`}><EyeOff className="w-4 h-4"/> {spoilerFree ? 'Spoilers Blocked' : 'Spoiler Free'}</button>
            <button onClick={() => setShowNico(!showNico)} className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg ${showNico ? 'bg-purple-600 text-white shadow-purple-600/20' : 'bg-white/10 hover:bg-white/20'}`}><Layers className="w-4 h-4"/> Niconico Sync</button>
          </div>
        </motion.div>
      )}

      <div className={`flex flex-col ${cinemaMode ? '' : 'xl:flex-row'} gap-10`}>
        <div className={`flex-1 min-w-0 flex flex-col ${cinemaMode ? 'max-w-7xl mx-auto w-full mt-10' : ''}`}>
          
          {cinemaMode && (
            <button onClick={() => setCinemaMode(false)} className="mb-6 self-start bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition text-white backdrop-blur-md border border-white/10">
              Exit Immersive Mode
            </button>
          )}

          <AmbientPlayer src={streamUrl} />
          <NicoNicoComments active={showNico} />

          {/* TV Shows Selector Interface */}
          {type === 'tv' && movie.seasons && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-[#111] border border-white/10 rounded-2xl p-4 flex gap-4 md:items-center flex-col md:flex-row shadow-2xl">
                 <div className="flex-1">
                     <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1 block">Selected Season</label>
                     <select value={season} onChange={e=>setSeason(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 outline-none text-white px-4 py-3 rounded-xl font-bold appearance-none cursor-pointer hover:bg-white/10 transition">
                         {movie.seasons.filter((s:any) => s.season_number > 0).map((s:any) => (
                             <option key={s.id} value={s.season_number} className="bg-[#111]">Season {s.season_number}</option>
                         ))}
                     </select>
                 </div>
                 <div className="flex-1">
                     <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-1 block">Selected Episode</label>
                     <select value={episode} onChange={e=>setEpisode(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 outline-none text-white px-4 py-3 rounded-xl font-bold appearance-none cursor-pointer hover:bg-white/10 transition">
                         {Array.from({length: movie.seasons.find((s:any)=>s.season_number === season)?.episode_count || 1}).map((_, i) => (
                             <option key={i} value={i+1} className="bg-[#111]">Episode {i+1}</option>
                         ))}
                     </select>
                 </div>
             </motion.div>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-6 bg-white/5 p-4 rounded-2xl backdrop-blur-xl border border-white/10 overflow-x-auto custom-scrollbar shadow-lg">
            <div className="flex items-center gap-2 px-4 text-xs font-black tracking-widest text-gray-400 uppercase"><Server className="w-4 h-4"/> Edge Hub</div>
            <div className="w-[1px] h-6 bg-white/10 mr-2" />
            {SERVERS.map((s, i) => (
              <button key={s.id} onClick={() => setServerIdx(i)} className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${serverIdx === i ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-105' : 'text-gray-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10'}`}>
                {s.badge} {s.name}
              </button>
            ))}
          </div>

          <VideoFilters />
          
          <div className={`mt-10 bg-white/5 border border-white/10 rounded-[32px] p-8 md:p-12 backdrop-blur-3xl transition-all duration-500 shadow-2xl relative overflow-hidden ${spoilerFree ? 'blur-xl hover:blur-0 cursor-pointer' : ''}`}>
             <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
             <h3 className="font-black mb-6 text-4xl tracking-tighter text-white">Transmission Data</h3>
             <p className="text-gray-300 leading-relaxed max-w-5xl text-xl font-medium">{movie.overview || "No transmission data found for this broadcast."}</p>
             
             {movie.genres && (
               <div className="flex flex-wrap gap-3 mt-8">
                 {movie.genres.map((g: any) => (
                   <span key={g.id} className="bg-[#0a0a0a] border border-white/10 px-5 py-2 rounded-xl text-sm text-gray-300 font-bold shadow-lg hover:bg-white/10 transition cursor-default">{g.name}</span>
                 ))}
               </div>
             )}
          </div>
        </div>

        {!cinemaMode && (
          <div className="w-full xl:w-[450px] flex-shrink-0 space-y-8">
            <div className="bg-gradient-to-b from-white/10 to-transparent border border-white/10 p-8 rounded-[32px] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition duration-1000 pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6 relative z-10">
                <span className="font-black text-xs text-gray-300 uppercase tracking-widest flex items-center gap-2"><Server className="w-4 h-4 text-indigo-400"/> WebRTC Proxies</span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-bold"><Activity className="w-3 h-3 animate-pulse"/> {ping}ms</span>
              </div>
              
              <div className="relative z-10">
                {room ? (
                  <div className="space-y-6">
                    <div className="relative overflow-hidden bg-indigo-500/10 text-indigo-300 p-6 rounded-2xl text-center font-mono border border-indigo-500/30 shadow-[0_0_40px_rgba(79,70,229,0.15)] group">
                      <p className="text-xs text-indigo-400/80 mb-2 font-sans font-black uppercase tracking-widest">Share Cipher</p>
                      <p className="text-4xl font-black tracking-widest">{room}</p>
                      <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Cipher Copied!'); }} className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                         <span className="bg-black px-4 py-2 rounded-lg font-sans font-bold flex items-center gap-2 text-white"><Share2 className="w-4 h-4"/> Copy Link</span>
                      </button>
                    </div>
                    <WebRTCVoice roomCode={room} />
                  </div>
                ) : (
                  <button onClick={() => router.push(`?type=${type}&room=${Math.random().toString(36).substr(2,6).toUpperCase()}`)} className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-2xl font-black flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] transition-all active:scale-[0.98] text-white text-lg">
                    <Users className="w-6 h-6"/> Initialize Sync Party
                  </button>
                )}
              </div>
            </div>

            {movie.backdrop_path && (
               <div className="rounded-[32px] overflow-hidden border border-white/10 relative shadow-2xl group h-64">
                 <img src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-1000" />
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/20 to-transparent flex items-end p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <p className="text-white font-black tracking-widest uppercase text-xs">Visual Telemetry</p>
                 </div>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
