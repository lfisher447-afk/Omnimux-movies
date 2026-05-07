'use client';
import { useStore } from '@/store/useStore';
import { Waves, RefreshCcw, AudioLines, Headphones } from 'lucide-react';

const EQ_FREQS =[60, 230, 910, 3600, 14000];
const presets =[
  { name: 'Flat', values: { bands:[0, 0, 0, 0, 0], spatialAudio: false, preset: 'Flat' } },
  { name: 'Dolby Atmos', values: { bands:[6, 2, 0, 4, 7], spatialAudio: true, preset: 'Dolby Atmos' } },
  { name: 'Bass Boost', values: { bands:[8, 5, 0, -2, -2], spatialAudio: false, preset: 'Bass Boost' } },
  { name: 'Vocal Clarity', values: { bands:[-2, -1, 3, 4, 1], spatialAudio: false, preset: 'Vocal Clarity' } },
];

export function AudioFilters() {
  const { audioFilters, setAudioFilters } = useStore();

  const resetAll = () => setAudioFilters(presets[0].values);

  const handleBandChange = (index: number, val: number) => {
    const newBands = [...audioFilters.bands];
    newBands[index] = val;
    setAudioFilters({ bands: newBands, preset: 'Custom' });
  };

  return (
    <div className="glass-panel p-8 rounded-[32px] mt-8 flex flex-col gap-6 w-full shadow-2xl relative overflow-hidden">
      {/* Atmos background glow if active */}
      {audioFilters.spatialAudio && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-500/10 blur-[120px] pointer-events-none rounded-full" />
      )}

      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <h3 className="text-xl font-black text-white flex items-center gap-3">
            <AudioLines className="text-fuchsia-400 w-6 h-6"/> Neural Audio DSP
        </h3>
        <button onClick={resetAll} className="flex items-center gap-2 text-sm px-4 py-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors font-bold"><RefreshCcw className="w-4 h-4"/> Flush</button>
      </div>

      <div className="flex items-center gap-3 flex-wrap relative z-10">
        <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase flex items-center gap-2"><Waves className="w-3 h-3"/> Profiles</span>
        {presets.map(p => (
           <button 
                key={p.name} 
                onClick={() => setAudioFilters(p.values)} 
                className={`px-4 py-1.5 text-xs font-bold border rounded-lg transition-all shadow-sm ${audioFilters.preset === p.name ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300' : 'bg-[#111] border-white/10 text-gray-400 hover:border-fuchsia-400 hover:text-white'}`}>
                {p.name}
           </button>
        ))}

        <button 
            onClick={() => setAudioFilters({ spatialAudio: !audioFilters.spatialAudio })} 
            className={`ml-auto px-5 py-2 text-xs font-black uppercase tracking-widest border rounded-xl transition-all duration-300 shadow-lg flex items-center gap-2 ${audioFilters.spatialAudio ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)] scale-105' : 'bg-black text-gray-500 border-white/10 hover:border-indigo-500 hover:text-white'}`}>
            <Headphones className={`w-4 h-4 ${audioFilters.spatialAudio ? 'animate-pulse' : ''}`}/> 
            Atmos 3D
        </button>
      </div>
      
      <div className="grid grid-cols-5 gap-4 pt-4 relative z-10">
        {EQ_FREQS.map((freq, i) => (
            <div key={freq} className="flex flex-col items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/5">
              <span className="text-[10px] font-mono font-bold text-gray-400">{freq > 999 ? (freq/1000).toFixed(1)+'k' : freq}Hz</span>
              <div className="h-24 w-8 relative flex flex-col items-center justify-center">
                 <input 
                    type="range" min="-12" max="12" step="0.5"
                    value={audioFilters.bands[i]} 
                    onChange={e => handleBandChange(i, parseFloat(e.target.value))} 
                    className="absolute w-24 h-1.5 bg-white/10 rounded-full appearance-none outline-none cursor-pointer -rotate-90 origin-center accent-fuchsia-500" 
                 />
              </div>
              <span className="text-[10px] font-black text-fuchsia-400">{audioFilters.bands[i] > 0 ? '+'+audioFilters.bands[i] : audioFilters.bands[i]} dB</span>
            </div>
        ))}
      </div>
    </div>
  );
}
