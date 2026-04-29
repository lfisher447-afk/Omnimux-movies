'use client';
import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function AmbientPlayer({ src }: { src: string }) {
  const { videoFilters } = useStore();
  const filterString = `brightness(${videoFilters.brightness}%) contrast(${videoFilters.contrast}%) saturate(${videoFilters.saturation}%)`;

  useEffect(() => {
    // 11. Wake Lock API (Vercel Client-Side Support)
    let wakeLock: any = null;
    const requestWakeLock = async () => { try { wakeLock = await (navigator as any).wakeLock.request('screen'); } catch (err) {} };
    requestWakeLock();
    return () => { if (wakeLock) wakeLock.release(); };
  },[]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
      {/* Ambient Glow layer */}
      <iframe src={src} className="absolute inset-0 w-full h-full scale-110 blur-[80px] opacity-60 z-0 pointer-events-none" style={{ filter: filterString }} />
      {/* Real Player */}
      <iframe src={src} className="absolute inset-0 w-full h-full z-10 border-none rounded-2xl" allowFullScreen allow="autoplay; picture-in-picture" style={{ filter: filterString }} />
    </div>
  );
}
