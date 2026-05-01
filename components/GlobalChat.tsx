'use client';
import { useState, useRef, useEffect } from 'react';
import { 
  Send, MessageSquare, X, Users, Smile, Heart, 
  Paperclip, Share2, Check, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore'; // Linked back to your store

interface Reaction { emoji: string; count: number; users: string[] }
interface ChatMessage {
  id: string;
  user: string;
  avatar: string;
  msg: string;
  imageUrl?: string;
  time: Date;
  reactions: Record<string, Reaction>;
}

// Dummy users to simulate a live Discord server sidebar
const DUMMY_USERS =[
  { name: 'Admin', status: 'online', avatar: 'https://i.pravatar.cc/150?u=admin' },
  { name: 'CinephileX', status: 'dnd', avatar: 'https://i.pravatar.cc/150?u=cine' },
  { name: 'MovieFan123', status: 'idle', avatar: 'https://i.pravatar.cc/150?u=movie' },
];

export function GlobalChat({ roomCode = "PARTY-1337" }: { roomCode?: string }) {
  const { activeProfile } = useStore();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const[imagePreview, setImagePreview] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const[showUsers, setShowUsers] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatLog, open, imagePreview]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!msg.trim() && !imagePreview) return;

    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      user: activeProfile?.name || 'Guest',
      avatar: activeProfile?.avatar || 'https://i.pravatar.cc/150?u=guest',
      msg: msg.trim(),
      imageUrl: imagePreview || undefined,
      time: new Date(),
      reactions: {}
    };

    setChatLog(prev => [...prev, newMsg]);
    setMsg('');
    setImagePreview(null);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`https://yourapp.com/join/${roomCode}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      {/* Floating Action Button to Open Chat */}
      <AnimatePresence>
        {!open && (
          <motion.button 
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} 
            onClick={() => setOpen(true)}
            className="fixed bottom-8 right-8 z-[9000] bg-indigo-500 hover:bg-indigo-400 p-4 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-colors filter hover:brightness-110 active:scale-95 text-white"
          >
            <MessageSquare className="w-8 h-8" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ y: 50, opacity: 0, scale: 0.95 }} 
            animate={{ y: 0, opacity: 1, scale: 1 }} 
            exit={{ y: 50, opacity: 0, scale: 0.95 }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-8 right-8 z-[9000] w-[800px] h-[650px] bg-[#2B2D31] text-zinc-300 rounded-[24px] shadow-2xl flex overflow-hidden border border-[#1E1F22]"
          >
            
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-[#313338]">
              {/* Discord-style Header */}
              <div className="h-16 px-6 border-b border-[#1E1F22] flex justify-between items-center bg-[#313338] shadow-sm z-10">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-zinc-500">#</span>
                    <h3 className="font-bold text-zinc-100 font-sans tracking-wide">party-chat</h3>
                  </div>
                  <div className="h-4 w-[1px] bg-zinc-700" />
                  <p className="text-xs font-semibold text-zinc-400 bg-[#1E1F22] px-2 py-1 rounded-md tracking-wider">ROOM: {roomCode}</p>
                </div>
                <div className="flex gap-4 items-center">
                  <button onClick={copyInvite} className="flex flex-row items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 border border-indigo-500/20 hover:text-white rounded-md transition-all text-sm font-semibold">
                    {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {copiedLink ? "Copied" : "Invite"}
                  </button>
                  <button onClick={() => setShowUsers(!showUsers)} className={`p-2 rounded-md transition-colors ${showUsers ? 'bg-white/10 text-zinc-100' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}><Users className="w-5 h-5"/></button>
                  <button onClick={() => setOpen(false)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors"><X className="w-5 h-5"/></button>
                </div>
              </div>

              {/* Chat Log Data */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 scroll-smooth" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1E1F22 transparent' }}>
                <div className="flex flex-col gap-1 mt-4">
                  {chatLog.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4 mt-20">
                      <div className="w-24 h-24 bg-[#2B2D31] rounded-full flex items-center justify-center shadow-inner"><MessageSquare className="w-12 h-12 text-zinc-600" /></div>
                      <p className="text-lg font-bold">Welcome to the Party!</p>
                      <p className="text-sm">Be the first to send a message or drop an image.</p>
                    </div>
                  ) : (
                    chatLog.map((c) => <ChatMessageItem key={c.id} message={c} />)
                  )}
                </div>
              </div>

              {/* Advanced Input Area with File Upload */}
              <div className="p-4 bg-[#313338]">
                <div className="bg-[#383A40] rounded-xl flex flex-col pt-1 pb-1 px-2 border border-transparent focus-within:border-zinc-600 transition-colors">
                  
                  {/* Active Image Preview Box */}
                  <AnimatePresence>
                    {imagePreview && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 flex gap-4">
                        <div className="relative group">
                          <img src={imagePreview} alt="Preview" className="h-32 w-auto object-cover rounded-md border border-[#1E1F22] shadow-md" />
                          <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X className="w-4 h-4" /></button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-600/50 rounded-full transition-colors ml-1">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    
                    <input 
                      value={msg} 
                      onChange={e => setMsg(e.target.value)} 
                      onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                      placeholder="Message #party-chat..." 
                      className="flex-1 bg-transparent border-none outline-none py-3 text-zinc-100 placeholder-zinc-500" 
                    />
                    
                    <div className="flex items-center gap-1 pr-2 text-zinc-400">
                      <button className="p-2 hover:text-zinc-200 hover:bg-zinc-600/50 rounded-full transition-colors"><Smile className="w-5 h-5" /></button>
                      <button onClick={handleSendMessage} disabled={!msg && !imagePreview} className="p-2 text-indigo-400 hover:text-indigo-300 disabled:text-zinc-600 disabled:hover:bg-transparent hover:bg-indigo-500/10 rounded-full transition-colors">
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar (Offline/Online Users Context) */}
            <AnimatePresence>
              {showUsers && (
                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="bg-[#2B2D31] border-l border-[#1E1F22] flex flex-col overflow-hidden">
                  <div className="p-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    <h4 className="font-bold text-xs text-zinc-400 uppercase tracking-wider mb-4 border-b border-zinc-700/50 pb-2">Online — {DUMMY_USERS.length + 1}</h4>
                    <div className="flex flex-col gap-1">
                      
                      {/* You (Active User) */}
                      <div className="flex items-center gap-3 p-2 hover:bg-[#35373C] rounded-md transition-colors cursor-pointer group">
                        <div className="relative">
                          <img src={activeProfile?.avatar || 'https://i.pravatar.cc/150?u=You'} className="w-8 h-8 rounded-full border border-[#1E1F22]" alt={activeProfile?.name || 'You'} />
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-[#2B2D31] group-hover:border-[#35373C] rounded-full transition-colors bg-green-500" />
                        </div>
                        <span className="font-medium text-sm text-indigo-400 transition-colors">{activeProfile?.name || 'You'}</span>
                      </div>

                      {/* Mock Remote Server Users */}
                      {DUMMY_USERS.map(u => (
                        <div key={u.name} className="flex items-center gap-3 p-2 hover:bg-[#35373C] rounded-md transition-colors cursor-pointer group">
                          <div className="relative">
                            <img src={u.avatar} className="w-8 h-8 rounded-full border border-[#1E1F22]" alt={u.name} />
                            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-[#2B2D31] group-hover:border-[#35373C] rounded-full transition-colors 
                                ${u.status === 'online' ? 'bg-green-500' : u.status === 'dnd' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                          </div>
                          <span className="font-medium text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">{u.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Separate Sub-component for clean rendering of single messages + React Tooltips
function ChatMessageItem({ message }: { message: ChatMessage }) {
  const [hovered, setHovered] = useState(false);
  const timeString = message.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div 
      className="group relative flex gap-4 px-4 py-2 hover:bg-[#2E3035] transition-colors"
      onMouseEnter={() => setHovered(true)} 
      onMouseLeave={() => setHovered(false)}
    >
      <img src={message.avatar} alt={message.user} className="w-10 h-10 rounded-full cursor-pointer hover:shadow-lg transition-shadow mt-1" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-baseline gap-2">
          <span className="font-medium text-zinc-100 hover:underline cursor-pointer">{message.user}</span>
          <span className="text-xs text-zinc-500 font-medium">{timeString}</span>
        </div>
        
        {message.msg && <p className="text-zinc-300 leading-relaxed text-[15px] whitespace-pre-wrap">{message.msg}</p>}
        
        {message.imageUrl && (
          <div className="mt-2 text-left">
            <img src={message.imageUrl} alt="attachment" className="max-w-[300px] max-h-[300px] object-cover rounded-lg border border-[#1E1F22] cursor-pointer hover:opacity-90 transition-opacity" />
          </div>
        )}
      </div>

      {/* Floating Action Menu (Reactions, etc) */}
      <AnimatePresence>
        {hovered && (
          <motion.div initial={{ opacity: 0, y: -5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="absolute -top-3 right-4 bg-[#2B2D31] border border-[#1E1F22] rounded-md shadow-lg flex items-center p-1 px-2 gap-2 text-zinc-400">
            <button className="p-1.5 hover:bg-[#35373C] hover:text-zinc-200 rounded transition-all tooltip" title="Add Reaction"><Smile className="w-4 h-4"/></button>
            <button className="p-1.5 hover:bg-[#35373C] hover:text-pink-400 rounded transition-all" title="Love"><Heart className="w-4 h-4"/></button>
            <div className="w-[1px] h-4 bg-zinc-600/50 mx-1" />
            <button className="p-1.5 hover:bg-[#35373C] hover:text-zinc-200 rounded transition-all"><MoreHorizontal className="w-4 h-4"/></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
