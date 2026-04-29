'use client';
import { useState, useRef, useEffect } from 'react';
import { Terminal as TermIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function Terminal() {
  const { stats, history } = useStore();
  const [lines, setLines] = useState<string[]>(['Omnimux OS v11.0.4 initialized.', 'Type "help" for commands.']);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    let response = '';

    switch(cmd) {
        case 'help': response = 'Commands: status, history, clear, sudo rm -rf /'; break;
        case 'status': response = `Hours Watched: ${stats.hoursWatched.toFixed(1)} | Nodes Online: 11`; break;
        case 'history': response = `Last Watched: ${history[0]?.title || 'None'}`; break;
        case 'clear': setLines([]); setInput(''); return;
        case 'sudo rm -rf /': response = 'Nice try. OmegaShield prevented self-destruction.'; break;
        default: response = `Command not found: ${cmd}`;
    }

    setLines(prev =>[...prev, `> ${input}`, response]);
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto pt-20 h-[80vh] flex flex-col">
       <div className="bg-[#111] border border-white/20 rounded-t-2xl p-4 flex items-center gap-3">
           <TermIcon className="w-5 h-5 text-green-500" />
           <span className="font-mono text-sm text-gray-400">root@omnimux:~</span>
       </div>
       <div className="flex-1 bg-black border-x border-b border-white/20 rounded-b-2xl p-6 font-mono text-green-500 overflow-y-auto">
           {lines.map((l, i) => <div key={i} className="mb-2">{l}</div>)}
           <form onSubmit={handleCommand} className="flex gap-2 mt-4">
               <span>&gt;</span>
               <input autoFocus value={input} onChange={e=>setInput(e.target.value)} className="flex-1 bg-transparent outline-none text-white font-mono" spellCheck={false}/>
           </form>
           <div ref={bottomRef} />
       </div>
    </div>
  );
}
