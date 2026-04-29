'use client';

import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, UserPlus, Settings, Activity } from 'lucide-react';
import { useStore } from '@/store/useStore';

// THE FIX: Extracted to an interface so the SWC parser doesn't crash on inline JSX generics
interface PeerData {
  id: string;
  name: string;
  stream?: MediaStream;
}

export function WebRTCVoice({ roomCode }: { roomCode: string }) {
  const { activeProfile } = useStore();
  const [muted, setMuted] = useState(true);
  const[connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<PeerData[]>([]);
  
  const peerInstance = useRef<any>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Dynamic import to prevent SSR crashes with WebRTC
    import('peerjs').then(({ default: Peer }) => {
      if (!isMounted) return;
      
      const peer = new Peer(`${roomCode}-${activeProfile?.id || Math.random().toString(36).substring(7)}`);
      peerInstance.current = peer;

      peer.on('open', (id) => {
        setConnected(true);
        console.log("📡 WebRTC Uplink Established:", id);
      });

      // Answer incoming calls
      peer.on('call', (call) => {
        if (localStream.current) {
          call.answer(localStream.current);
          call.on('stream', (remoteStream) => {
            setPeers((prevPeers) => {
              const filtered = prevPeers.filter((x) => x.id !== call.peer);
              return[...filtered, { id: call.peer, name: `Peer ${call.peer.slice(-4)}`, stream: remoteStream }];
            });
          });
        }
      });
    });

    return () => {
      isMounted = false;
      if (localStream.current) {
         localStream.current.getTracks().forEach((track) => track.stop());
      }
      if (peerInstance.current) {
         peerInstance.current.destroy();
      }
    };
  }, [roomCode, activeProfile]);

  const toggleMic = async () => {
    if (muted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStream.current = stream;
        setMuted(false);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
           navigator.vibrate(50);
        }
      } catch (err) {
        alert("Microphone access denied by Neural Protocol.");
      }
    } else {
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }
      setMuted(true);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-[32px] shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] pointer-events-none transition-opacity duration-1000" />
      
      <div className="flex justify-between items-center mb-6">
        <div>
            <h4 className="font-black text-lg flex items-center gap-2">P2P Comms Link {connected && <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_#22c55e]" />}</h4>
            <p className="text-xs text-gray-400 font-mono tracking-widest">{roomCode}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 relative z-10">
        <div className="flex flex-col items-center gap-2">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center relative transition-all duration-300 ${!muted ? 'ring-2 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'ring-1 ring-white/20'}`}>
            <img src={activeProfile?.avatar} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
            <div className="absolute -bottom-2 -right-2 bg-[#111] p-1.5 rounded-full border border-white/10">
              {muted ? <MicOff className="w-3 h-3 text-red-500" /> : <Mic className="w-3 h-3 text-green-500" />}
            </div>
          </div>
          <span className="text-[10px] font-black uppercase text-gray-300">{activeProfile?.name}</span>
        </div>

        {peers.map((peer) => (
          <div key={peer.id} className="flex flex-col items-center gap-2">
            {peer.stream && (
               <audio autoPlay ref={(el) => { if (el) el.srcObject = peer.stream!; }} className="hidden" />
            )}
            <div className="w-16 h-16 rounded-2xl ring-1 ring-indigo-500/50 flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-indigo-500/20 animate-pulse" />
              <Activity className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-[10px] font-black uppercase text-indigo-300">{peer.name}</span>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-white/10 flex justify-center gap-4 relative z-10">
        <button onClick={toggleMic} className={`p-5 rounded-2xl transition-all shadow-xl active:scale-95 ${muted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-green-500 text-black border border-transparent'}`}>
          {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <button className="p-5 rounded-2xl bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:bg-indigo-500 active:scale-95 transition-all">
          <UserPlus className="w-6 h-6" />
        </button>
        <button className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white active:scale-95 transition-all">
          <Settings className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
