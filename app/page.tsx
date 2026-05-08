'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { HeroCarousel } from '@/components/HeroCarousel';
import { MovieCard } from '@/components/MovieCard';
import { useStore } from '@/store/useStore';
import {
  Film, TrendingUp, Compass, Zap, Search, Sparkles, Globe, Terminal,
  Server, Star, Clock, Eye, Heart, BarChart3, Flame, Rocket,
  Music2, Ghost, Sword, BookOpen, Laugh, Trophy, Grid3X3, List,
  Shuffle, Download, Bell, ChevronRight, ChevronLeft, SlidersHorizontal,
  Radio, Clapperboard, Target, Gamepad2, Atom, Palette, Mic2,
  TrendingDown, Award, Calendar, MapPin, Users, Tv2, Play, X,
  RefreshCw, Filter, LayoutGrid, ArrowUpRight, Layers, Wifi,
  Volume2, Settings2, Hash, Activity, Wand2, Telescope, Fingerprint,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const SECTION_CONFIGS = [
  { key: 'trending',      title: 'GLOBAL HEAT',         icon: Flame,      color: 'text-rose-400',   accent: '#f43f5e', endpoint: '/trending/all/week' },
  { key: 'topRated',      title: 'CRITICALLY ACCLAIMED', icon: Trophy,     color: 'text-amber-400',  accent: '#f59e0b', endpoint: '/movie/top_rated' },
  { key: 'sciFi',         title: 'SCI-FI FRONTIER',     icon: Atom,       color: 'text-cyan-400',   accent: '#22d3ee', endpoint: '/discover/movie&with_genres=878' },
  { key: 'action',        title: 'ACTION OVERDRIVE',    icon: Sword,      color: 'text-orange-400', accent: '#fb923c', endpoint: '/discover/movie&with_genres=28&sort_by=popularity.desc' },
  { key: 'horror',        title: 'FEAR FREQUENCY',      icon: Ghost,      color: 'text-purple-400', accent: '#a855f7', endpoint: '/discover/movie&with_genres=27&sort_by=vote_average.desc&vote_count.gte=1000' },
  { key: 'comedy',        title: 'LAUGH CIRCUIT',       icon: Laugh,      color: 'text-yellow-400', accent: '#facc15', endpoint: '/discover/movie&with_genres=35&sort_by=popularity.desc' },
  { key: 'nowStreaming',  title: 'NOW STREAMING',       icon: Radio,      color: 'text-green-400',  accent: '#4ade80', endpoint: '/movie/now_playing' },
  { key: 'upcoming',     title: 'INCOMING SIGNALS',    icon: Rocket,     color: 'text-sky-400',    accent: '#38bdf8', endpoint: '/movie/upcoming' },
  { key: 'tvTrending',   title: 'TV PULSE',            icon: Tv2,        color: 'text-fuchsia-400',accent: '#e879f9', endpoint: '/trending/tv/week' },
  { key: 'documentary',  title: 'TRUTH ARCHIVE',       icon: BookOpen,   color: 'text-teal-400',   accent: '#2dd4bf', endpoint: '/discover/movie&with_genres=99&sort_by=vote_average.desc&vote_count.gte=500' },
  { key: 'music',        title: 'SONIC CINEMA',        icon: Music2,     color: 'text-pink-400',   accent: '#f472b6', endpoint: '/discover/movie&with_genres=10402' },
  { key: 'animation',    title: 'ANIMATED WORLDS',     icon: Palette,    color: 'text-lime-400',   accent: '#a3e635', endpoint: '/discover/movie&with_genres=16&sort_by=vote_average.desc&vote_count.gte=1000' },
];

const MODULE_CONFIGS = [
  { href: '/discover', icon: Telescope,   label: 'DISCOVER',    sub: 'Matrix Engine',   gradient: 'from-indigo-600 to-violet-600',  glow: 'rgba(99,102,241,0.4)' },
  { href: '/ai-search', icon: Wand2,      label: 'AI SEARCH',   sub: 'Semantic Neural', gradient: 'from-fuchsia-600 to-pink-600',   glow: 'rgba(217,70,239,0.4)' },
  { href: '/browser',  icon: Globe,       label: 'BROWSER',     sub: 'Neural Proxy',    gradient: 'from-cyan-600 to-sky-600',       glow: 'rgba(6,182,212,0.4)'  },
  { href: '/terminal', icon: Terminal,    label: 'TERMINAL',    sub: 'OS Core',         gradient: 'from-emerald-600 to-green-600',  glow: 'rgba(16,185,129,0.4)' },
  { href: '/admin',    icon: Server,      label: 'ADMIN',       sub: 'Control Layer',   gradient: 'from-rose-600 to-red-600',       glow: 'rgba(244,63,94,0.4)'  },
  { href: '/wrapped',  icon: Award,       label: 'WRAPPED',     sub: 'Year in Review',  gradient: 'from-amber-600 to-orange-600',   glow: 'rgba(245,158,11,0.4)' },
];

const QUICK_ACTIONS = [
  { label: 'Shuffle Play',    icon: Shuffle,    action: 'shuffle',    color: 'from-violet-500 to-purple-600' },
  { label: 'Continue',        icon: Play,       action: 'continue',   color: 'from-green-500 to-emerald-600' },
  { label: 'My Watchlist',    icon: Heart,      action: 'watchlist',  color: 'from-rose-500 to-pink-600'    },
  { label: 'Downloads',       icon: Download,   action: 'downloads',  color: 'from-sky-500 to-blue-600'     },
  { label: 'Notifications',   icon: Bell,       action: 'notifs',     color: 'from-amber-500 to-yellow-600' },
  { label: 'Stats',           icon: BarChart3,  action: 'stats',      color: 'from-teal-500 to-cyan-600'   },
];

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

/** Horizontal scrollable row of MovieCards with scroll arrows */
function ContentRow({ config, data }: { config: typeof SECTION_CONFIGS[0]; data: any[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [visibleCount, setVisibleCount] = useState(20);
  const IconComp = config.icon;

  const checkScroll = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const el = rowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'right' ? 900 : -900, behavior: 'smooth' });
  };

  if (!data?.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mb-16 group/section"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 blur-xl rounded-full opacity-60" style={{ background: config.accent }} />
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
              <IconComp className={`w-5 h-5 ${config.color}`} />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-[0.15em] text-white">{config.title}</h2>
            <p className="text-xs text-white/30 tracking-widest font-mono">{data.length} TITLES LOADED</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/discover?section=${config.key}`}
            className="text-xs tracking-widest text-white/40 hover:text-white/80 transition-colors flex items-center gap-1 font-mono group"
          >
            VIEW ALL <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
          <div className="flex gap-1">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Accent bar */}
      <div className="h-px mb-6 rounded-full" style={{ background: `linear-gradient(to right, ${config.accent}40, transparent)` }} />

      {/* Scrollable Row */}
      <div className="relative">
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar px-1 -mx-1 scroll-smooth"
          style={{ scrollbarWidth: 'thin' }}
        >
          {data.slice(0, visibleCount).map((m: any, i: number) => (
            <motion.div
              key={`${m.id}-${i}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.5), ease: 'easeOut' }}
              className="flex-none"
            >
              <MovieCard movie={m} />
            </motion.div>
          ))}
          {/* Load More */}
          {visibleCount < data.length && (
            <div className="flex-none flex items-center">
              <button
                onClick={() => setVisibleCount(c => c + 20)}
                className="min-w-[160px] h-full min-h-[280px] rounded-2xl border border-white/10 bg-white/3 flex flex-col items-center justify-center gap-3 hover:bg-white/8 hover:border-white/20 transition-all group/more"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover/more:scale-110 transition-transform">
                  <ChevronRight className="w-5 h-5 text-white/50" />
                </div>
                <span className="text-xs tracking-widest text-white/30 font-mono">LOAD MORE</span>
              </button>
            </div>
          )}
        </div>
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-[#030508] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-[#030508] to-transparent z-10" />
      </div>
    </motion.section>
  );
}

