'use client';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Plus, Lock, Trash2, Pencil, X } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

export function ProfileSelector() {
  const { profiles, setProfile, addProfile } = useStore();
  const [mode, setMode] = useState<'select' | 'add' | 'manage'>('select');
  const [pinTarget, setPinTarget] = useState<any>(null);
  const[pin, setPin] = useState('');
  const [newName, setNewName] = useState('');

  const handlePinSubmit = () => {
    if (pin === (pinTarget.pin || '1234')) setProfile(pinTarget);
    else { alert('Incorrect Security PIN'); setPin(''); }
  };

  return (
    <motion.div exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }} className="fixed inset-0 z-[99999] bg-[#030508] flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen animate-pulse-glow pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="text-center mb-16 relative z-10">
        <motion.h1 layoutId="title" className="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-2xl mb-4">
          {mode === 'manage' ? "Manage Access" : "Who's Exploring?"}
        </motion.h1>
        <p className="text-xl text-gray-400 max-w-xl mx-auto font-medium">
          {mode === 'select' && "Select a neural profile to synchronize configurations."}
          {mode === 'add' && "Initialize a new neural link identity."}
          {mode === 'manage' && "Modify or terminate local accounts globally."}
        </p>
      </div>

      <LayoutGroup>
        <motion.div className="flex gap-8 flex-wrap justify-center items-start max-w-5xl relative z-10">
          {profiles.map(p => (
            <motion.div layout key={p.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center group">
              <motion.button
                layoutId={`profile-${p.id}`}
                whileHover={{ scale: 1.05, y: -10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (mode === 'select' ? (p.pin ? setPinTarget(p) : setProfile(p)) : {})}
                className="relative w-40 h-40 rounded-3xl border-2 border-white/5 hover:border-indigo-500/50 transition-all duration-500 bg-black shadow-2xl overflow-hidden"
              >
                <img src={p.avatar} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" alt={p.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                {p.pin && mode === 'select' && <Lock className="absolute bottom-3 right-3 w-6 h-6 text-white drop-shadow-md" />}
              </motion.button>
              
              {mode === 'manage' ? (
                <div className="flex items-center gap-3 mt-6 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                  <button className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  <span className="text-white font-bold">{p.name}</span>
                </div>
              ) : (
                <motion.span layoutId={`name-${p.id}`} className="mt-6 text-2xl text-gray-400 group-hover:text-white font-bold transition-colors tracking-tight">{p.name}</motion.span>
              )}
            </motion.div>
          ))}

          {mode !== 'manage' && (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center group">
              <motion.button
                whileHover={{ scale: 1.05, y: -10 }} whileTap={{ scale: 0.95 }}
                onClick={() => setMode(mode === 'add' ? 'select' : 'add')}
                className="w-40 h-40 rounded-3xl border-2 border-dashed border-white/20 group-hover:border-white/50 transition-all duration-500 bg-white/5 flex items-center justify-center backdrop-blur-sm"
              >
                <AnimatePresence mode="wait">
                  <motion.div key={mode} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring' }}>
                    {mode === 'add' ? <X className="w-12 h-12 text-white" /> : <Plus className="w-12 h-12 text-gray-400 group-hover:text-white transition-colors" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
              <span className="mt-6 text-2xl font-bold text-gray-600 group-hover:text-gray-400 transition-colors">{mode === 'add' ? 'Abort' : 'Add Profile'}</span>
            </motion.div>
          )}
        </motion.div>
      </LayoutGroup>

      {mode === 'add' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12 w-full max-w-md flex gap-3 p-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && setNewName('')} placeholder="Enter designation..." className="flex-1 bg-transparent text-xl font-bold text-white outline-none px-4" />
          <button onClick={() => { if(newName){ addProfile({id: Date.now().toString(), name: newName, avatar:`https://api.dicebear.com/7.x/avataaars/svg?seed=${newName}`}); setNewName(''); setMode('select'); } }} className="px-8 py-4 bg-white text-black font-black rounded-xl hover:bg-gray-200 transition-all">Connect</button>
        </motion.div>
      )}

      <div className="mt-16 z-20">
        <button onClick={() => setMode(mode === 'manage' ? 'select' : 'manage')} className="px-8 py-3 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 text-gray-400 hover:bg-white/10 hover:text-white transition-all font-bold tracking-widest uppercase text-sm">
          {mode === 'manage' ? "Conclude Editing" : <><Pencil className="w-4 h-4" /> Manage Profiles</>}
        </button>
      </div>

      <AnimatePresence>
        {pinTarget && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[100000]" onClick={() => setPinTarget(null)}>
            <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} onClick={e => e.stopPropagation()} className="p-10 bg-[#0a0a0a] border border-white/10 rounded-3xl flex flex-col items-center gap-8 shadow-2xl">
              <div className="text-center space-y-2">
                <Lock className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
                <h2 className="text-3xl font-black">Authorized Access Required</h2>
                <p className="text-gray-400">Authenticating as: {pinTarget.name}</p>
              </div>
              <div className="flex gap-4">
                {[0, 1, 2, 3].map(i => <div key={i} className={`w-14 h-16 rounded-xl flex items-center justify-center text-3xl font-black border-2 transition-all ${pin.length > i ? 'border-indigo-500 bg-indigo-500/20 text-white' : 'border-white/10 bg-black text-transparent'}`}>{pin[i] || '•'}</div>)}
              </div>
              <input type="password" value={pin} onChange={e => setPin(e.target.value.slice(0, 4))} maxLength={4} className="opacity-0 absolute inset-0 w-full h-full cursor-default" autoFocus onKeyDown={e => e.key === 'Enter' && handlePinSubmit()} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
