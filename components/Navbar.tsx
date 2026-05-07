'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Bell, User, LogOut, Terminal, Globe } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { CommandPalette } from './CommandPalette';
import { motion, AnimatePresence } from 'framer-motion';

const mockNotifications =[
  { id: 1, text: "New episode of Severance isolated in sector 4.", time: "2m ago" },
  { id: 2, text: "WebRTC peer connection successfully bridged.", time: "1h ago" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const[cmdOpen, setCmdOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'user' | 'bell' | null>(null);
  const { activeProfile, setProfile } = useStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  },[]);

  const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 10, filter: 'blur(5px)' },
    visible: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', damping: 25, stiffness: 400 } },
  };

  return (
    <>
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.8, ease:[0.16, 1, 0.3, 1] }} className="fixed top-0 w-full z-50 px-4 pt-4">
        <div className={`transition-all duration-500 mx-auto max-w-[1800px] rounded-[24px] ${scrolled ? 'bg-black/70 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] py-3' : 'bg-transparent border-transparent py-4'}`}>
            <div className="flex items-center justify-between px-6">
                <div className="flex items-center gap-12">
                <Link href="/" className="text-3xl font-black tracking-tighter text-white drop-shadow-md group flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center rotate-45 group-hover:rotate-90 transition-all duration-500">
                        <div className="w-3 h-3 bg-black -rotate-45" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-500">OMNIMUX</span>
                </Link>
                <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-gray-400">
                    <Link href="/" className="hover:text-white transition-colors">Home</Link>
                    <Link href="/discover" className="hover:text-white transition-colors">Discover</Link>
                    <Link href="/ai-search" className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"><Sparkles className="w-4 h-4"/> AI Engine</Link>
                    <Link href="/admin" className="hover:text-white transition-colors">Admin Stats</Link>
                    <Link href="/wrapped" className="hover:text-white transition-colors">Wrapped 26</Link>
                </div>
                </div>

                <div className="flex items-center gap-4">
                <button onClick={() => setCmdOpen(true)} className="hidden md:flex items-center gap-3 bg-black/50 hover:bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-sm text-gray-400 transition-all shadow-inner group">
                    <Search className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors"/> 
                    <span>Quick Find</span> 
                    <kbd className="hidden lg:inline bg-white/5 px-2 py-0.5 rounded-md text-[10px] font-mono border border-white/10 ml-4">⌘K</kbd>
                </button>
                
                {/* Notifications */}
                <div className="relative">
                    <button onClick={() => setActiveDropdown(activeDropdown === 'bell' ? null : 'bell')} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10 relative">
                    <Bell className="w-5 h-5 text-gray-300" />
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-[#111] animate-pulse">2</span>
                    </button>
                    <AnimatePresence>
                    {activeDropdown === 'bell' && (
                        <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="hidden" className="absolute top-14 right-0 w-80 glass-panel rounded-2xl p-4 origin-top-right">
                        <h3 className="font-bold text-sm tracking-widest uppercase mb-3 text-gray-400">System Logs</h3>
                        <div className="flex flex-col gap-2">
                            {mockNotifications.map(n => (
                            <div key={n.id} className="p-3 bg-black/40 rounded-xl hover:bg-white/5 transition border border-white/5">
                                <p className="text-sm font-medium text-gray-200">{n.text}</p>
                                <p className="text-[10px] text-indigo-400 mt-2 font-mono uppercase">{n.time}</p>
                            </div>
                            ))}
                        </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                {/* User Menu */}
                <div className="relative">
                    <button onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')} className="relative group flex items-center gap-3 ml-2">
                    <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition duration-500"></div>
                    <img src={activeProfile?.avatar} className="relative w-11 h-11 rounded-full border border-white/20 shadow-xl bg-[#111] object-cover" />
                    </button>
                    <AnimatePresence>
                    {activeDropdown === 'user' && (
                        <motion.div variants={dropdownVariants} initial="hidden" animate="visible" exit="hidden" className="absolute top-14 right-0 w-64 glass-panel rounded-2xl p-2 origin-top-right">
                        <div className="p-4 bg-white/5 rounded-xl mb-2 flex items-center gap-3">
                            <img src={activeProfile?.avatar} className="w-10 h-10 rounded-full bg-black object-cover"/>
                            <div>
                                <p className="font-black text-white leading-none">{activeProfile?.name}</p>
                                <p className="text-xs text-indigo-400 font-bold mt-1">Level 42 Operator</p>
                            </div>
                        </div>
                        {/* --- FIXED: Actionable buttons pointing to the proper system interfaces --- */}
                        <div className="flex flex-col gap-1">
                            <Link href="/terminal" onClick={() => setActiveDropdown(null)} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 flex items-center gap-3 transition-colors text-sm font-bold text-gray-300 hover:text-white">
                                <Terminal className="w-4 h-4"/> OS Terminal Config
                            </Link>
                            <Link href="/browser" onClick={() => setActiveDropdown(null)} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 flex items-center gap-3 transition-colors text-sm font-bold text-gray-300 hover:text-white">
                                <Globe className="w-4 h-4"/> Neural Browser Link
                            </Link>
                            <div className="w-full h-px bg-white/10 my-1"/>
                            <button onClick={() => { setProfile(null); setActiveDropdown(null); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-500/20 text-red-500 flex items-center gap-3 transition-colors text-sm font-bold">
                                <LogOut className="w-4 h-4"/> Disconnect Link
                            </button>
                        </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
                </div>
            </div>
        </div>
      </motion.nav>
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
