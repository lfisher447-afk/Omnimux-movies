'use client';
import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { 
  Send, MessageSquare, X, Users, Smile, Heart, Paperclip, Share2, Check, MoreHorizontal, Cog, Palette, Type, BellDot, ImageOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import * as Slider from '@radix-ui/react-slider';
import * as Switch from '@radix-ui/react-switch';

// -- SETTINGS CONTEXT --
const SettingsContext = createContext<any>(null);

const defaultChatSettings = {
  themeColor: '#6D28D9',
  mentionColor: '#FBBF24',
  linkColor: '#3B82F6',
  fontSize: 15,
  fontFamily: 'Inter, sans-serif',
  showTimestamps: true,
  enableMarkdown: true,
  autoEmbedMedia: true,
  notificationVolume: 0.5,
  muteMentions: false,
};

// -- MAIN CHAT COMPONENT --
export function GlobalChat({ roomCode = "PARTY-1337" }: { roomCode?: string }) {
  const { activeProfile } = useStore();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<any[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showUsers, setShowUsers] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatSettings, setChatSettings] = useState(defaultChatSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatLog]);

  const handleSendMessage = (e?: React.FormEvent) => { /* Logic from previous version */ };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { /* Logic from previous version */ };
  const copyInvite = () => { /* Logic from previous version */ };

  return (
    <SettingsContext.Provider value={{ chatSettings, setChatSettings }}>
      <AnimatePresence>
        {!open && (
           <motion.button  /* FAB Button Logic from previous version */ >
             <MessageSquare className="w-8 h-8" />
           </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div 
            style={{ '--theme-color': chatSettings.themeColor } as React.CSSProperties}
            className="fixed bottom-8 right-8 z-[9000] w-[900px] h-[700px] bg-[#2B2D31] text-zinc-300 rounded-[24px] shadow-2xl flex overflow-hidden border border-[#1E1F22]">
            
            <div className="flex-1 flex flex-col bg-[#313338]">
              {/* HEADER */}
              <div className="h-16 px-6 border-b border-[#1E1F22] flex justify-between items-center shadow-sm z-10">
                {/* Header content from previous version */}
                <div className="flex gap-4 items-center">
                   {/* Invite, Users, etc. */}
                   <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"><Cog className="w-5 h-5"/></button>
                   <button onClick={() => setOpen(false)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors"><X className="w-5 h-5"/></button>
                </div>
              </div>

              {/* CHAT LOG */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 scroll-smooth">
                {/* Message rendering logic as before, now using context */}
              </div>

              {/* INPUT AREA */}
              <div className="p-4"> {/* Input area logic from previous version */} </div>
            </div>

            {/* SIDEBAR */}
            <AnimatePresence> {/* Sidebar logic from previous version */} </AnimatePresence>
            
            {/* SETTINGS OVERLAY */}
            <AnimatePresence>
              {isSettingsOpen && <ChatSettingsOverlay onClose={() => setIsSettingsOpen(false)} />}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </SettingsContext.Provider>
  );
}

// -- SETTINGS OVERLAY COMPONENT --
function ChatSettingsOverlay({ onClose }: { onClose: () => void }) {
  const { chatSettings, setChatSettings } = useContext(SettingsContext);
  const updateSetting = (key: string, value: any) => setChatSettings((prev: any) => ({ ...prev, [key]: value }));

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 250 }}
      className="absolute inset-0 bg-[#202225] z-50 flex flex-col">
      <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-black/20">
        <h3 className="text-lg font-bold text-white">Chat Settings</h3>
        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10"><X className="w-5 h-5"/></button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-8">
        <SettingsSection icon={<Palette/>} title="Appearance">
          <SettingsRow label="Theme Color">
            <input type="color" value={chatSettings.themeColor} onChange={e => updateSetting('themeColor', e.target.value)} className="w-full h-8 bg-transparent rounded-md cursor-pointer"/>
          </SettingsRow>
          <SettingsRow label="Font Size">
            <Slider.Root value={[chatSettings.fontSize]} onValueChange={([val]) => updateSetting('fontSize', val)} min={12} max={20} step={1} className="relative flex items-center w-full h-5 touch-none select-none">
                <Slider.Track className="relative h-1 grow rounded-full bg-black/30"><Slider.Range className="absolute h-full rounded-full bg-indigo-500"/></Slider.Track>
                <Slider.Thumb className="block w-4 h-4 rounded-full bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 ring-offset-2 ring-offset-[#202225]"/>
            </Slider.Root>
          </SettingsRow>
        </SettingsSection>
        
        <SettingsSection icon={<Type/>} title="Text & Images">
           <SettingsRow label="Show Timestamps">
              <Switch.Root checked={chatSettings.showTimestamps} onCheckedChange={val => updateSetting('showTimestamps', val)} className="w-10 h-6 rounded-full relative bg-black/30 data-[state=checked]:bg-green-500 transition-colors"><Switch.Thumb className="block w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-200 translate-x-0.5 data-[state=checked]:translate-x-[18px]"/></Switch.Root>
           </SettingsRow>
           <SettingsRow label="Auto-Embed Media">
              <Switch.Root checked={chatSettings.autoEmbedMedia} onCheckedChange={val => updateSetting('autoEmbedMedia', val)} className="w-10 h-6 rounded-full relative bg-black/30 data-[state=checked]:bg-green-500 transition-colors"><Switch.Thumb className="block w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-200 translate-x-0.5 data-[state=checked]:translate-x-[18px]"/></Switch.Root>
           </SettingsRow>
        </SettingsSection>

        <SettingsSection icon={<BellDot/>} title="Notifications">
            <SettingsRow label="Notification Volume">
                <Slider.Root value={[chatSettings.notificationVolume]} onValueChange={([val]) => updateSetting('notificationVolume', val)} min={0} max={1} step={0.05} className="... Radix Slider styles ..."/>
            </SettingsRow>
            <SettingsRow label="Mute @mentions">
                <Switch.Root checked={chatSettings.muteMentions} onCheckedChange={val => updateSetting('muteMentions', val)} className="... Radix Switch styles ..."/>
            </SettingsRow>
        </SettingsSection>
      </div>
    </motion.div>
  );
}

// -- HELPER COMPONENTS for settings UI --
function SettingsSection({ icon, title, children }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-zinc-400 font-bold uppercase tracking-wider">
        {React.cloneElement(icon, { className: "w-4 h-4" })}
        <span>{title}</span>
      </div>
      <div className="bg-[#2B2D31]/50 p-4 rounded-lg space-y-4">{children}</div>
    </div>
  );
}
function SettingsRow({ label, children }: any) {
  return (
    <div className="flex justify-between items-center">
      <label className="text-sm font-medium text-zinc-200">{label}</label>
      <div className="w-40">{children}</div>
    </div>
  );
}