/** System module navigation card */
function ModuleCard({ mod, index }: { mod: typeof MODULE_CONFIGS[0]; index: number }) {
  const [hovered, setHovered] = useState(false);
  const IconComp = mod.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={mod.href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative block rounded-2xl overflow-hidden border border-white/8 bg-white/[0.025] group hover:border-white/20 transition-all duration-500 hover:-translate-y-1"
      >
        {/* Glow bg */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
          style={{ background: `radial-gradient(circle at 50% 0%, ${mod.glow} 0%, transparent 70%)` }}
        />
        {/* Gradient bar */}
        <div className={`h-0.5 w-full bg-gradient-to-r ${mod.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

        <div className="relative p-6 flex flex-col gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <IconComp className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-black tracking-[0.2em] text-white/40 font-mono mb-1">{mod.sub}</p>
            <h3 className="text-base font-black tracking-widest text-white">{mod.label}</h3>
          </div>
          <div className="flex items-center gap-1 text-white/30 group-hover:text-white/60 transition-colors">
            <span className="text-xs font-mono tracking-wider">ENTER MODULE</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/** Live activity feed ticker */
function ActivityTicker({ items }: { items: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 3500);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) return null;

  return (
    <div className="flex items-center gap-3 py-2 px-4 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 flex-none">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] font-black tracking-[0.2em] text-white/30 font-mono">LIVE</span>
      </div>
      <div className="h-4 w-px bg-white/10" />
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="text-xs text-white/50 truncate font-mono"
        >
          {items[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/** Stats dashboard strip */
function StatsDashboard({ stats, watchlistCount, historyCount }: {
  stats: { hoursWatched: number; movies: number; episodes: number };
  watchlistCount: number;
  historyCount: number;
}) {
  const statsItems = [
    { label: 'HRS WATCHED', value: stats.hoursWatched.toFixed(1), icon: Clock,     color: 'text-violet-400' },
    { label: 'MOVIES',      value: stats.movies,                  icon: Film,      color: 'text-rose-400'   },
    { label: 'EPISODES',    value: stats.episodes,                icon: Tv2,       color: 'text-cyan-400'   },
    { label: 'WATCHLIST',   value: watchlistCount,                icon: Heart,     color: 'text-pink-400'   },
    { label: 'HISTORY',     value: historyCount,                  icon: Eye,       color: 'text-amber-400'  },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="grid grid-cols-5 gap-3 mb-10"
    >
      {statsItems.map((s, i) => {
        const IconComp = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className="relative overflow-hidden rounded-2xl bg-white/[0.025] border border-white/8 p-4 group hover:border-white/15 transition-all duration-300"
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <IconComp className={`w-4 h-4 ${s.color} mb-2 opacity-70 group-hover:opacity-100 transition-opacity`} />
            <div className="text-2xl font-black text-white tabular-nums">{s.value}</div>
            <div className="text-[9px] font-black tracking-[0.2em] text-white/25 font-mono mt-0.5">{s.label}</div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/** Quick action bar */
function QuickActions({ onAction }: { onAction: (a: string) => void }) {
  return (
    <div className="flex gap-3 flex-wrap mb-10">
      {QUICK_ACTIONS.map((qa, i) => {
        const IconComp = qa.icon;
        return (
          <motion.button
            key={qa.action}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onAction(qa.action)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${qa.color} text-white text-xs font-black tracking-widest shadow-lg hover:shadow-xl hover:brightness-110 transition-all duration-200`}
          >
            <IconComp className="w-4 h-4" />
            {qa.label}
          </motion.button>
        );
      })}
    </div>
  );
}

