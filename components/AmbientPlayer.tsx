'use client';
import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function AmbientPlayer({ src }: { src: string }) {
  const { videoFilters } = useStore();
  const filterString = `brightness(${videoFilters.brightness}%) contrast(${videoFilters.contrast}%) saturate(${videoFilters.saturation}%) sepia(${videoFilters.sepia}%)`;
  
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => { try { if ('wakeLock' in navigator) wakeLock = await (navigator as any).wakeLock.request('screen'); } catch (err) {} };
    requestWakeLock();
    return () => { if (wakeLock) wakeLock.release(); };
  },[]);

  return (
    <div className="relative w-full aspect-video rounded-[32px] overflow-hidden bg-black shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/10 group">
      {/* 
        The sandbox attribute is omitted entirely to allow third party streams to function normally. 
        Omnimux OmegaShield intercepts popups.
      */}
      <iframe src={src} className="absolute inset-0 w-full h-full scale-[1.1] blur-[80px] opacity-40 group-hover:opacity-70 transition-opacity duration-1000 z-0 pointer-events-none mix-blend-screen" style={{ filter: filterString, transform: 'translateZ(0)' }} />
      <iframe src={src} className="absolute inset-0 w-full h-full z-10 border-none rounded-[30px] bg-black shadow-inner" allowFullScreen allow="autoplay; picture-in-picture; encrypted-media; fullscreen; clipboard-write; display-capture" style={{ filter: filterString }} />
    </div>
  );
}
