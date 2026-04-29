'use client';
import { useSocialStore } from '@/store/socialStore';
import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, Users, Smile, Heart } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

// Expanded state to include reactions
interface ChatMessage { user: string; msg: string; time: number; reactions?: { [emoji: string]: number } }
type SocialState = { globalChat: ChatMessage[]; addGlobalMsg: (user: string, msg: string) => void; addReaction: (time: number, emoji: string) => void; };

// This would be a more robust store update, here we just adapt
const useRobustSocialStore = useSocialStore as any as () => SocialState;

// Dummy user list
const onlineUsers = [{ name: 'Admin', status: 'online'}, { name: 'CinephileX', status: 'idle' }, { name: 'MovieFan123', status: 'online' }];

export function GlobalChat() {
  const { globalChat, addGlobalMsg } = useSocialStore();
  const { activeProfile } = useStore();
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulate typing indicators
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;
    if (msg.length > 0 && open) {
        // Simulate sending a "typing" event
    } else {
        // Simulate sending a "stop typing" event
    }

    // Simulate receiving typing events from others
    const interval = setInterval(() => {
        if (Math.random() > 0.5) {
            const randomUser = onlineUsers[Math.floor(Math.random() * onlineUsers.length)].name;
            if (randomUser !== activeProfile?.name) {
                setTypingUsers(prev => [...new Set([...prev, randomUser])]);
                setTimeout(() => setTypingUsers(prev => prev.filter(u => u !== randomUser)), 3000);
            }
        }
    }, 4000);
    
    return () => clearInterval(interval);

  }, [msg, open, activeProfile]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [globalChat, open]);

  return (
    <>
      <AnimatePresence>{!open && <motion.button initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} onClick={()=>setOpen(true)} className="fixed bottom-8 right-8 z-[9000] bg-indigo-600 p-4 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.6)]"><MessageSquare className="w-7 h-7 text-white"/></motion.button>}</AnimatePresence>
      <AnimatePresence>
       {open && (
        <motion.div initial={{y:100,opacity:0}} animate={{y:0,opacity:1}} exit={{y:100,opacity:0}} className="fixed bottom-8 right-8 z-[9000] w-[380px] h-[600px] bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg">Global Watch Party</h3>
                    <p className="text-xs text-gray-400">{onlineUsers.length} Users Online</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowUsers(!showUsers)} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><Users className="w-4 h-4"/></button>
                    <button onClick={()=>setOpen(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X className="w-4 h-4"/></button>
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                {globalChat.map((c, i) => <ChatMessage key={i} message={c}/>)}
                </div>
                <AnimatePresence>
                {showUsers && (
                    <motion.div initial={{width:0}} animate={{width:150}} exit={{width:0}} className="bg-black/30 border-l border-white/5 p-3 flex flex-col gap-2">
                        <h4 className="font-bold text-sm mb-2">Online</h4>
                        {onlineUsers.map(u => <div key={u.name} className="flex items-center gap-2 text-xs"><span className={`w-2 h-2 rounded-full ${u.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`}/>{u.name}</div>)}
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
            <div className="p-4 border-t border-white/10">
                <AnimatePresence>
                    {typingUsers.length > 0 && <motion.div initial={{height:0, opacity:0}} animate={{height:20, opacity:1}} exit={{height:0, opacity:0}} className="text-xs text-gray-400 mb-1">{typingUsers.join(', ')} is typing...</motion.div>}
                </AnimatePresence>
                <form onSubmit={e => { e.preventDefault(); if(msg) { addGlobalMsg(activeProfile?.name || 'Guest', msg); setMsg(''); } }} className="flex gap-2">
                    <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Message the world..." className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-indigo-500"/>
                    <button type="submit" className="bg-indigo-600 px-4 rounded-lg text-white"><Send className="w-4 h-4"/></button>
                </form>
            </div>
        </motion.div>
       )}
      </AnimatePresence>
    </>
  );
}

// Sub-component for displaying a single message with reactions
function ChatMessage({ message }: { message: ChatMessage }) {
    const [showReactions, setShowReactions] = useState(false);
    return (
        <div className="group relative" onMouseEnter={() => setShowReactions(true)} onMouseLeave={() => setShowReactions(false)}>
            <div className="text-sm leading-relaxed"><span className="font-bold text-indigo-400 mr-2">{message.user}</span><span className="text-gray-300">{message.msg}</span></div>
            <AnimatePresence>
             {showReactions && <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} className="absolute -top-4 right-0 bg-[#222] border border-white/10 rounded-full flex gap-1 p-1">
                <button className="p-1 hover:scale-125 transition-transform"><Heart className="w-4 h-4 text-red-500"/></button>
                <button className="p-1 hover:scale-125 transition-transform">👍</button>
             </motion.div>}
            </AnimatePresence>
        </div>
    );
}
