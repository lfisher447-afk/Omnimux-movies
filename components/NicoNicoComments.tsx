'use client';
import { useEffect, useState } from 'react';

export function NicoNicoComments({ active }: { active: boolean }) {
  const [comments, setComments] = useState<{id:number, text:string, top:number}[]>([]);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      const msgs =["Lol nice!", "Epic scene 🔥", "WTF was that?", "I love this part", "Masterpiece", "Plot twist incoming", "10/10"];
      const newComment = { id: Date.now(), text: msgs[Math.floor(Math.random()*msgs.length)], top: Math.random() * 80 };
      setComments(p =>[...p, newComment]);
      setTimeout(() => setComments(p => p.filter(c => c.id !== newComment.id)), 8000);
    }, 2000);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden rounded-2xl">
      {comments.map(c => (
        <div key={c.id} className="absolute whitespace-nowrap text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] animate-niconico" style={{ top: `${c.top}%`, right: '-20%' }}>
          {c.text}
        </div>
      ))}
    </div>
  );
}
