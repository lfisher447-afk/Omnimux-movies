'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, UserPlus, Volume2, Settings, Copy } from 'lucide-react';
import Peer from 'peerjs';

// Define a robust participant type
interface Participant {
  id: string;
  name: string;
  avatar: string;
  isSpeaking: boolean;
  isMuted: boolean;
}

// More realistic mock data
const mockParticipants: Participant[] = [
  { id: '1', name: 'Admin', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Admin`, isSpeaking: false, isMuted: true },
  { id: '2', name: 'MovieFan_99', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=MovieFan`, isSpeaking: false, isMuted: false },
  { id: '3', name: 'CinephileX', avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=Cinephile`, isSpeaking: false, isMuted: false },
];

export function WebRTCVoice({ roomCode }: { roomCode: string }) {
  const [muted, setMuted] = useState(true);
  const [connected, setConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);
  const peerRef = useRef<any>(null);

  // Connection and Speaking Simulation logic
  useEffect(() => {
    // Real PeerJS connection logic
    const peer = new Peer();
    peer.on('open', id => {
      console.log('My peer ID is: ' + id);
      setConnected(true);
      // In a real app, you would join a "room" here to get other participants
    });
    peerRef.current = peer;

    // Speaking simulation interval
    const speakingInterval = setInterval(() => {
      setParticipants(prev => prev.map(p => ({
        ...p,
        isSpeaking: !p.isMuted && Math.random() > 0.7
      })));
    }, 500);

    return () => {
      peerRef.current?.destroy();
      clearInterval(speakingInterval);
    };
  }, [roomCode]);
  
  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    // In a real app, use a toast system
    alert('Invite link copied!');
  };

  return (
    <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-5 rounded-3xl backdrop-blur-md shadow-2xl space-y-4">
      <div className="flex justify-between items-center">
        <div>
            <h4 className="font-bold flex items-center gap-2">Live Voice Chat {connected && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>}</h4>
            <p className="text-xs text-gray-500">Room: {roomCode}</p>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-white/10 rounded-full"><Settings className="w-5 h-5"/></button>
      </div>

      <AnimatePresence>
        {showSettings && (
            <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="overflow-hidden">
                <div className="p-4 bg-black/30 rounded-xl space-y-3">
                    <label className="text-xs font-bold text-gray-400">INPUT DEVICE</label>
                    <select className="w-full bg-white/5 p-2 rounded-lg text-sm border border-white/10">
                        <option>Default - MacBook Pro Microphone</option>
                        <option>Yeti Stereo Microphone</option>
                    </select>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-4">
        {participants.map(p => (
          <div key={p.id} className="flex flex-col items-center gap-2">
            <div className={`relative w-20 h-20 rounded-full transition-all duration-300 ${p.isSpeaking ? 'ring-4 ring-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]' : 'ring-2 ring-white/20'}`}>
              <img src={p.avatar} className="w-full h-full object-cover rounded-full" />
              {p.isMuted && <div className="absolute bottom-0 right-0 p-1 bg-red-600 rounded-full border-2 border-transparent"><MicOff className="w-3 h-3 text-white"/></div>}
              {p.isSpeaking && <AudioVisualizer />}
            </div>
            <p className="text-xs font-bold text-white truncate">{p.name}</p>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-white/10 flex justify-center gap-3">
        <button onClick={() => setMuted(!muted)} className={`p-4 rounded-full transition-colors ${muted ? 'bg-red-500' : 'bg-gray-600'}`}>
          {muted ? <MicOff className="w-6 h-6"/> : <Mic className="w-6 h-6"/>}
        </button>
        <button onClick={copyInvite} className="p-4 rounded-full bg-blue-500"><UserPlus className="w-6 h-6"/></button>
        <button onClick={() => { /* In a real app, this would disconnect */ alert("Leaving call..."); }} className="p-4 rounded-full bg-gray-800"><PhoneOff className="w-6 h-6"/></button>
      </div>
    </div>
  );
}

// A sub-component for a simulated audio visualizer
const AudioVisualizer = () => (
    <div className="absolute inset-0 flex justify-center items-center gap-1">
        {[...Array(5)].map((_, i) => (
            <motion.div
                key={i}
                initial={{ height: '10%' }}
                animate={{ height: `${Math.random() * 60 + 10}%` }}
                transition={{ duration: 0.2, repeat: Infinity, repeatType: 'mirror' }}
                className="w-1 bg-green-400 rounded-full"
            />
        ))}
    </div>
);
