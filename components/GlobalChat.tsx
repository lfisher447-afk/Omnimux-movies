'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, Users, Cog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { useSocialStore } from '@/store/socialStore';

// Note: Replaced strict context with simple state to avoid overcomplication and focus on functional chat
export function GlobalChat({ roomCode = "PARTY-1337" }: { roomCode?: string }) {
  const { activeProfile } = useStore();
  const { globalChat, addGlobalMsg } = useSocialStore();
  
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [chatSettings, setChatSettings] = useState({ themeColor: '#4f46e5', showTimestamps: true });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [globalChat, open]);

  const handleSendMessage = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!msg.trim()) return;
      addGlobalMsg(activeProfile?.name || 'Local Operator', msg.trim());
      setMsg('');
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
           <motion.button  
             initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
             onClick={() => setOpen(true)}
             className="fixed bottom-8 right-8 z-[50] p-4 bg-indigo-600 rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.5)] text-white hover:bg-indigo-500 hover:scale-110 transition-all font-bold flex items-center gap-3 active:scale-95 cursor-pointer">
             <MessageSquare className="w-8 h-8" />
           </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
            style={{ '--theme-color': chatSettings.themeColor } as React.CSSProperties}
            className="fixed bottom-8 right-8 z-[9000] w-[95vw] md:w-[450px] h-[65vh] md:h-[700px] bg-[#2B2D31] text-zinc-300 rounded-[24px] shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex overflow-hidden border border-[#1E1F22]">
            
            <div className="flex-1 flex flex-col bg-[#313338] relative">
              
              {/* Header */}
              <div className="h-16 px-6 border-b border-[#1E1F22] flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-2 font-black text-white text-lg tracking-wider">
                  <Users className="w-5 h-5 text-indigo-400" /> #{roomCode}
                </div>
                <div className="flex gap-2 items-center">
                   <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"><Cog className="w-5 h-5"/></button>
                   <button onClick={() => setOpen(false)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors"><X className="w-5 h-5"/></button>
                </div>
              </div>

              {/* LIVE STORED CHAT LOG */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 scroll-smooth flex flex-col gap-4">
                  {globalChat.map((c, i) => {
                      const isMe = c.user === activeProfile?.name;
                      return (
                        <div key={i} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-xs font-black shrink-0 text-white">
                                {c.user.charAt(0).toUpperCase()}
                            </div>
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                                <span className="text-[10px] font-bold text-zinc-500 mb-1">{c.user} {chatSettings.showTimestamps && `• ${new Date(c.time).toLocaleTimeString()}`}</span>
                                <div className={`p-3 rounded-2xl text-[15px] shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-[#2B2D31] text-zinc-200 border border-white/5 rounded-tl-sm'}`}>
                                    {c.msg}
                                </div>
                            </div>
                        </div>
                      );
                  })}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-[#313338] border-t border-[#1E1F22]">
                  <form onSubmit={handleSendMessage} className="bg-[#383A40] rounded-xl flex items-center px-4 py-2 border border-black/10 focus-within:border-indigo-500 transition-colors shadow-inner">
                      <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder={`Message #${roomCode}...`} className="flex-1 bg-transparent border-none text-zinc-200 outline-none text-[15px]" />
                      <button type="submit" disabled={!msg.trim()} className="p-2 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                         <Send className="w-4 h-4"/>
                      </button>
                  </form>
              </div>

              {/* Basic Settings Overlay overlaying the chat panel */}
              <AnimatePresence>
                {isSettingsOpen && (
                   <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 250 }} className="absolute inset-0 bg-[#202225] z-50 flex flex-col">
                     <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-black/20">
                       <h3 className="text-lg font-bold text-white">Chat Settings</h3>
                       <button onClick={() => setIsSettingsOpen(false)} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10"><X className="w-5 h-5"/></button>
                     </div>
                     <div className="flex-1 p-6 overflow-y-auto space-y-6">
                         <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                            <label className="text-sm font-bold text-white block">Theme Color Override</label>
                            <input type="color" value={chatSettings.themeColor} onChange={e => setChatSettings({...chatSettings, themeColor: e.target.value})} className="w-full h-10 rounded bg-transparent cursor-pointer"/>
                         </div>
                         <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                            <label className="text-sm font-bold text-white">Show Timestamps</label> 
                            <button onClick={() => setChatSettings({...chatSettings, showTimestamps: !chatSettings.showTimestamps})} className={`w-12 h-6 rounded-full transition-colors relative ${chatSettings.showTimestamps ? 'bg-indigo-500' : 'bg-black'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${chatSettings.showTimestamps ? 'left-7' : 'left-1'}`} />
                            </button>
                         </div>
                     </div>
                   </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
