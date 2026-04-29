'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MonitorPlay, Film, Heart } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { CommandPalette } from './CommandPalette';

export function Navbar() {
  const[scrolled, setScrolled] = useState(false);
  const[cmdOpen, setCmdOpen] = useState(false);
  const { activeProfile } = useStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    document.addEventListener('open-cmd', () => setCmdOpen(true));
    return () => window.removeEventListener('scroll', onScroll);
  },[]);

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-black/90 backdrop-blur-2xl shadow-2xl py-3 border-b border-white/10' : 'bg-gradient-to-b from-black/80 to-transparent py-5'}`}>
        <div className="max-w-[1800px] mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="text-3xl font-black tracking-tighter text-white drop-shadow-md">
            OMNIMUX<sup className="text-[10px] text-indigo-500 ml-1">10X</sup>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-gray-400">
            <Link href="/" className="flex items-center gap-2 hover:text-white transition"><MonitorPlay className="w-4 h-4"/> Home</Link>
            <Link href="/discover" className="flex items-center gap-2 hover:text-white transition"><Film className="w-4 h-4"/> Discover</Link>
            <Link href="/ai-search" className="flex items-center gap-2 hover:text-indigo-400 transition text-indigo-200">✨ AI Search</Link>
            <Link href="/wrapped" className="flex items-center gap-2 hover:text-white transition">Wrapped</Link>
            <Link href="/admin" className="flex items-center gap-2 hover:text-white transition">Admin</Link>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setCmdOpen(true)} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm text-gray-400 transition">
              <Search className="w-4 h-4"/> <span>Search</span> <kbd className="bg-white/10 px-2 py-0.5 rounded text-xs">⌘K</kbd>
            </button>
            <img src={activeProfile?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest'} className="w-10 h-10 rounded-full border border-white/20 shadow-lg cursor-pointer" />
          </div>
        </div>
      </nav>
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
