'use client';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Play, Pause, Volume2, VolumeX, Maximize, PictureInPicture, Download, Magnet } from 'lucide-react';
import Hls from 'hls.js';

export function AmbilightPlayer({ src, type }: { src: string, type: 'iframe' | 'direct' | 'torrent' }) {
  const { videoFilters } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const[isMuted, setIsMuted] = useState(false);
  const [magnetInput, setMagnetInput] = useState('');
  const [torrentStatus, setTorrentStatus] = useState('');

  const filterString = `brightness(${videoFilters.brightness}%) contrast(${videoFilters.contrast}%) saturate(${videoFilters.saturation}%) sepia(${videoFilters.sepia}%)`;

  // 1. True Canvas Ambilight Logic
  useEffect(() => {
    if (type === 'iframe') return;
    let animationFrameId: number;
    
    const drawAmbilight = () => {
      if (videoRef.current && canvasRef.current && !videoRef.current.paused && !videoRef.current.ended) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
      animationFrameId = requestAnimationFrame(drawAmbilight);
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('play', drawAmbilight);
      return () => {
        video.removeEventListener('play', drawAmbilight);
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [type]);

  // 2. HLS.js Direct Streaming Logic
  useEffect(() => {
    if (type === 'direct' && src) {
      const video = videoRef.current;
      if (video && Hls.isSupported()) {
        const hls = new Hls({ maxBufferLength: 60, maxMaxBufferLength: 600 });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(()=>console.log("Autoplay prevented")));
        return () => hls.destroy();
      } else if (video && video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      }
    }
  }, [src, type]);

  // 3. WebTorrent P2P Engine Logic
  const startTorrent = async (magnet: string) => {
    setTorrentStatus('Initializing P2P Swarm...');
    const WebTorrent = (await import('webtorrent')).default;
    const client = new WebTorrent();
    
    client.add(magnet, (torrent) => {
      setTorrentStatus(`Connected to ${torrent.numPeers} peers. Buffering...`);
      const file = torrent.files.find(f => f.name.endsWith('.mp4') || f.name.endsWith('.mkv') || f.name.endsWith('.webm'));
      
      if (file && videoRef.current) {
        file.renderTo(videoRef.current, { autoplay: true });
        setTorrentStatus(`Streaming: ${file.name}`);
      } else {
        setTorrentStatus('Error: No compatible video file found in torrent.');
      }
    });
  };

  // Custom Controls Logic
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
      setIsPlaying(!videoRef.current.paused);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) containerRef.current.requestFullscreen();
    else if (document.fullscreenElement) document.exitFullscreen();
  };

  return (
    <div ref={containerRef} className="relative w-full aspect-video rounded-[32px] overflow-hidden bg-black shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/10 group">
      
      {type === 'iframe' ? (
        <>
          <div className="absolute -inset-10 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-emerald-500/20 blur-[100px] opacity-50 group-hover:opacity-80 transition-opacity duration-1000 z-0 animate-pulse-glow mix-blend-screen pointer-events-none" />
          <iframe src={src} className="absolute inset-0 w-full h-full z-10 border-none rounded-[30px] bg-black shadow-inner" allowFullScreen allow="autoplay; picture-in-picture; encrypted-media; fullscreen" style={{ filter: filterString }} />
        </>
      ) : (
        <>
          {/* True Canvas Ambilight Layer */}
          <canvas ref={canvasRef} width="128" height="72" className="absolute inset-0 w-full h-full scale-[1.1] blur-[80px] opacity-70 z-0 pointer-events-none mix-blend-screen transform-gpu" />
          
          {/* Native HTML5 Video Element */}
          <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full z-10 rounded-[30px] bg-black object-contain"
            style={{ filter: filterString }}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            crossOrigin="anonymous"
          />

          {/* Torrent Prompt Overlay */}
          {type === 'torrent' && !torrentStatus && (
             <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8">
                <Magnet className="w-16 h-16 text-indigo-500 mb-6 animate-float" />
                <h2 className="text-3xl font-black mb-4">Initialize P2P Link</h2>
                <input value={magnetInput} onChange={e=>setMagnetInput(e.target.value)} placeholder="Paste Magnet URI here..." className="w-full max-w-xl bg-[#111] border border-white/20 rounded-xl p-4 text-white font-mono mb-4 outline-none focus:border-indigo-500" />
                <button onClick={() => startTorrent(magnetInput)} className="bg-indigo-600 px-8 py-4 rounded-xl font-bold text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:bg-indigo-500 transition-all">Engage Swarm</button>
             </div>
          )}
          
          {torrentStatus && <div className="absolute top-6 left-6 z-30 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-xs font-mono font-bold text-green-400">{torrentStatus}</div>}

          {/* Custom Cinematic Controls Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6">
            
            {/* Scrubber */}
            <div className="w-full h-2 bg-white/20 rounded-full mb-6 cursor-pointer relative overflow-hidden" onClick={(e) => {
                if(videoRef.current) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    videoRef.current.currentTime = pos * videoRef.current.duration;
                }
            }}>
                <div className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-100" style={{ width: `${progress}%` }} />
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between text-white">
               <div className="flex items-center gap-6">
                   <button onClick={togglePlay} className="hover:scale-110 transition-transform">
                       {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current" />}
                   </button>
                   <div className="flex items-center gap-2 group/vol">
                       <button onClick={() => { if(videoRef.current) { videoRef.current.muted = !isMuted; setIsMuted(!isMuted); } }}>
                           {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                       </button>
                       <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e)=>{
                           const v = parseFloat(e.target.value);
                           setVolume(v);
                           if(videoRef.current) videoRef.current.volume = v;
                       }} className="w-0 opacity-0 group-hover/vol:w-24 group-hover/vol:opacity-100 transition-all duration-300 accent-indigo-500" />
                   </div>
               </div>
               
               <div className="flex items-center gap-6">
                   <button onClick={() => { if(videoRef.current && document.pictureInPictureEnabled) videoRef.current.requestPictureInPicture() }} className="hover:text-indigo-400 transition-colors"><PictureInPicture className="w-5 h-5"/></button>
                   <button onClick={toggleFullscreen} className="hover:text-indigo-400 transition-colors"><Maximize className="w-5 h-5"/></button>
               </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
