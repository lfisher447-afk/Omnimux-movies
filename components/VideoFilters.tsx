'use client';
import { useStore } from '@/store/useStore';
import { Sliders, RefreshCcw, Sun, Contrast, Droplets, Wand2, MonitorPlay } from 'lucide-react';
import { useMemo } from 'react';

const presets =[
  { name: 'Matrix', values: { brightness: 90, contrast: 130, saturation: 80, sepia: 40 } },
  { name: 'Vibrant HDR', values: { brightness: 110, contrast: 120, saturation: 140, sepia: 0 } },
  { name: 'OLED Black', values: { brightness: 80, contrast: 110, saturation: 100, sepia: 0 } },
];

export function VideoFilters() {
  const { videoFilters, setVideoFilters } = useStore();

  const resetAll = () => setVideoFilters({ brightness: 100, contrast: 100, saturation: 100, sepia: 0 });

  return (
    <div className="glass-panel p-8 rounded-[32px] mt-8 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h3 className="text-xl font-black text-white flex items-center gap-3"><Sliders className="text-indigo-400 w-6 h-6"/> DSP Pipeline</h3>
        <button onClick={resetAll} className="flex items-center gap-2 text-sm px-4 py-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors font-bold"><RefreshCcw className="w-4 h-4"/> Flush Memory</button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase flex items-center gap-2"><Wand2 className="w-3 h-3"/> Neural Presets</span>
        {presets.map(p => (
           <button key={p.name} onClick={() => setVideoFilters(p.values)} className="px-4 py-1.5 text-xs font-bold bg-[#111] border border-white/10 rounded-lg hover:border-indigo-500 transition-colors shadow-sm">{p.name}</button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-4">
        {[
          { key: 'brightness', icon: Sun, color: 'text-yellow-400' },
          { key: 'contrast', icon: Contrast, color: 'text-white' },
          { key: 'saturation', icon: Droplets, color: 'text-blue-400' },
          { key: 'sepia', icon: MonitorPlay, color: 'text-orange-400' }
        ].map((f) => (
            <div key={f.key} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-2">
                    <f.icon className={`w-4 h-4 ${f.color}`}/> {f.key}
                </span>
                <span className="text-xs font-mono font-bold">{videoFilters[f.key as keyof typeof videoFilters]}%</span>
              </div>
              <input 
                type="range" min="0" max="200" 
                value={videoFilters[f.key as keyof typeof videoFilters]} 
                onChange={e => setVideoFilters({...videoFilters, [f.key]: parseInt(e.target.value)})} 
                className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-full appearance-none outline-none cursor-pointer" 
              />
            </div>
        ))}
      </div>
    </div>
  );
}
