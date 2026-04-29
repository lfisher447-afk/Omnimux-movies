'use client';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export function ProfileSelector() {
  const { profiles, activeProfile, setProfile, addProfile } = useStore();
  const[adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  if (activeProfile) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#030508] flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl md:text-6xl font-black mb-12 tracking-tighter">Who's Watching?</h1>
      <div className="flex gap-6 flex-wrap justify-center">
        {profiles.map(p => (
          <motion.button whileHover={{ scale: 1.05 }} key={p.id} onClick={() => setProfile(p)} className="flex flex-col items-center gap-4 group">
            <img src={p.avatar} className="w-32 h-32 rounded-2xl border-4 border-transparent group-hover:border-white transition-all bg-white/5" />
            <span className="text-xl text-gray-400 group-hover:text-white font-medium">{p.name}</span>
          </motion.button>
        ))}
        {adding ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-2xl bg-white/10 flex items-center justify-center p-2">
              <input autoFocus value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full bg-transparent text-center outline-none font-bold text-white" onKeyDown={e => { if(e.key==='Enter' && name) { addProfile({id: Date.now().toString(), name, avatar:`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}); setAdding(false); } }} />
            </div>
          </div>
        ) : (
          <motion.button whileHover={{ scale: 1.05 }} onClick={() => setAdding(true)} className="flex flex-col items-center gap-4 group">
            <div className="w-32 h-32 rounded-2xl border-4 border-transparent group-hover:border-white transition-all bg-white/5 flex items-center justify-center">
              <Plus className="w-12 h-12 text-gray-400 group-hover:text-white" />
            </div>
            <span className="text-xl text-gray-400 group-hover:text-white font-medium">Add Profile</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
