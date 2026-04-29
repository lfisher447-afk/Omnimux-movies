'use client';
import { useStore } from '@/store/useStore';
import { Sliders } from 'lucide-react';

export function VideoFilters() {
  const { videoFilters, setVideoFilters } = useStore();
  return (
    <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4 flex-wrap mt-4 backdrop-blur-md">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-400"><Sliders className="w-4 h-4"/> Filters:</div>
      {['brightness', 'contrast', 'saturation'].map(f => (
        <div key={f} className="flex items-center gap-2">
          <span className="text-xs uppercase w-8">{f.substr(0,3)}</span>
          <input type="range" min="50" max="150" value={(videoFilters as any)[f]} onChange={e => setVideoFilters({...videoFilters, [f]: parseInt(e.target.value)})} className="w-20 accent-indigo-500" />
        </div>
      ))}
      <button onClick={() => setVideoFilters({brightness:100, contrast:100, saturation:100})} className="text-xs bg-white/10 px-3 py-1.5 rounded hover:bg-white/20 font-bold">Reset</button>
    </div>
  );
}
