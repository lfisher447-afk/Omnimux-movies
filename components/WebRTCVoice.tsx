'use client';
import { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, UserPlus, PhoneOff, Headphones, MonitorUp } from 'lucide-react';
import { useStore } from '@/store/useStore'; // Linked back to your store

interface PeerData {
  id: string;
  name: string;
  avatar: string;
  stream?: MediaStream;
}

// Custom hook to detect if a specific MediaStream is actively producing sound (Speaking Indicator)
function useActiveSpeaker(stream?: MediaStream) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!stream || !stream.getAudioTracks().length) return;
    
    let audioCtx: AudioContext;
    let requestFrame: number;

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyzer = audioCtx.createAnalyser();
      analyzer.fftSize = 512;
      analyzer.minDecibels = -70; // Sensitivity Threshold
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyzer);
      
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      
      const detectVolume = () => {
        analyzer.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) { sum += dataArray[i]; }
        const avg = sum / dataArray.length;
        
        // If sound magnitude surpasses minimum, we flag exactly as Discord does
        setIsSpeaking(avg > 15); 
        requestFrame = requestAnimationFrame(detectVolume);
      };
      
      detectVolume();
    } catch (e) {
      console.warn('AudioContext initialization failed', e);
    }

    return () => {
      if (requestFrame) cancelAnimationFrame(requestFrame);
      if (audioCtx) audioCtx.close();
    };
  }, [stream]);

  return isSpeaking;
}

