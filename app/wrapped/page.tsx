'use client';
import { useStore } from '@/store/useStore';
import { useState, useEffect } from 'react';

export default function Wrapped() {
  const { stats, activeProfile } = useStore();
  const[slide, setSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSlide(s => (s + 1) % 4), 5000);
    return () => clearInterval(timer);
  }, []);

  const slides =[
    <div className="text-center w-full" key="1">
      <h1 className="text-6xl md:text-8xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 tracking-tighter">Ready for your Review?</h1>
      <p className="text-2xl text-gray-400 font-medium">Let's look back at your cinematic journey.</p>
    </div>,
    <div className="text-center w-full" key="2">
      <p className="text-3xl text-gray-400 mb-6 font-medium">You spent</p>
      <h1 className="text-8xl md:text-[150px] font-black mb-6 text-yellow-400 drop-shadow-[0_0_50px_rgba(250,204,21,0.4)]">{stats.hoursWatched.toFixed(0)}</h1>
      <p className="text-4xl font-bold">Hours watching.</p>
    </div>,
    <div className="text-center w-full" key="3">
      <p className="text-3xl text-gray-400 mb-6 font-medium">You explored</p>
      <h1 className="text-8xl md:text-[150px] font-black mb-6 text-emerald-400 drop-shadow-[0_0_50px_rgba(52,211,153,0.4)]">{stats.movies}</h1>
      <p className="text-4xl font-bold">Movies.</p>
    </div>,
    <div className="text-center w-full" key="4">
      <h1 className="text-6xl md:text-9xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-tighter">Top 1% Cinephile</h1>
      <p className="text-2xl text-gray-400">Keep it up, <b className="text-white">{activeProfile?.name || 'Explorer'}</b>!</p>
    </div>
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-[#030508] flex items-center justify-center transition-colors duration-1000 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 blur-[150px] rounded-full mix-blend-screen animate-pulse-glow"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 blur-[150px] rounded-full mix-blend-screen animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Progress Bars */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-3xl flex gap-3 px-6 z-20">
        {[0,1,2,3].map(i => (
          <div key={i} className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className={`h-full bg-white transition-all duration-[5000ms] ease-linear ${i === slide ? 'w-full' : i < slide ? 'w-full' : 'w-0'}`} />
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center justify-center">
        {slides[slide]}
      </div>
    </div>
  );
}
