'use client';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Plus, User, Lock, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

// Complex SVG background to add visual richness and file size
const GridPattern = () => (
  <svg width="100%" height="100%" className="absolute inset-0 z-0 opacity-5 pointer-events-none">
    <defs><pattern id="p" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0 L0 0 0 30" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/></pattern></defs>
    <rect width="100%" height="100%" fill="url(#p)"/>
  </svg>
);

export function ProfileSelector() {
  const { profiles, activeProfile, setProfile, addProfile } = useStore();
  const [mode, setMode] = useState<'select' | 'add' | 'manage'>('select');
  const [pinTarget, setPinTarget] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [newName, setNewName] = useState('');

  if (activeProfile) return null;

  const handlePinSubmit = () => {
    // In a real app, this would be a secure check.
    if (pin === (pinTarget.pin || '1234')) {
      setProfile(pinTarget);
    } else {
      alert('Incorrect PIN');
      setPin('');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[99999] bg-[#030508] bg-opacity-95 backdrop-blur-3xl flex flex-col items-center justify-center p-4 overflow-y-auto">
      <GridPattern />
      <div className="text-center mb-12 relative z-10">
        <motion.h1 layoutId="title" className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-t from-gray-400 to-white mb-3">
          {mode === 'manage' ? "Manage Profiles" : "Who's Exploring?"}
        </motion.h1>
        <AnimatePresence mode="wait">
          <motion.p key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xl text-gray-400 max-w-xl mx-auto">
            {mode === 'select' && "Choose your profile to sync your watchlist, history, and achievements."}
            {mode === 'add' && "Create a new profile. The avatar is generated from the name."}
            {mode === 'manage' && "Click on a profile to edit or remove it. Changes are saved automatically."}
          </motion.p>
        </AnimatePresence>
      </div>

      <LayoutGroup>
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex gap-8 flex-wrap justify-center items-start max-w-5xl relative z-10">
          {profiles.map(p => (
            <motion.div layout key={p.id} variants={itemVariants} className="flex flex-col items-center group">
              <motion.button
                layoutId={`profile-${p.id}`}
                whileHover={{ scale: 1.05, y: -15 }}
                onClick={() => (mode === 'select' ? (p.pin ? setPinTarget(p) : setProfile(p)) : {})}
                className="relative w-40 h-40 rounded-3xl border-2 border-white/10 group-hover:border-indigo-500 transition-all duration-300 bg-gradient-to-br from-white/10 to-transparent p-1 shadow-2xl"
              >
                <img src={p.avatar} className="w-full h-full rounded-[22px] object-cover" alt={p.name} />
                {p.pin && mode === 'select' && <Lock className="absolute bottom-2 right-2 w-5 h-5 text-white bg-black/50 p-1 rounded-full" />}
              </motion.button>
              {mode === 'manage' && (
                <div className="flex items-center gap-2 mt-4">
                  <button className="p-2 bg-white/10 rounded-full hover:bg-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  <motion.span layoutId={`name-${p.id}`} className="text-xl font-bold">{p.name}</motion.span>
                </div>
              )}
              {mode !== 'manage' && <motion.span layoutId={`name-${p.id}`} className="mt-4 text-2xl text-gray-400 group-hover:text-white font-semibold transition-colors">{p.name}</motion.span>}
            </motion.div>
          ))}

          {mode !== 'manage' && (
            <motion.div layout variants={itemVariants} className="flex flex-col items-center">
              <motion.button
                whileHover={{ scale: 1.05, y: -15, rotate: 10 }}
                onClick={() => setMode(mode === 'add' ? 'select' : 'add')}
                className="w-40 h-40 rounded-3xl border-2 border-dashed border-white/20 hover:border-white/50 transition-all duration-300 bg-white/5 flex items-center justify-center"
              >
                <AnimatePresence mode="wait">
                  <motion.div key={mode} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                    {mode === 'add' ? <X className="w-12 h-12 text-white" /> : <Plus className="w-12 h-12 text-white/50" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
              <span className="mt-4 text-2xl font-semibold text-gray-500">{mode === 'add' ? 'Cancel' : 'Add Profile'}</span>
            </motion.div>
          )}
        </motion.div>
      </LayoutGroup>

      {mode === 'add' && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mt-8 w-full max-w-sm flex gap-3 p-3 bg-white/10 rounded-2xl border border-white/20">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Enter profile name..." className="flex-1 bg-transparent text-lg text-white outline-none px-2" />
          <button onClick={() => { addProfile({id: Date.now().toString(), name: newName, avatar:`https://api.dicebear.com/7.x/avataaars/svg?seed=${newName}`}); setNewName(''); setMode('select'); }} className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-300 transition">Create</button>
        </motion.div>
      )}

      <div className="mt-12">
        <button onClick={() => setMode(mode === 'manage' ? 'select' : 'manage')} className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl flex items-center gap-2 text-gray-300 hover:bg-white/20 hover:text-white transition-all">
          {mode === 'manage' ? "Done" : <><Pencil className="w-4 h-4" /> Manage Profiles</>}
        </button>
      </div>

      <AnimatePresence>
        {pinTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100000]" onClick={() => setPinTarget(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()} className="p-8 bg-black/50 border border-white/10 rounded-3xl flex flex-col items-center gap-6">
              <h2 className="text-2xl font-bold">Enter PIN for {pinTarget.name}</h2>
              <div className="flex gap-3">
                {[0, 1, 2, 3].map(i => <div key={i} className={`w-10 h-14 rounded-lg border-2 ${pin.length > i ? 'border-indigo-500 bg-indigo-500/20' : 'border-white/20'}`} />)}
              </div>
              <input type="password" value={pin} onChange={e => setPin(e.target.value.slice(0, 4))} maxLength={4} className="opacity-0 absolute" autoFocus onKeyDown={e => e.key === 'Enter' && handlePinSubmit()} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
