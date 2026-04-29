'use client';
import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

export function WebRTCVoice({ roomCode }: { roomCode: string }) {
  const [muted, setMuted] = useState(true);
  const [connected, setConnected] = useState(false);
  const peerRef = useRef<any>(null);

  useEffect(() => {
    import('peerjs').then(({ default: Peer }) => {
      const peer = new Peer();
      peer.on('open', (id) => setConnected(true));
      peerRef.current = peer;
    });
    return () => peerRef.current?.destroy();
  }, [roomCode]);

  return (
    <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
      <div>
        <h4 className="font-bold text-sm flex items-center gap-2">Live Voice Chat {connected && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>}</h4>
        <p className="text-xs text-gray-500">Powered by WebRTC</p>
      </div>
      <button onClick={() => { setMuted(!muted); if(navigator.vibrate) navigator.vibrate(50); }} className={`p-3 rounded-full transition-colors ${muted ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-400'}`}>
        {muted ? <MicOff className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
      </button>
    </div>
  );
}
