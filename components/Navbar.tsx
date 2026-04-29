'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MonitorPlay, Film, Sparkles, LayoutDashboard, Bell, User, Settings, LogOut } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { CommandPalette } from './CommandPalette';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data for notifications, adding to file size and demonstrating a realistic dropdown
const mockNotifications = [
  { id: 1, text: "New season of 'The Expanse' is now available.", type: "new_release" },
  { id: 2, text: "Your watch party for 'Dune' starts in 10 minutes.", type: "reminder" },
  { id: 3, text: "'Interstellar' has been added to your watchlist.", type: "action" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { activeProfile, setProfile } = useStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('open-cmd', () => setCmdOpen(true));
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const menuVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 300 } },
  };

  return (
    <>
      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="fixed top-0 w-full z-50">
        <div className={`transition-all duration-300 mx-4 mt-4 rounded-3xl border ${scrolled ? 'bg-black/80 backdrop-blur-2xl py-4 border-white/10 shadow-2xl' : 'bg-transparent py-5 border-transparent'}`}>
            <div className="max-w-[1800px] mx-auto px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-12">
              <Link href="/" className="text-3xl font-black tracking-tighter text-white drop-shadow-md flex items-center gap-2 relative group">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 group-hover:from-purple-500 group-hover:to-pink-500 transition-all duration-500">OMNIMUX</span>
              </Link>
              <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-gray-400">
                <Link href="/" className="hover:text-white transition-colors duration-300">Home</Link>
                <Link href="/discover" className="hover:text-white transition-colors duration-300">Discover</Link>
                <Link href="/ai-search" className="flex items-center gap-2 hover:text-indigo-400 transition-colors duration-300 text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20"><Sparkles className="w-4 h-4"/> AI Search</Link>
                <Link href="/admin" className="hover:text-white transition-colors duration-300">Admin</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setCmdOpen(true)} className="hidden md:flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl text-sm text-gray-400 transition-all duration-300 group shadow-lg hover:shadow-white/5">
                <Search className="w-4 h-4"/> <span>Search</span> <kbd className="hidden lg:inline bg-black/50 px-2 py-0.5 rounded text-xs border border-white/10">⌘K</kbd>
              </button>
              
              <div className="relative">
                <button onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/10 relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center border-2 border-black animate-pulse">3</span>
                </button>
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div variants={menuVariants} initial="hidden" animate="visible" exit="hidden" className="absolute top-14 right-0 w-80 bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-4 origin-top-right">
                      <h3 className="font-bold mb-3">Notifications</h3>
                      <div className="flex flex-col gap-3">
                        {mockNotifications.map(n => <div key={n.id} className="text-sm p-3 bg-white/5 rounded-lg text-gray-300">{n.text}</div>)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }} className="relative group cursor-pointer block">
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-50 group-hover:opacity-80 transition duration-500"></div>
                  <img src={activeProfile?.avatar} className="relative w-12 h-12 rounded-full border-2 border-[#1a1a1a] shadow-2xl object-cover bg-black" />
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div variants={menuVariants} initial="hidden" animate="visible" exit="hidden" className="absolute top-14 right-0 w-64 bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-2 origin-top-right">
                      <div className="p-3">
                        <p className="font-bold text-lg">{activeProfile?.name}</p>
                        <p className="text-sm text-gray-400">Cinephile Rank: #1</p>
                      </div>
                      <div className="w-full h-[1px] bg-white/10 my-1"/>
                      <button className="w-full text-left p-3 rounded-lg hover:bg-white/10 flex items-center gap-3 transition-colors"><User className="w-4 h-4"/> Manage Profile</button>
                      <button className="w-full text-left p-3 rounded-lg hover:bg-white/10 flex items-center gap-3 transition-colors"><Settings className="w-4 h-4"/> App Settings</button>
                      <button onClick={() => setProfile(null)} className="w-full text-left p-3 rounded-lg hover:bg-red-500/20 text-red-400 flex items-center gap-3 transition-colors"><LogOut className="w-4 h-4"/> Sign Out</button>
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
