'use client';
import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { Mic, MicOff, Settings, UserPlus, PhoneOff, Headphones, Volume2, Ear, X, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import * as Slider from '@radix-ui/react-slider';
import * as Select from '@radix-ui/react-select';
import * as Switch from '@radix-ui/react-switch';

// -- VOICE SETTINGS CONTEXT --
const VoiceSettingsContext = createContext<any>(null);

const defaultVoiceSettings = {
  inputDeviceId: 'default',
  outputDeviceId: 'default',
  inputVolume: 1.0,
  outputVolume: 1.0,
  pushToTalk: false,
  noiseSuppression: true,
  echoCancellation: true,
};

// -- MAIN VOICE COMPONENT --
export function WebRTCVoice({ roomCode }: { roomCode: string }) {
  const { activeProfile } = useStore();
  const [connected, setConnected] = useState(true);
  const [muted, setMuted] = useState(true);
  const [deafened, setDeafened] = useState(false);
  const[isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState(defaultVoiceSettings);
  
  // Dummy Peers to demonstrate the UI until Peer.js is linked to Firebase signaling
  const peers =[
    { id: '2', name: 'Cipher', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cipher', isSpeaking: false },
    { id: '3', name: 'Neo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neo', isSpeaking: true }
  ];

  const allParticipants =[
    { id: activeProfile?.id, name: activeProfile?.name || 'You', avatar: activeProfile?.avatar, isSpeaking: !muted },
    ...peers 
  ];

  if (!connected) {
    return (
      <div className="w-full flex items-center justify-between bg-white/5 border border-white/10 p-4 rounded-3xl">
         <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center"><PhoneOff className="text-gray-400"/></div>
             <div>
                <h3 className="font-bold text-white">Voice Disconnected</h3>
                <p className="text-xs text-gray-500">Join room to sync audio</p>
             </div>
         </div>
         <button onClick={() => setConnected(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
             Connect Link
         </button>
      </div>
    );
  }

  return (
    <VoiceSettingsContext.Provider value={{ voiceSettings, setVoiceSettings }}>
      <div className="w-full rounded-3xl overflow-hidden shadow-2xl bg-[#111214] border border-white/10 relative group">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
           <div className="flex items-center gap-3">
               <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
               <span className="font-black text-white tracking-widest uppercase text-sm">RTC://{roomCode}</span>
           </div>
           <button className="text-gray-400 hover:text-white transition-colors"><UserPlus className="w-5 h-5"/></button>
        </div>

        {/* Grid Participants */}
        <div className="p-6 grid grid-cols-2 gap-4 pb-24">
            {allParticipants.map((p, i) => (
               <div key={p.id || i} className={`relative aspect-square rounded-2xl bg-[#1e1f22] flex items-center justify-center border-2 transition-all duration-300 overflow-hidden ${p.isSpeaking ? 'border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.3)]' : 'border-transparent'}`}>
                  <img src={p.avatar} className="w-20 h-20 rounded-full bg-black/50" />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white">
                      {p.name}
                  </div>
                  {p.isSpeaking && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-[#111]"><Mic className="w-3 h-3 text-white"/></div>
                  )}
               </div>
            ))}
        </div>

        {/* CONTROLS BAR */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#1E1F22]/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
            <ControlButton 
               icon={muted ? <MicOff className="w-5 h-5 text-red-400" /> : <Mic className="w-5 h-5" />} 
               active={!muted} 
               onClick={() => setMuted(!muted)} 
               tooltip={muted ? 'Unmute' : 'Mute'} 
            />
            <ControlButton 
               icon={deafened ? <Headphones className="w-5 h-5 text-red-400" /> : <Headphones className="w-5 h-5" />} 
               active={!deafened} 
               onClick={() => { setDeafened(!deafened); if(!deafened) setMuted(true); }} 
               tooltip={deafened ? 'Undeafen' : 'Deafen'} 
            />
            <div className="w-[1px] h-8 bg-zinc-700 mx-1" />
            <ControlButton icon={<Video className="w-5 h-5"/>} onClick={() => {}} colorType="neutral" tooltip="Share Screen" />
            <ControlButton icon={<Settings className="w-5 h-5"/>} onClick={() => setIsSettingsOpen(true)} colorType="neutral" tooltip="Settings" />
            <ControlButton icon={<PhoneOff className="w-5 h-5"/>} onClick={() => setConnected(false)} colorType="danger" className="w-16" title="Disconnect" />
        </div>

        {/* VOICE SETTINGS OVERLAY */}
        <AnimatePresence>
            {isSettingsOpen && <VoiceSettingsOverlay onClose={() => setIsSettingsOpen(false)} />}
        </AnimatePresence>
      </div>
    </VoiceSettingsContext.Provider>
  );
}

// -- HELPER: CONTROL BUTTON --
function ControlButton({ icon, onClick, active, colorType = 'default', tooltip, className = '' }: any) {
    const colors = {
      default: active ? 'bg-[#313338] text-white hover:bg-[#3b3d44]' : 'bg-[#2B2D31] text-zinc-400 hover:text-zinc-200 hover:bg-[#383A40]',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md',
      neutral: 'bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
    };
    return (
      <button onClick={onClick} className={`p-3 rounded-xl flex items-center justify-center transition-all ${colors[colorType as keyof typeof colors]} ${className}`} title={tooltip}>
        {icon}
      </button>
    );
}

// -- SETTINGS OVERLAY --
function VoiceSettingsOverlay({ onClose }: { onClose: () => void }) {
  const { voiceSettings, setVoiceSettings } = useContext(VoiceSettingsContext);
  const[audioDevices, setAudioDevices] = useState({ inputs: [], outputs:[] });
  const updateSetting = (key: string, value: any) => setVoiceSettings((prev: any) => ({ ...prev, [key]: value }));

  useEffect(() => {
    async function getDevices() {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioDevices({
            inputs: devices.filter(d => d.kind === 'audioinput') as any,
            outputs: devices.filter(d => d.kind === 'audiooutput') as any,
        });
    }
    getDevices();
  },[]);

  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
       className="absolute inset-0 bg-[#2b2d31] z-50 flex flex-col">
       <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-black/20">
           <h3 className="text-lg font-bold text-white">Audio Subsystem</h3>
           <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10"><X className="w-5 h-5"/></button>
       </div>
       <div className="flex-1 p-6 overflow-y-auto space-y-6">
           <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-2"><Mic className="w-4 h-4"/> Input Setting</h4>
              <DeviceSelector devices={audioDevices.inputs} selected={voiceSettings.inputDeviceId} onSelect={(id: any) => updateSetting('inputDeviceId', id)} type="Microphone"/>
           </div>

           <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-2"><Volume2 className="w-4 h-4"/> Output Setting</h4>
              <DeviceSelector devices={audioDevices.outputs} selected={voiceSettings.outputDeviceId} onSelect={(id: any) => updateSetting('outputDeviceId', id)} type="Speaker"/>
           </div>

           <div className="space-y-4 bg-black/20 p-5 rounded-2xl border border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-2"><Ear className="w-4 h-4"/> Processing</h4>
              <div className="flex justify-between items-center text-sm font-medium text-gray-300">
                  Noise Suppression
                  <Switch.Root checked={voiceSettings.noiseSuppression} onCheckedChange={val => updateSetting('noiseSuppression', val)} className="w-10 h-6 bg-black rounded-full relative"><Switch.Thumb className="w-4 h-4 bg-white rounded-full absolute top-1 transition-all data-[state=checked]:translate-x-4"/></Switch.Root>
              </div>
           </div>
       </div>
    </motion.div>
  );
}

// -- HELPER: DEVICE SELECTOR (Radix UI) --
function DeviceSelector({ devices, selected, onSelect, type }: any) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-gray-400 uppercase">{type} Device</label>
      <Select.Root value={selected} onValueChange={onSelect}>
          <Select.Trigger className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium bg-[#1e1f22] text-zinc-200 border border-transparent focus:border-indigo-500 focus:outline-none">
              <Select.Value placeholder={`Select ${type}...`} />
              <Select.Icon />
          </Select.Trigger>
          <Select.Portal>
              <Select.Content className="overflow-hidden bg-[#2B2D31] rounded-md shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/5 z-[60]">
                  <Select.Viewport className="p-2">
                      {devices.length === 0 && <span className="text-sm text-gray-500 p-2">No hardware detected</span>}
                      {devices.map((device: any) => (
                        <Select.Item key={device.deviceId} value={device.deviceId} className="text-sm leading-none text-zinc-300 rounded p-2 cursor-pointer outline-none hover:bg-indigo-500 hover:text-white">
                          <Select.ItemText>{device.label || `Default ${type}`}</Select.ItemText>
                        </Select.Item>
                      ))}
                  </Select.Viewport>
              </Select.Content>
          </Select.Portal>
      </Select.Root>
    </div>
  );
}
