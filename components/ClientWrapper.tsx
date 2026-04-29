'use client';
import { useStore } from '@/store/useStore';
import { ProfileSelector } from './ProfileSelector';
import { Navbar } from './Navbar';
import { GlobalChat } from './GlobalChat';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { activeProfile } = useStore();
  const[mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); },[]);

  if (!mounted) return <div className="min-h-screen bg-[#030508] fixed inset-0 z-[100000]" />;

  return (
    <AnimatePresence mode="wait">
      {!activeProfile ? (
        <ProfileSelector key="profile-selector" />
      ) : (
        <motion.div
           key="app-content"
           initial={{ opacity: 0, filter: 'blur(20px)' }}
           animate={{ opacity: 1, filter: 'blur(0px)' }}
           transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
           className="flex flex-col min-h-screen relative"
        >
          <Navbar />
          <main className="flex-grow w-full h-full relative z-10 pt-24 pb-20">
            {children}
          </main>
          <GlobalChat />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
