'use client';
import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function AmbientPlayer({ src }: { src: string }) {
  const { videoFilters } = useStore();
  const filterString = `brightness(${videoFilters.brightness}%) contrast(${videoFilters.contrast}%) saturate(${videoFilters.saturation}%)`;
  
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => { 
      try { if ('wakeLock' in navigator) wakeLock = await (navigator as any).wakeLock.request('screen'); } catch (err) {} 
    };
    requestWakeLock();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') requestWakeLock(); });
    return () => { if (wakeLock) wakeLock.release(); };
  },[]);

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black/90 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 group">
      {/* Ambient Glow layer - Hardware accelerated */}
      <iframe src={src} className="absolute inset-0 w-full h-full scale-[1.05] blur-[60px] opacity-40 group-hover:opacity-70 transition-opacity duration-1000 z-0 pointer-events-none mix-blend-screen" style={{ filter: filterString, transform: 'translateZ(0)' }} />
      {/* Real Streaming Player Layer */}
      <iframe src={src} className="absolute inset-0 w-full h-full z-10 border-none rounded-2xl bg-black" allowFullScreen allow="autoplay; picture-in-picture; encrypted-media" style={{ filter: filterString }} sandbox="allow-same-origin allow-scripts allow-forms" />
    </div>
  );
}