export function WebRTCVoice({ roomCode }: { roomCode: string }) {
  const { activeProfile } = useStore();
  
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(true);
  const [deafened, setDeafened] = useState(false);
  const [peers, setPeers] = useState<PeerData[]>([]);
  
  const peerInstance = useRef<any>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fallbackId = Math.random().toString(36).substring(7);
    const userId = activeProfile?.id || fallbackId;
    
    import('peerjs').then(({ default: Peer }) => {
      if (!isMounted) return;
      
      // Connect to the Peer Server channel
      const peer = new Peer(`${roomCode}-${userId}`);
      peerInstance.current = peer;

      peer.on('open', (id) => setConnected(true));

      // Handling incoming party members
      peer.on('call', (call) => {
        if (localStream.current) {
           call.answer(localStream.current);
        } else {
           // Answer silently to accept their voice feed even if we are muted
           const dummyStream = new MediaStream();
           call.answer(dummyStream);
        }
        
        call.on('stream', (remoteStream) => {
          setPeers((prev) => {
            const exists = prev.find(p => p.id === call.peer);
            if (exists) return prev;
            return[...prev, { 
                id: call.peer, 
                name: `Peer-${call.peer.slice(-4)}`, 
                avatar: `https://i.pravatar.cc/150?u=${call.peer}`, 
                stream: remoteStream 
            }];
          });
        });
      });
    });

    return () => {
      isMounted = false;
      if (localStream.current) localStream.current.getTracks().forEach((track) => track.stop());
      if (peerInstance.current) peerInstance.current.destroy();
    };
  }, [roomCode, activeProfile]);

  const toggleMic = async () => {
    if (muted) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStream.current = stream;
        setMuted(false);
        setDeafened(false); // Discord un-deafens you automatically when you unmute
      } catch (err) {
        console.error("Microphone access blocked.", err);
      }
    } else {
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }
      setMuted(true);
    }
  };

  const copyInvite = () => navigator.clipboard.writeText(`https://yourapp.com/join/${roomCode}`);

  // Create unified grid layout mapped to UI (Local User + Remote Peers)
  const allParticipants =[
      { 
        id: activeProfile?.id || 'sys_local', 
        name: activeProfile?.name || 'You', 
        avatar: activeProfile?.avatar || 'https://i.pravatar.cc/150?u=You', 
        isLocal: true, 
        stream: localStream.current 
      },
      ...peers
  ];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-[#111214] border border-[#1E1F22] relative group">
       {/* Ambient Overlay Layer */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />

      {/* Header Info */}
      <div className="absolute top-4 left-6 right-6 z-20 flex justify-between items-center pointer-events-auto">
        <div className="flex gap-3 items-center bg-black/40 backdrop-blur-md border border-white/5 py-2 px-4 rounded-full">
            <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]' : 'bg-yellow-500'}`} />
            <h4 className="font-bold text-white text-sm tracking-wide bg-clip-text">P2P Voice Network</h4>
        </div>
        <button onClick={copyInvite} className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold flex items-center gap-2 border border-white/5 transition-all">
          <UserPlus className="w-4 h-4" /> Add Friends
        </button>
      </div>

      {/* Masonry/Grid Canvas for Callers */}
      <div className="p-4 pt-20 pb-28 min-h-[400px] flex items-center justify-center">
        <div className={`w-full max-w-4xl grid gap-4 transition-all duration-500 will-change-transform
           ${allParticipants.length === 1 ? 'grid-cols-1' : allParticipants.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}
        `}>
          {allParticipants.map(participant => (
             <ParticipantNode 
               key={participant.id} 
               participant={participant as PeerData & { isLocal?: boolean }} 
               mutedState={participant.isLocal ? muted : deafened} 
             />
          ))}
        </div>
      </div>

      {/* Internal Control Action Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[#1E1F22]/90 backdrop-blur-xl border border-white/5 p-2 rounded-2xl shadow-2xl">
        <ControlButton 
            onClick={toggleMic} 
            icon={muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />} 
            isActive={!muted} 
            colorType={muted ? 'danger' : 'safe'} 
            tooltip={muted ? "Unmute" : "Mute"}
        />
        <ControlButton 
            onClick={() => setDeafened(!deafened)} 
            icon={<Headphones className="w-5 h-5" />} 
            isActive={!deafened} 
            colorType={deafened ? 'danger' : 'neutral'} 
            tooltip={deafened ? "Undeafen" : "Deafen"}
        />
        <div className="w-[1px] h-8 bg-zinc-700 mx-1" />
        <ControlButton icon={<Video className="w-5 h-5" />} isActive={false} colorType="neutral" disabled tooltip="Turn on Camera (WIP)" />
        <ControlButton icon={<MonitorUp className="w-5 h-5" />} isActive={false} colorType="neutral" disabled tooltip="Share Screen (WIP)" />
        <div className="w-[1px] h-8 bg-zinc-700 mx-1" />
        <ControlButton icon={<PhoneOff className="w-5 h-5" />} isActive={true} colorType="danger" className="w-16 rounded-xl hover:bg-red-600" tooltip="Disconnect" />
      </div>
    </div>
  );
}

// Visual layout for individual Callers mapped specifically to the grid array
function ParticipantNode({ participant, mutedState }: { participant: PeerData & { isLocal?: boolean }, mutedState: boolean }) {
  const isSpeaking = useActiveSpeaker(participant.stream);

  return (
      <div className={`relative aspect-video rounded-2xl overflow-hidden bg-[#1E1F22] border-[3px] shadow-lg flex items-center justify-center group transition-all duration-300
         ${isSpeaking && !mutedState ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)] scale-[1.02]' : 'border-transparent'}
      `}>
         
         {/* Plays logic for foreign audio only if we are not deafened */}
         {!participant.isLocal && !mutedState && participant.stream && (
             <audio autoPlay ref={(el) => { if(el) el.srcObject = participant.stream! }} className="hidden" />
         )}
         
         {/* Avatar Layer */}
         <div className={`relative transition-transform duration-300 ${isSpeaking && !mutedState ? 'scale-110' : 'scale-100'}`}>
            <img src={participant.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-[#111214] shadow-2xl object-cover bg-zinc-800" />
            
            {/* Context Action Overlay Mini-Indicator */}
            {mutedState && (
               <div className="absolute -bottom-2 -right-2 bg-[#111214] p-1.5 rounded-full border border-[#1E1F22] shadow-sm">
                  <MicOff className="w-4 h-4 text-red-500" />
               </div>
            )}
         </div>

         {/* Identification Label */}
         <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
            <span className="text-white text-sm font-bold">{participant.name}</span>
            {participant.isLocal && <span className="bg-indigo-500/20 text-indigo-400 text-[10px] uppercase font-black px-1.5 py-0.5 rounded">You</span>}
         </div>
      </div>
  );
}

// Sub-component grouping configuration arrays of bottom navigation actions
function ControlButton({ icon, onClick, isActive, colorType, disabled, className = "", tooltip }: any) {
    const baseStyle = "p-3 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center relative group ";
    const styles = {
        safe: "bg-white text-zinc-900 hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        neutral: "bg-[#2B2D31] text-zinc-300 hover:bg-[#35373C] hover:text-white"
    };

    return (
        <button 
          onClick={onClick} 
          disabled={disabled} 
          title={tooltip} 
          className={`${baseStyle} ${styles[colorType as keyof typeof styles]} ${disabled ? 'opacity-50 cursor-not-allowed filter grayscale' : ''} ${className}`}
        >
            {icon}
        </button>
    );
}
