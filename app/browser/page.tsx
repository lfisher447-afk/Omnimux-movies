'use client';
import { useState, useRef } from 'react';
import { Globe, ArrowRight, ShieldAlert, Lock, RefreshCcw, Command } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NeuralBrowser() {
  const [url, setUrl] = useState('https://wikipedia.org');
  const [inputUrl, setInputUrl] = useState(url);
  const[htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const navigate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let target = inputUrl;
    if (!target.startsWith('http')) target = 'https://' + target;
    setUrl(target);
    setLoading(true);

    try {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(target)}`);
      const data = await res.text();
      setHtmlContent(data);
    } catch (err) {
      setHtmlContent(`<div style="color:red; padding: 20px;">Connection severed to ${target}</div>`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 max-w-[1600px] mx-auto px-6 h-screen flex flex-col pb-6">
      <div className="glass-panel p-4 rounded-3xl mb-4 flex items-center gap-4 shadow-2xl relative z-20">
        <div className="flex gap-2 text-gray-400 pl-2">
           <button onClick={() => navigate()} className="hover:text-white transition"><RefreshCcw className="w-5 h-5"/></button>
        </div>
        <form onSubmit={navigate} className="flex-1 relative flex items-center">
          <Lock className="w-4 h-4 text-green-400 absolute left-4" />
          <input 
            value={inputUrl} onChange={e => setInputUrl(e.target.value)} 
            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-mono outline-none focus:border-indigo-500 transition shadow-inner" 
            placeholder="Enter target URL..." 
          />
        </form>
        <button className="bg-indigo-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500 transition text-white">
          <Globe className="w-5 h-5"/> Connect
        </button>
      </div>

      <div className="flex-1 glass-panel rounded-3xl overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10">
        {loading && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
            <Command className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-xl font-black tracking-widest uppercase text-indigo-400 animate-pulse">Bypassing Security Protocols...</p>
          </div>
        )}
        <div className="w-full h-full bg-white overflow-y-auto custom-scrollbar relative z-10" ref={contentRef} dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    </div>
  );
}
