'use client';
import React, { useEffect, useState, useRef, createContext, useContext } from 'react';
import { Mic, MicOff, Video, VideoOff, Settings, UserPlus, PhoneOff, Headphones, MonitorUp, Volume2, Ear } from 'lucide-react';
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
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(true);
  const [deafened, setDeafened] = useState(false);
  const [peers, setPeers] = useState<any[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState(defaultVoiceSettings);
  
  // Ref hooks from previous version
  const peerInstance = useRef<any>(null);
  const localStream = useRef<MediaStream | null>(null);

  // Connection and mic logic
  useEffect(() => { /* PeerJS logic from before */ }, []);
  const toggleMic = async () => { /* Mic logic from before */ };
  
  const allParticipants = [ { id: activeProfile?.id, name: 'You', /* ... */ }, ...peers ];

  return (
    <VoiceSettingsContext.Provider value={{ voiceSettings, setVoiceSettings }}>
      <div className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-[#111214] border border-[#1E1F22] relative group">
        {/* Header and Grid Participants from previous version */}

        {/* CONTROLS BAR */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-[#1E1F22]/90 backdrop-blur-xl border border-white/5 p-2 rounded-2xl shadow-xl">
            {/* Mic, Deafen, etc buttons from before */}
            <div className="w-[1px] h-8 bg-zinc-700 mx-1" />
            <ControlButton icon={<Settings className="w-5 h-5"/>} onClick={() => setIsSettingsOpen(true)} colorType="neutral" tooltip="Open Settings"/>
            <ControlButton icon={<PhoneOff className="w-5 h-5"/>} colorType="danger" tooltip="Disconnect" className="w-16"/>
        </div>

        {/* VOICE SETTINGS OVERLAY */}
        <AnimatePresence>
            {isSettingsOpen && <VoiceSettingsOverlay onClose={() => setIsSettingsOpen(false)} />}
        </AnimatePresence>
      </div>
    </VoiceSettingsContext.Provider>
  );
}

// -- VOICE SETTINGS OVERLAY --
function VoiceSettingsOverlay({ onClose }: { onClose: () => void }) {
  const { voiceSettings, setVoiceSettings } = useContext(VoiceSettingsContext);
  const [audioDevices, setAudioDevices] = useState({ inputs: [], outputs: [] });
  const updateSetting = (key: string, value: any) => setVoiceSettings((prev: any) => ({ ...prev, [key]: value }));

  useEffect(() => {
    // Fetch available audio devices
    async function getDevices() {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioDevices({
            inputs: devices.filter(d => d.kind === 'audioinput') as any,
            outputs: devices.filter(d => d.kind === 'audiooutput') as any,
        });
    }
    getDevices();
  }, []);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
       className="absolute inset-0 bg-black/50 backdrop-blur-lg z-40 flex items-center justify-center p-4">
       <div className="w-full max-w-lg bg-[#202225] rounded-xl shadow-2xl border border-black/20 flex flex-col">
          <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-black/20">
              <h3 className="text-lg font-bold text-white">Voice & Audio Settings</h3>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10"><X className="w-5 h-5"/></button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <SettingsSection icon={<Mic/>} title="Input Settings">
                  <DeviceSelector devices={audioDevices.inputs} selected={voiceSettings.inputDeviceId} onSelect={id => updateSetting('inputDeviceId', id)} type="Input"/>
                  <SettingsRow label="Input Volume"><Slider.Root defaultValue={[1]} max={1} step={0.01} className="... Radix Slider ..."/></SettingsRow>
                  <SettingsRow label="Push to Talk"><Switch.Root className="... Radix Switch ..."/></SettingsRow>
              </SettingsSection>
              <SettingsSection icon={<Volume2/>} title="Output Settings">
                   <DeviceSelector devices={audioDevices.outputs} selected={voiceSettings.outputDeviceId} onSelect={id => updateSetting('outputDeviceId', id)} type="Output"/>
                   <SettingsRow label="Output Volume"><Slider.Root defaultValue={[1]} max={1} step={0.01} className="... Radix Slider ..."/></SettingsRow>
              </SettingsSection>
               <SettingsSection icon={<Ear/>} title="Audio Processing">
                   <SettingsRow label="Noise Suppression"><Switch.Root checked={voiceSettings.noiseSuppression} onCheckedChange={val => updateSetting('noiseSuppression', val)} className="... Radix Switch ..."/></SettingsRow>
                   <SettingsRow label="Echo Cancellation"><Switch.Root checked={voiceSettings.echoCancellation} onCheckedChange={val => updateSetting('echoCancellation', val)} className="... Radix Switch ..."/></SettingsRow>
              </SettingsSection>
          </div>
       </div>
    </motion.div>
  );
}

// -- HELPER for device dropdown --
function DeviceSelector({ devices, selected, onSelect, type }: any) {
  // This uses Radix UI Select for a rich, accessible dropdown
  return (
    <SettingsRow label={`${type} Device`}>
        <Select.Root value={selected} onValueChange={onSelect}>
            <Select.Trigger className="w-full inline-flex items-center justify-between rounded px-3 py-1.5 text-sm font-medium bg-[#1E1F22] text-zinc-200 border border-transparent focus:border-indigo-500 focus:outline-none">
                <Select.Value placeholder={`Select ${type} Device...`} />
                <Select.Icon />
            </Select.Trigger>
            <Select.Portal>
                <Select.Content className="overflow-hidden bg-[#2B2D31] rounded-md shadow-lg border border-black/20 z-50">
                    <Select.Viewport className="p-1">
                        {devices.map((device: any) => (
                          <Select.Item key={device.deviceId} value={device.deviceId} className="text-sm leading-none text-zinc-300 rounded-[3px] flex items-center h-8 pr-9 pl-6 relative select-none data-[highlighted]:outline-none data-[highlighted]:bg-indigo-500 data-[highlighted]:text-white">
                            <Select.ItemText>{device.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    </SettingsRow>
  );
}

// Other helper components (ParticipantNode, ControlButton, etc.) remain as they were in the previous version
