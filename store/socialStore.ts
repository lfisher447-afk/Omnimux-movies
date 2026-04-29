import { create } from 'zustand';

interface SocialState {
  globalChat: { user: string, msg: string, time: number }[];
  addGlobalMsg: (user: string, msg: string) => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  globalChat:[{ user: 'System', msg: 'Welcome to Global Chat!', time: Date.now() }],
  addGlobalMsg: (user, msg) => set({ globalChat:[...get().globalChat, { user, msg, time: Date.now() }].slice(-50) })
}));
