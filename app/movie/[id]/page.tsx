'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { SERVERS } from '@/lib/servers';
import { AmbientPlayer } from '@/components/AmbientPlayer';
import { VideoFilters } from '@/components/VideoFilters';
import { NicoNicoComments } from '@/components/NicoNicoComments';
import { WebRTCVoice } from '@/components/WebRTCVoice';
import { Users, EyeOff, Activity, Share2, Server } from 'lucide-react';

export default function AdvancedPlayerPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'movie';
  const room = searchParams.get('room');
  const router = useRouter();
  
  const { addToHistory, spoilerFree, toggleSpoilerFree, themeColor, setThemeColor } = useStore();
  const[movie, setMovie] = useState<any>(null);
  const [showNico, setShowNico] = useState(false);
  const [ping, setPing] = useState(0);
  const [serverIdx, setServerIdx] = useState(0);

  useEffect(() => {
    fetch(`/api/tmdb?endpoint=/${type}/${params.id}`)
      .then(r => r.json()).then(d => { 
        setMovie(d); 
        addToHistory({id: params.id, type, title: d.title || d.name, poster_path: d.poster_path, runtime: d.runtime}); 
        setThemeColor(d.vote_average > 8 ? '#10b981' : '#4f46e5'); // Dynamic Theme Extraction Mock
      });
    
    const pingInt = setInterval(() => setPing(Math.floor(Math.random() * 40) + 15), 3000);
    return () => clearInterval(pingInt);
  }, [params.id, type]);

  if (!movie) return <div className="h-screen bg-[#030508]" />;

  const streamUrl = SERVERS[serverIdx].build(type, params.id, 1, 1);

  return (
    <div className="pt-24 min-h-screen px-4 max-w-[1800px] mx-auto pb-32 transition-colors duration-1000" style={{ '--theme-color': themeColor } as any}>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter" style={{ color: themeColor }}>{movie.title || movie.name}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-400 font-bold">
            <span className="bg-white/10 px-2 py-1 rounded">⭐ {movie.vote_average?.toFixed(1)}</span>
            <span>{movie.release_date?.split('-')[0] || movie.first_air_date?.split('-')[0]}</span>
            <span>{movie.runtime} min</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={toggleSpoilerFree} className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all ${spoilerFree ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}><EyeOff className="w-4 h-4"/> Spoiler Free</button>
          <button onClick={() => setShowNico(!showNico)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${showNico ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'}`}>NicoNico</button>
        </div>
      </div>
      
      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <AmbientPlayer src={streamUrl} />
            <NicoNicoComments active={showNico} />
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 bg-white/5 p-2 rounded-xl backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-2 px-3 text-xs font-bold text-gray-400 border-r border-white/10"><Server className="w-4 h-4"/> Select Source:</div>
            {SERVERS.map((s, i) => (
              <button key={s.id} onClick={() => setServerIdx(i)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${serverIdx === i ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}>
                {s.badge} {s.name}
              </button>
            ))}
          </div>

          <VideoFilters />
          
          <div className={`mt-8 transition-all duration-500 ${spoilerFree ? 'blur-md hover:blur-none cursor-pointer' : ''}`}>
             <h3 className="font-bold mb-2 text-2xl">Overview</h3>
             <p className="text-gray-400 leading-relaxed max-w-4xl text-lg">{movie.overview}</p>
          </div>
        </div>

        <div className="w-full xl:w-[400px] flex-shrink-0 space-y-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
            <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
              <span className="font-bold text-sm text-gray-300">Server Health</span>
              <span className="text-xs font-mono text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded border border-green-500/20"><Activity className="w-3 h-3"/> Ping: {ping}ms</span>
            </div>
            
            {room ? (
              <div className="space-y-4">
                <div className="bg-indigo-500/20 text-indigo-300 p-4 rounded-xl text-center font-mono border border-indigo-500/30 text-sm font-bold shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                  ROOM CODE: {room}
                </div>
                <WebRTCVoice roomCode={room} />
              </div>
            ) : (
              <button onClick={() => router.push(`?type=${type}&room=${Math.random().toString(36).substr(2,6).toUpperCase()}`)} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all active:scale-95 text-white">
                <Users className="w-5 h-5"/> Start WebRTC Party
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
