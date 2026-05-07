import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Profile { id: string; name: string; avatar: string; pin?: string; hasBiometrics?: boolean; }
interface VideoFilters { brightness: number; contrast: number; saturation: number; sepia: number; }
interface AudioFilters { bands: number[]; spatialAudio: boolean; preset: string; }

interface AppState {
  profiles: Profile[];
  activeProfile: Profile | null;
  themeColor: string;
  spoilerFree: boolean;
  videoFilters: VideoFilters;
  audioFilters: AudioFilters;
  watchlist: any[];
  history: any[];
  stats: { hoursWatched: number, movies: number, episodes: number };
  batterySaver: boolean;
  
  setProfile: (p: Profile | null) => void;
  addProfile: (p: Profile) => void;
  removeProfile: (id: string) => void;
  setThemeColor: (color: string) => void;
  toggleSpoilerFree: () => void;
  setVideoFilters: (filters: VideoFilters) => void;
  setAudioFilters: (filters: Partial<AudioFilters>) => void;
  toggleWatchlist: (m: any) => void;
  addToHistory: (m: any) => void;
  toggleBatterySaver: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      profiles:[{ id: '1', name: 'Master Control', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Master' }],
      activeProfile: null,
      themeColor: '#4f46e5',
      spoilerFree: false,
      videoFilters: { brightness: 100, contrast: 100, saturation: 100, sepia: 0 },
      audioFilters: { bands:[0, 0, 0, 0, 0], spatialAudio: false, preset: 'Flat' },
      watchlist:[], history:[],
      stats: { hoursWatched: 0, movies: 0, episodes: 0 },
      batterySaver: false,
      
      setProfile: (p) => set({ activeProfile: p }),
      addProfile: (p) => set({ profiles: [...get().profiles, p] }),
      removeProfile: (id) => set({ profiles: get().profiles.filter(p => p.id !== id), activeProfile: null }),
      setThemeColor: (color) => { set({ themeColor: color }); if(typeof document !== 'undefined') document.documentElement.style.setProperty('--theme-color', color); },
      toggleSpoilerFree: () => set({ spoilerFree: !get().spoilerFree }),
      setVideoFilters: (f) => set({ videoFilters: f }),
      setAudioFilters: (f) => set({ audioFilters: { ...get().audioFilters, ...f } }),
      toggleBatterySaver: () => set({ batterySaver: !get().batterySaver }),
      
      toggleWatchlist: (m) => {
        const list = get().watchlist;
        if(list.find(x => x.id === m.id)) set({ watchlist: list.filter(x => x.id !== m.id) });
        else set({ watchlist:[m, ...list] });
      },
      addToHistory: (m) => {
        const h = get().history.filter(x => x.id !== m.id);
        const st = get().stats;
        const newStats = { movies: m.type==='movie' ? st.movies+1 : st.movies, episodes: m.type==='tv' ? st.episodes+1 : st.episodes, hoursWatched: st.hoursWatched + (m.runtime ? m.runtime/60 : 1.0) };
        set({ history:[{ ...m, watchedAt: Date.now(), bookmark: 0 }, ...h].slice(0, 100), stats: newStats });
      }
    }),
    { name: 'omnimux-system-core-v12' }
  )
);
