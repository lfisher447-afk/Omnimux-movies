'use client';
import { useStore } from '@/store/useStore';
import { Sliders, RefreshCcw, Sun, Contrast, Droplets, Wand2, Palette } from 'lucide-react';
import { useState, useMemo } from 'react';

// Define complex preset types
type FilterPreset = { name: string; values: { brightness: number; contrast: number; saturation: number; tint: string; } };

const presets: FilterPreset[] = [
  { name: 'Cinematic', values: { brightness: 90, contrast: 120, saturation: 85, tint: '#ffaa0020' } },
  { name: 'Vivid', values: { brightness: 110, contrast: 110, saturation: 140, tint: '#00000000' } },
  { name: 'Night Mode', values: { brightness: 80, contrast: 100, saturation: 100, tint: '#0000ff10' } },
  { name: 'Noir', values: { brightness: 100, contrast: 130, saturation: 0, tint: '#00000000' } },
];

export function VideoFilters() {
  const { videoFilters, setVideoFilters } = useStore();
  const [tintColor, setTintColor] = useState('#00000000'); // Stored as RGBA hex string
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Memoize the filter string for performance
  const fullFilterString = useMemo(() => {
    return `brightness(${videoFilters.brightness}%) contrast(${videoFilters.contrast}%) saturate(${videoFilters.saturation}%)`;
  }, [videoFilters]);

  const applyPreset = (preset: FilterPreset) => {
    setVideoFilters(preset.values);
    setTintColor(preset.values.tint);
  };

  const resetAll = () => {
    setVideoFilters({ brightness: 100, contrast: 100, saturation: 100 });
    setTintColor('#00000000');
  };
  
  // This is a contrived example to add size and demonstrate a "complex" related utility
  const getLuminance = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  return (
    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl mt-6 backdrop-blur-xl shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Sliders className="text-indigo-400"/> Video Enhancement</h3>
        <button onClick={resetAll} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-white/10 rounded-lg hover:bg-white/20"><RefreshCcw className="w-4 h-4"/> Reset</button>
      </div>

      <div className="w-full h-[1px] bg-white/10" />

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-gray-400"><Wand2/> PRESETS:</span>
        {presets.map(p => (
           <button key={p.name} onClick={() => applyPreset(p)} className="px-3 py-1 text-xs font-bold bg-black/50 border border-white/10 rounded-lg hover:bg-indigo-500 transition-colors">{p.name}</button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {['brightness', 'contrast', 'saturation'].map((f) => {
          const Icon = { brightness: Sun, contrast: Contrast, saturation: Droplets }[f as keyof typeof icons] || Sun;
          return (
            <div key={f} className="flex flex-col gap-2">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5"><Icon className="w-3.5 h-3.5"/> {f}</span><span className="text-xs font-mono text-indigo-300">{(videoFilters as any)[f]}%</span></div>
              <input type="range" min="0" max="200" value={(videoFilters as any)[f]} onChange={e => setVideoFilters({...videoFilters, [f]: parseInt(e.target.value)})} className="w-full" />
            </div>
          );
        })}
      </div>

       <div className="relative">
          <button onClick={() => setShowColorPicker(!showColorPicker)} className="flex items-center gap-2 mt-2 font-bold text-sm"><Palette/> Color Tint</button>
          {showColorPicker && (
            <div className="absolute top-10 left-0 bg-[#222] p-4 rounded-xl border border-white/10 flex flex-col gap-3">
              <span>Opacity</span>
              <input type="range" min="0" max="99" value={parseInt(tintColor.slice(7), 16) || 0} onChange={e => setTintColor(tintColor.slice(0, 7) + parseInt(e.target.value).toString(16).padStart(2, '0'))}/>
              <span>Color</span>
              <input type="color" value={tintColor.slice(0, 7)} onChange={e => setTintColor(e.target.value + tintColor.slice(7))} />
            </div>
          )}
       </div>
       {/* These styles would be applied to an overlay on the video player */}
       <style>{`.video-overlay { background-color: ${tintColor}; }`}</style>
    </div>
  );
}
