'use client';
import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Plus, Lock, Trash2, Pencil, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

export function ProfileSelector() {
  const { profiles, setProfile, addProfile, removeProfile } = useStore();
  const[mode, setMode] = useState<'select' | 'add' | 'manage'>('select');
  const[pinTarget, setPinTarget] = useState<any>(null);
  const [pin, setPin] = useState('');
  const [newName, setNewName] = useState('');
  const [isError, setIsError] = useState(false);

  const handlePinSubmit = () => {
    if (pin === (pinTarget.pin || '1234')) {
        setProfile(pinTarget);
    } else {
        setIsError(true);
        setTimeout(() => { setPin(''); setIsError(false); }, 600);
    }
  };

  return (
    <motion.div exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }} className="fixed inset-0 z-[99999] bg-[#030508] flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-indigo-600/10 blur-[200px] rounded-full mix-blend-screen animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[800px] h-[800px] bg-fuchsia-600/10 blur-[200px] rounded-full mix-blend-screen animate-pulse-glow pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="text-center mb-16 relative z-10">
        <motion.h1 layoutId="title" className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 drop-shadow-2xl mb-4">
          {mode === 'manage' ? "System Config" : "Neural Link"}
        </motion.h1>
        <p className="text-xl text-gray-400 font-medium tracking-tight">
          {mode === 'select' && "Select an authorized profile to sync telemetry."}
          {mode === 'add' && "Initialize a new operator parameter."}
          {mode === 'manage' && "Terminate or alter active links."}
        </p>
      </div>

      <LayoutGroup>
        <motion.div className="flex gap-8 flex-wrap justify-center items-start max-w-6xl relative z-10">
          {profiles.map(p => (
            <motion.div layout key={p.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center group">
              <motion.button
                layoutId={`profile-${p.id}`}
                whileHover={{ scale: 1.05, y: -10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => (mode === 'select' ? (p.pin ? setPinTarget(p) : setProfile(p)) : {})}
                className="relative w-44 h-44 rounded-[32px] border border-white/10 group-hover:border-indigo-500/50 transition-all duration-700 bg-black shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:shadow-[0_20px_60px_rgba(79,70,229,0.3)] overflow-hidden ring-4 ring-black"
              >
                <img src={p.avatar} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" alt={p.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030508] via-transparent to-transparent opacity-80" />
                {p.pin && mode === 'select' && (
                    <div className="absolute bottom-4 right-4 bg-black/60 p-2 rounded-full backdrop-blur-md border border-white/10">
                        <Lock className="w-5 h-5 text-white" />
                    </div>
                )}
              </motion.button>
              
              {mode === 'manage' ? (
                <div className="flex items-center gap-3 mt-6 bg-red-500/10 border border-red-500/20 px-5 py-2.5 rounded-2xl backdrop-blur-md group-hover:bg-red-500/20 transition-all">
                  <button onClick={() => removeProfile(p.id)} className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 font-bold"><Trash2 className="w-4 h-4" /> Terminate</button>
                </div>
              ) : (
                <motion.span layoutId={`name-${p.id}`} className="mt-6 text-2xl text-gray-400 group-hover:text-white font-black tracking-tight transition-colors">{p.name}</motion.span>
              )}
            </motion.div>
          ))}

          {mode !== 'manage' && (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center group">
              <motion.button
                whileHover={{ scale: 1.05, y: -10 }} whileTap={{ scale: 0.95 }}
                onClick={() => setMode(mode === 'add' ? 'select' : 'add')}
                className="w-44 h-44 rounded-[32px] border-2 border-dashed border-white/20 group-hover:border-white/60 transition-all duration-500 bg-white/[0.02] flex items-center justify-center backdrop-blur-md"
              >
                <AnimatePresence mode="wait">
                  <motion.div key={mode} initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }} transition={{ type: 'spring' }}>
                    {mode === 'add' ? <X className="w-14 h-14 text-white" /> : <Plus className="w-14 h-14 text-gray-500 group-hover:text-white transition-colors" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
              <span className="mt-6 text-2xl font-bold text-gray-600 group-hover:text-gray-300 transition-colors uppercase tracking-widest text-sm">{mode === 'add' ? 'Abort' : 'Initialize'}</span>
            </motion.div>
          )}
        </motion.div>
      </LayoutGroup>

      {mode === 'add' && (
        <motion.div initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} className="mt-14 w-full max-w-lg flex flex-col gap-4 p-6 glass-panel rounded-[32px] relative z-20">
          <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#111] shrink-0 border border-white/10 flex items-center justify-center overflow-hidden">
                  {newName ? <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${newName}`} /> : <ShieldCheck className="w-6 h-6 text-gray-600"/>}
              </div>
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && setNewName('')} placeholder="Operator Designation..." className="flex-1 bg-transparent text-2xl font-black text-white outline-none placeholder:text-gray-700" />
          </div>
          <button onClick={() => { if(newName){ addProfile({id: Date.now().toString(), name: newName, avatar:`https://api.dicebear.com/7.x/avataaars/svg?seed=${newName}`}); setNewName(''); setMode('select'); } }} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-400 hover:text-white transition-all duration-300">Deploy Protocol</button>
        </motion.div>
      )}

      <div className="absolute bottom-12 z-20">
        <button onClick={() => setMode(mode === 'manage' ? 'select' : 'manage')} className="px-6 py-3 bg-black/50 border border-white/10 rounded-full flex items-center gap-3 text-gray-400 hover:bg-white/10 hover:text-white transition-all font-bold tracking-widest uppercase text-xs backdrop-blur-md">
          {mode === 'manage' ? "Lock Configuration" : <><Pencil className="w-4 h-4" /> System Admin</>}
        </button>
      </div>

      <AnimatePresence>
        {pinTarget && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl flex items-center justify-center z-[100000]" onClick={() => setPinTarget(null)}>
            <motion.div 
               initial={{ scale: 0.9, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 40, opacity: 0 }} 
               transition={{ type: 'spring', damping: 20 }}
               onClick={e => e.stopPropagation()} className="p-12 bg-[#0a0a0a] border border-white/10 rounded-[40px] flex flex-col items-center gap-10 shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden"
            >
              <motion.div animate={isError ? { x:[-10, 10, -10, 10, 0] } : {}} className="text-center space-y-3 relative z-10 w-full">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-[0_0_40px_rgba(79,70,229,0.3)]"><Lock className="w-8 h-8 text-indigo-400" /></div>
                <h2 className="text-4xl font-black tracking-tighter">Enter Passcode</h2>
                <p className={`font-bold transition-colors ${isError ? 'text-red-500' : 'text-gray-500'}`}>{isError ? "ACCESS DENIED" : `Authenticating as ${pinTarget.name}`}</p>
              </motion.div>
              <div className="flex gap-4 relative z-10">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-16 h-20 rounded-2xl flex items-center justify-center text-4xl font-black border-2 transition-all duration-300 ${pin.length > i ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] scale-110' : 'border-white/10 bg-black text-transparent'}`}>
                        {pin[i] ? '●' : ''}
                    </div>
                ))}
              </div>
              <input type="password" value={pin} onChange={e => setPin(e.target.value.slice(0, 4))} maxLength={4} className="opacity-0 absolute inset-0 w-full h-full cursor-default z-20" autoFocus onKeyDown={e => e.key === 'Enter' && handlePinSubmit()} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
