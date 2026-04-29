'use client';
import { useSocialStore } from '@/store/socialStore';
import { useState } from 'react';
import { Send, Globe2 } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function GlobalChat() {
  const { globalChat, addGlobalMsg } = useSocialStore();
  const { activeProfile } = useStore();
  const [msg, setMsg] = useState('');
  const[open, setOpen] = useState(false);

  if (!open) return (
    <button onClick={()=>setOpen(true)} className="fixed bottom-6 left-6 z-[9000] bg-indigo-600 hover:bg-indigo-500 p-4 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.5)] transition text-white">
      <Globe2 className="w-6 h-6" />
    </button>
  );

  return (
    <div className="fixed bottom-6 left-6 z-[9000] w-80 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2"><Globe2 className="w-4 h-4 text-indigo-400"/> Global Chat</h3>
        <button onClick={()=>setOpen(false)} className="text-gray-400 hover:text-white font-bold">X</button>
      </div>
      <div className="h-64 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
        {globalChat.map((c,i) => (
          <div key={i} className="text-sm leading-relaxed"><span className="font-bold text-indigo-400 mr-2">{c.user}</span><span className="text-gray-300">{c.msg}</span></div>
        ))}
      </div>
      <form onSubmit={e => { e.preventDefault(); if(msg) { addGlobalMsg(activeProfile?.name || 'Guest', msg); setMsg(''); } }} className="p-3 border-t border-white/10 flex gap-2 bg-white/5">
        <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Say hi to the world..." className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 outline-none text-sm focus:border-indigo-500 transition"/>
        <button type="submit" className="bg-indigo-600 px-4 rounded-lg text-white hover:bg-indigo-500 transition"><Send className="w-4 h-4"/></button>
      </form>
    </div>
  );
}