/** Watchlist / Continue Watching panel */
function PersonalPanel({ history, watchlist }: { history: any[]; watchlist: any[] }) {
  const [tab, setTab] = useState<'continue' | 'watchlist'>('continue');
  const items = tab === 'continue' ? history.slice(0, 10) : watchlist.slice(0, 10);

  if (!history.length && !watchlist.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-16 rounded-3xl bg-white/[0.02] border border-white/8 p-6 overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {(['continue', 'watchlist'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all ${
                tab === t ? 'bg-white text-black' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {t === 'continue' ? 'CONTINUE WATCHING' : 'MY WATCHLIST'}
            </button>
          ))}
        </div>
        <span className="text-xs text-white/25 font-mono tracking-wider">{items.length} ITEMS</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
        {items.length === 0 ? (
          <div className="w-full py-8 text-center text-white/20 text-sm font-mono tracking-wider">NO ITEMS YET</div>
        ) : items.map((m: any, i: number) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex-none"
          >
            <MovieCard movie={m} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/** Genre heatmap — visual genre breakdown of watching history */
function GenreHeatmap({ history }: { history: any[] }) {
  const GENRE_MAP: Record<number, { name: string; color: string }> = {
    28: { name: 'Action', color: '#f97316' }, 35: { name: 'Comedy', color: '#facc15' },
    18: { name: 'Drama', color: '#a855f7' }, 27: { name: 'Horror', color: '#ef4444' },
    878: { name: 'Sci-Fi', color: '#22d3ee' }, 10749: { name: 'Romance', color: '#f472b6' },
    80: { name: 'Crime', color: '#6b7280' }, 14: { name: 'Fantasy', color: '#8b5cf6' },
    12: { name: 'Adventure', color: '#34d399' }, 16: { name: 'Animation', color: '#fb7185' },
  };
  const counts = useMemo(() => {
    const map: Record<number, number> = {};
    history.forEach(m => (m.genre_ids || []).forEach((gid: number) => { map[gid] = (map[gid] || 0) + 1; }));
    return Object.entries(map).map(([id, count]) => ({ id: +id, count, ...(GENRE_MAP[+id] || { name: 'Other', color: '#64748b' }) })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [history]);

  if (!counts.length) return null;
  const max = counts[0].count;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-16 rounded-3xl bg-white/[0.02] border border-white/8 p-6"
    >
      <h2 className="text-sm font-black tracking-[0.2em] text-white/40 font-mono mb-4">YOUR GENRE DNA</h2>
      <div className="space-y-3">
        {counts.map((g, i) => (
          <div key={g.id} className="flex items-center gap-4">
            <span className="text-xs font-mono text-white/40 w-20 text-right">{g.name}</span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(g.count / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: g.color }}
              />
            </div>
            <span className="text-xs font-mono text-white/30 w-6 text-right">{g.count}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/** Animated ambient background particles */
function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl opacity-[0.04]"
          style={{
            width: `${200 + i * 80}px`,
            height: `${200 + i * 80}px`,
            left: `${(i * 17) % 90}%`,
            top: `${(i * 23) % 80}%`,
            background: ['#6366f1','#ec4899','#06b6d4','#8b5cf6','#f59e0b','#10b981'][i],
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 15, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 15 + i * 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 2,
          }}
        />
      ))}
    </div>
  );
}

/** Shuffle modal — pick a random movie */
function ShuffleModal({ movies, onClose }: { movies: any[]; onClose: () => void }) {
  const [pick, setPick] = useState<any | null>(null);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    setSpinning(true);
    setTimeout(() => {
      const pool = movies.filter(m => m.poster_path);
      setPick(pool[Math.floor(Math.random() * pool.length)]);
      setSpinning(false);
    }, 800);
  };

  useEffect(() => { spin(); }, []);

  const type = pick?.media_type || (pick?.first_air_date ? 'tv' : 'movie');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-[#0d0d14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shuffle className="w-5 h-5 text-violet-400" />
            <h3 className="font-black tracking-widest text-sm">SHUFFLE PLAY</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {spinning ? (
              <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-48 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}>
                  <Shuffle className="w-10 h-10 text-violet-400" />
                </motion.div>
              </motion.div>
            ) : pick ? (
              <motion.div key={pick.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <img
                  src={`https://image.tmdb.org/t/p/w500${pick.poster_path}`}
                  alt={pick.title || pick.name}
                  className="w-32 mx-auto rounded-2xl shadow-2xl mb-4 border border-white/10"
                />
                <h4 className="text-xl font-black text-white mb-1">{pick.title || pick.name}</h4>
                <p className="text-sm text-white/40 mb-6 line-clamp-2">{pick.overview}</p>
                <div className="flex gap-3 justify-center">
                  <Link
                    href={`/movie/${pick.id}?type=${type}`}
                    className="px-6 py-2.5 bg-white text-black font-black text-sm rounded-xl hover:scale-105 transition-transform"
                  >
                    WATCH NOW
                  </Link>
                  <button
                    onClick={spin}
                    className="px-6 py-2.5 bg-white/8 border border-white/10 font-black text-sm rounded-xl hover:bg-white/15 transition-colors"
                  >
                    RESHUFFLE
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Notification center */
function NotificationCenter({ onClose }: { onClose: () => void }) {
  const MOCK_NOTIFS = [
    { id: 1, type: 'new',      msg: 'New episodes of trending TV shows added',       time: '2m ago',  icon: Tv2,     color: 'text-cyan-400'   },
    { id: 2, type: 'system',   msg: 'OmegaShield blocked 47 trackers today',          time: '15m ago', icon: Fingerprint, color: 'text-green-400' },
    { id: 3, type: 'recommend',msg: 'AI picked 3 new films for your taste profile',   time: '1h ago',  icon: Sparkles,color: 'text-violet-400' },
    { id: 4, type: 'update',   msg: 'Server pool updated — 12 new stream sources',    time: '3h ago',  icon: Server,  color: 'text-amber-400'  },
    { id: 5, type: 'watchlist',msg: 'Inception (2010) is now in HD on 4 servers',     time: '5h ago',  icon: Heart,   color: 'text-pink-400'   },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-start justify-end p-6 pt-20"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 60, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-[#0d0d14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-5 border-b border-white/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="font-black tracking-widest text-xs">NOTIFICATIONS</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="divide-y divide-white/5 max-h-96 overflow-y-auto custom-scrollbar">
          {MOCK_NOTIFS.map((n, i) => {
            const NIcon = n.icon;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-4 hover:bg-white/3 transition-colors cursor-pointer"
              >
                <div className={`mt-0.5 flex-none w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center`}>
                  <NIcon className={`w-4 h-4 ${n.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/70 leading-relaxed">{n.msg}</p>
                  <p className="text-[10px] text-white/25 font-mono mt-1">{n.time}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Sticky top status bar */
function StatusBar({ trendingCount, serverStatus }: { trendingCount: number; serverStatus: boolean }) {
  const TICKERS = [
    `${trendingCount} trending titles loaded`,
    'OmegaShield: ACTIVE — 0 threats',
    'Stream servers: ONLINE',
    'TMDB sync: OK',
    'Watch Party: READY',
  ];

  return (
    <div className="sticky top-0 z-50 mb-6 -mx-6 px-6 py-2 bg-[#030508]/95 backdrop-blur-2xl border-b border-white/[0.04] flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-none">
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${serverStatus ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-[9px] font-black tracking-[0.25em] text-white/30 font-mono">OMNIMUX</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <ActivityTicker items={TICKERS} />
      </div>
      <div className="flex-none flex items-center gap-2 text-[9px] font-mono text-white/20 tracking-widest">
        <Wifi className="w-3 h-3" />
        <span>LIVE</span>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Home() {
  // ── State ──
  const [sections, setSections] = useState<Record<string, any[]>>({});
  const [loadedSections, setLoadedSections] = useState(new Set<string>());
  const [loadingAll, setLoadingAll] = useState(true);
  const [activeModal, setActiveModal] = useState<'shuffle' | 'notifications' | 'stats' | null>(null);
  const [viewMode, setViewMode] = useState<'rows' | 'grid'>('rows');
  const [serverStatus, setServerStatus] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounce = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  const { history, watchlist, stats, activeProfile } = useStore();

  // ── Scroll parallax ──
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 200], [1, 0]);

  // ── Initial data load ──
  useEffect(() => {
    const firstBatch = SECTION_CONFIGS.slice(0, 4);
    const secondBatch = SECTION_CONFIGS.slice(4);

    const loadBatch = async (configs: typeof SECTION_CONFIGS) => {
      const results = await Promise.allSettled(
        configs.map(c =>
          fetch(`/api/tmdb?endpoint=/${c.endpoint.replace('&', '&')}`).then(r => r.json())
        )
      );
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          setSections(prev => ({ ...prev, [configs[i].key]: r.value.results || [] }));
          setLoadedSections(prev => new Set([...prev, configs[i].key]));
        }
      });
    };

    loadBatch(firstBatch).then(() => {
      setLoadingAll(false);
      loadBatch(secondBatch);
    }).catch(() => setLoadingAll(false));
  }, []);

  // ── Search ──
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const r = await fetch(`/api/tmdb?endpoint=/search/multi&query=${encodeURIComponent(searchQuery)}`);
        const d = await r.json();
        setSearchResults(d.results || []);
      } catch {}
      setIsSearching(false);
    }, 400);
  }, [searchQuery]);

  const handleAction = useCallback((action: string) => {
    if (action === 'shuffle') setActiveModal('shuffle');
    else if (action === 'notifs') setActiveModal('notifications');
    else if (action === 'stats') setActiveModal('stats');
    else if (action === 'watchlist') { /* handled inline */ }
  }, []);

  // ── Flatten all movies for shuffle ──
  const allMovies = useMemo(() =>
    Object.values(sections).flat().filter((m: any) => m?.poster_path),
    [sections]
  );

  // ── Filtered sections by category ──
  const visibleSections = useMemo(() =>
    activeCategory ? SECTION_CONFIGS.filter(c => c.key === activeCategory) : SECTION_CONFIGS,
    [activeCategory]
  );

  if (!activeProfile) return null;

  return (
    <div className="min-h-screen bg-[#030508] relative" ref={containerRef}>
      <AmbientBackground />

      {/* ── HERO ── */}
      <HeroCarousel movies={sections.trending || []} />

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-[1900px] mx-auto px-6 -mt-32 relative z-20">

        {/* Status bar */}
        <StatusBar trendingCount={sections.trending?.length || 0} serverStatus={serverStatus} />

        {/* Quick actions */}
        <QuickActions onAction={handleAction} />

        {/* Stats dashboard */}
        <StatsDashboard stats={stats} watchlistCount={watchlist.length} historyCount={history.length} />

        {/* ── SEARCH BAR ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative mb-10"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Quick search movies, shows, actors..."
              className="w-full bg-white/[0.025] border border-white/10 rounded-2xl pl-12 pr-16 py-4 text-white placeholder-white/25 text-sm font-mono tracking-wider focus:outline-none focus:border-white/25 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors">
                <X className="w-3.5 h-3.5 text-white/60" />
              </button>
            )}
            {isSearching && (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="absolute right-14 top-1/2 -translate-y-1/2">
                <RefreshCw className="w-4 h-4 text-white/30" />
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {searchResults.length > 0 && searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 top-full mt-2 bg-[#0d0d16] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-80 overflow-y-auto custom-scrollbar"
              >
                {searchResults.slice(0, 8).map((r: any) => {
                  const t = r.media_type || (r.first_air_date ? 'tv' : 'movie');
                  return (
                    <Link key={r.id} href={`/movie/${r.id}?type=${t}`} onClick={() => setSearchQuery('')}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors group"
                    >
                      <img
                        src={r.poster_path ? `https://image.tmdb.org/t/p/w92${r.poster_path}` : '/placeholder.png'}
                        className="w-10 h-14 rounded-lg object-cover bg-white/5"
                        alt=""
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{r.title || r.name}</p>
                        <p className="text-[10px] text-white/30 font-mono tracking-wider uppercase">{t} · {r.release_date?.slice(0,4) || r.first_air_date?.slice(0,4) || '—'}</p>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400 text-xs flex-none">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{r.vote_average?.toFixed(1)}</span>
                      </div>
                    </Link>
                  );
                })}
                <Link
                  href={`/ai-search?q=${encodeURIComponent(searchQuery)}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-t border-white/5 text-xs text-white/40 hover:text-white/70 transition-colors font-mono tracking-wider"
                >
                  <Sparkles className="w-3.5 h-3.5" /> SEARCH WITH AI
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── SYSTEM MODULES ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <Layers className="w-5 h-5 text-white/40" />
            <h2 className="text-sm font-black tracking-[0.2em] text-white/40 font-mono">SYSTEM MODULES</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {MODULE_CONFIGS.map((mod, i) => (
              <ModuleCard key={mod.href} mod={mod} index={i} />
            ))}
          </div>
        </motion.section>

        {/* ── PERSONAL PANEL ── */}
        <PersonalPanel history={history} watchlist={watchlist} />

        {/* ── GENRE DNA ── */}
        {history.length > 2 && <GenreHeatmap history={history} />}

        {/* ── SECTION CATEGORY FILTER ── */}
        <div className="flex items-center gap-3 mb-10 flex-wrap">
          <Filter className="w-4 h-4 text-white/30 flex-none" />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-[0.15em] transition-all ${
                !activeCategory ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/8'
              }`}
            >
              ALL
            </button>
            {SECTION_CONFIGS.map(s => {
              const IconComp = s.icon;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveCategory(activeCategory === s.key ? null : s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-[0.15em] transition-all ${
                    activeCategory === s.key
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/8'
                  }`}
                >
                  <IconComp className="w-3 h-3" />
                  {s.title.split(' ')[0]}
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => setViewMode('rows')}
              className={`p-2 rounded-lg border transition-all ${viewMode === 'rows' ? 'bg-white/10 border-white/20' : 'bg-white/3 border-white/8 hover:bg-white/7'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border transition-all ${viewMode === 'grid' ? 'bg-white/10 border-white/20' : 'bg-white/3 border-white/8 hover:bg-white/7'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── CONTENT SECTIONS ── */}
        {loadingAll ? (
          <div className="space-y-16">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-6 w-48 bg-white/5 rounded-lg mb-6" />
                <div className="flex gap-4">
                  {[...Array(8)].map((_, j) => (
                    <div key={j} className="flex-none w-44 h-64 bg-white/5 rounded-2xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'rows' ? (
          visibleSections.map(config => (
            sections[config.key]?.length ? (
              <ContentRow key={config.key} config={config} data={sections[config.key]} />
            ) : null
          ))
        ) : (
          /* Grid mode — show all sections merged */
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {visibleSections.flatMap(c => sections[c.key] || []).filter((m: any, i, arr) => arr.findIndex((x: any) => x.id === m.id) === i).map((m: any, i: number) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.02, 0.5) }}
              >
                <MovieCard movie={m} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── FOOTER CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 mb-8 rounded-3xl overflow-hidden relative bg-gradient-to-br from-indigo-950/80 to-violet-950/80 border border-indigo-500/20 p-10 text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.2)_0%,transparent_60%)]" />
          <div className="relative z-10">
            <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">Discover More with AI</h2>
            <p className="text-white/50 mb-6 max-w-md mx-auto">Let our neural search engine find your perfect next watch based on mood, themes, and your taste profile.</p>
            <Link
              href="/ai-search"
              className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-black px-8 py-3 rounded-2xl transition-colors"
            >
              <Sparkles className="w-4 h-4" /> LAUNCH AI SEARCH
            </Link>
          </div>
        </motion.div>
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {activeModal === 'shuffle' && <ShuffleModal movies={allMovies} onClose={() => setActiveModal(null)} />}
        {activeModal === 'notifications' && <NotificationCenter onClose={() => setActiveModal(null)} />}
      </AnimatePresence>
    </div>
  );
}
