import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Profile { id: string; name: string; avatar: string; pin?: string; }

interface AppState {
  profiles: Profile[];
  activeProfile: Profile | null;
  themeColor: string;
  spoilerFree: boolean;
  videoFilters: { brightness: number, contrast: number, saturation: number };
  watchlist: any[];
  history: any[];
  stats: { hoursWatched: number, movies: number, episodes: number };
  achievements: Record<string, boolean>;
  toasts: {id:number, msg:string, type:string}[];
  
  setProfile: (p: Profile | null) => void;
  addProfile: (p: Profile) => void;
  setThemeColor: (color: string) => void;
  toggleSpoilerFree: () => void;
  setVideoFilters: (filters: any) => void;
  toggleWatchlist: (m: any) => void;
  addToHistory: (m: any) => void;
  addToast: (msg: string, type?: string) => void;
  removeToast: (id: number) => void;
  unlockAchievement: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      profiles:[{ id: '1', name: 'Admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin' }],
      activeProfile: null,
      themeColor: '#4f46e5',
      spoilerFree: false,
      videoFilters: { brightness: 100, contrast: 100, saturation: 100 },
      watchlist: [],
      history:[],
      stats: { hoursWatched: 0, movies: 0, episodes: 0 },
      achievements: {},
      toasts:[],
      
      setProfile: (p) => set({ activeProfile: p }),
      addProfile: (p) => set({ profiles: [...get().profiles, p] }),
      setThemeColor: (color) => { set({ themeColor: color }); if(typeof document !== 'undefined') document.documentElement.style.setProperty('--theme-color', color); },
      toggleSpoilerFree: () => set({ spoilerFree: !get().spoilerFree }),
      setVideoFilters: (f) => set({ videoFilters: f }),
      
      toggleWatchlist: (m) => {
        const list = get().watchlist;
        if(list.find(x => x.id === m.id)) { set({ watchlist: list.filter(x => x.id !== m.id) }); get().addToast('Removed from Watchlist', 'info'); }
        else { set({ watchlist: [m, ...list] }); get().addToast('Added to Watchlist', 'success'); }
      },
      addToHistory: (m) => {
        const h = get().history.filter(x => x.id !== m.id);
        const st = get().stats;
        const newStats = { movies: m.type==='movie' ? st.movies+1 : st.movies, episodes: m.type==='tv' ? st.episodes+1 : st.episodes, hoursWatched: st.hoursWatched + (m.runtime ? m.runtime/60 : 1.5) };
        set({ history:[{ ...m, watchedAt: Date.now() }, ...h].slice(0, 100), stats: newStats });
        if(newStats.movies === 1) get().unlockAchievement('first_watch');
        if(newStats.hoursWatched > 100) get().unlockAchievement('night_100');
      },
      addToast: (msg, type = 'info') => {
        const id = Date.now();
        set({ toasts:[...get().toasts, { id, msg, type }] });
        setTimeout(() => get().removeToast(id), 3000);
      },
      removeToast: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) }),
      unlockAchievement: (id) => {
        const ach = get().achievements;
        if (!ach[id]) { set({ achievements: { ...ach, [id]: true } }); get().addToast('Achievement Unlocked!', 'success'); }
      }
    }),
    { name: 'omnimux-vercel-storage' }
  )
);
