'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { MovieCard } from '@/components/MovieCard';
import {
  Filter, Sparkles, Loader2, Star, Calendar, TrendingUp, Clock,
  ChevronDown, ChevronUp, X, Grid3X3, List, Shuffle, SlidersHorizontal,
  Globe, Eye, Heart, Flame, BarChart3, RefreshCw, Search, ArrowUpRight,
  Sword, Ghost, Laugh, Music2, BookOpen, Atom, Palette, Rocket,
  Film, Tv2, Hash, Layers, Target, Telescope, Wand2, Activity,
  ChevronLeft, ChevronRight, Download, Share2, Bookmark, Trophy,
  MapPin, Users, Zap, ToggleLeft, Radio, Clapperboard, LayoutGrid,
} from 'lucide-react';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const GENRES = [
  { id: 0,     name: 'All',           icon: Layers,      color: '#6366f1', gradient: 'from-indigo-500 to-violet-500' },
  { id: 28,    name: 'Action',        icon: Sword,       color: '#f97316', gradient: 'from-orange-500 to-red-500'    },
  { id: 12,    name: 'Adventure',     icon: Telescope,   color: '#34d399', gradient: 'from-emerald-500 to-teal-500'  },
  { id: 16,    name: 'Animation',     icon: Palette,     color: '#fb7185', gradient: 'from-pink-500 to-rose-500'     },
  { id: 35,    name: 'Comedy',        icon: Laugh,       color: '#facc15', gradient: 'from-yellow-400 to-amber-500'  },
  { id: 80,    name: 'Crime',         icon: Target,      color: '#94a3b8', gradient: 'from-slate-500 to-gray-600'    },
  { id: 99,    name: 'Documentary',   icon: BookOpen,    color: '#60a5fa', gradient: 'from-blue-500 to-indigo-600'   },
  { id: 18,    name: 'Drama',         icon: Clapperboard,color: '#c084fc', gradient: 'from-purple-500 to-fuchsia-500'},
  { id: 10751, name: 'Family',        icon: Users,       color: '#6ee7b7', gradient: 'from-green-400 to-emerald-500' },
  { id: 14,    name: 'Fantasy',       icon: Wand2,       color: '#a78bfa', gradient: 'from-violet-500 to-purple-600' },
  { id: 36,    name: 'History',       icon: Globe,       color: '#fbbf24', gradient: 'from-amber-500 to-orange-600'  },
  { id: 27,    name: 'Horror',        icon: Ghost,       color: '#f87171', gradient: 'from-red-600 to-rose-900'      },
  { id: 10402, name: 'Music',         icon: Music2,      color: '#f472b6', gradient: 'from-pink-400 to-purple-500'   },
  { id: 9648,  name: 'Mystery',       icon: Search,      color: '#64748b', gradient: 'from-slate-600 to-slate-800'   },
  { id: 10749, name: 'Romance',       icon: Heart,       color: '#fb7185', gradient: 'from-rose-400 to-pink-500'     },
  { id: 878,   name: 'Sci-Fi',        icon: Atom,        color: '#22d3ee', gradient: 'from-cyan-400 to-blue-500'     },
  { id: 10770, name: 'TV Movie',      icon: Tv2,         color: '#818cf8', gradient: 'from-indigo-400 to-blue-500'   },
  { id: 53,    name: 'Thriller',      icon: Zap,         color: '#94a3b8', gradient: 'from-zinc-500 to-zinc-700'     },
  { id: 10752, name: 'War',           icon: Flame,       color: '#f59e0b', gradient: 'from-amber-600 to-red-700'     },
  { id: 37,    name: 'Western',       icon: MapPin,      color: '#d97706', gradient: 'from-yellow-600 to-amber-700'  },
];

const SORT_OPTIONS = [
  { value: 'popularity.desc',        label: 'Most Popular',     icon: TrendingUp  },
  { value: 'vote_average.desc',      label: 'Highest Rated',    icon: Star        },
  { value: 'release_date.desc',      label: 'Newest First',     icon: Calendar    },
  { value: 'release_date.asc',       label: 'Oldest First',     icon: Clock       },
  { value: 'revenue.desc',           label: 'Top Grossing',     icon: BarChart3   },
  { value: 'vote_count.desc',        label: 'Most Voted',       icon: Users       },
  { value: 'original_title.asc',     label: 'A → Z',            icon: Hash        },
  { value: 'primary_release_date.desc', label: 'Just Released', icon: Rocket      },
];

const MEDIA_TYPES = [
  { value: 'movie', label: 'Movies',   icon: Film },
  { value: 'tv',    label: 'TV Shows', icon: Tv2  },
];

const DECADE_FILTERS = [
  { label: 'Any Era',  gte: '',     lte: ''     },
  { label: '2020s',    gte: '2020', lte: '2029' },
  { label: '2010s',    gte: '2010', lte: '2019' },
  { label: '2000s',    gte: '2000', lte: '2009' },
  { label: '1990s',    gte: '1990', lte: '1999' },
  { label: '1980s',    gte: '1980', lte: '1989' },
  { label: 'Classic',  gte: '',     lte: '1979' },
];

const RATING_PRESETS = [
  { label: 'Any',       min: 0   },
  { label: '6+',        min: 6   },
  { label: '7+',        min: 7   },
  { label: '7.5+',      min: 7.5 },
  { label: '8+',        min: 8   },
  { label: '8.5+',      min: 8.5 },
];

const LANGUAGE_OPTIONS = [
  { value: '',   label: 'Any Language'  },
  { value: 'en', label: 'English'       },
  { value: 'fr', label: 'French'        },
  { value: 'ja', label: 'Japanese'      },
  { value: 'ko', label: 'Korean'        },
  { value: 'es', label: 'Spanish'       },
  { value: 'de', label: 'German'        },
  { value: 'it', label: 'Italian'       },
  { value: 'pt', label: 'Portuguese'    },
  { value: 'hi', label: 'Hindi'         },
  { value: 'zh', label: 'Chinese'       },
];

const RUNTIME_OPTIONS = [
  { label: 'Any Runtime',  max: 999 },
  { label: '< 90 min',     max: 90  },
  { label: '< 120 min',    max: 120 },
  { label: '< 150 min',    max: 150 },
  { label: '2h+',          max: 999, min: 120 },
];

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface FilterState {
  genres: number[];
  sort: string;
  mediaType: 'movie' | 'tv';
  decade: typeof DECADE_FILTERS[0];
  minRating: number;
  language: string;
  minVotes: number;
  runtime: typeof RUNTIME_OPTIONS[0];
  includeAdult: boolean;
  multipleGenres: boolean;
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function buildTMDBEndpoint(filters: FilterState, page: number): string {
  const base = filters.mediaType === 'movie' ? '/discover/movie' : '/discover/tv';
  const params = new URLSearchParams();
  params.set('sort_by', filters.sort);
  params.set('page', String(page));
  if (filters.genres.length && !filters.genres.includes(0)) {
    params.set('with_genres', filters.multipleGenres ? filters.genres.join(',') : String(filters.genres[0]));
  }
  if (filters.decade.gte) {
    params.set(filters.mediaType === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte', `${filters.decade.gte}-01-01`);
  }
  if (filters.decade.lte) {
    params.set(filters.mediaType === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte', `${filters.decade.lte}-12-31`);
  }
  if (filters.minRating > 0) params.set('vote_average.gte', String(filters.minRating));
  if (filters.minVotes > 0)  params.set('vote_count.gte',   String(filters.minVotes));
  if (filters.language)      params.set('with_original_language', filters.language);
  return `${base}?${params.toString()}`;
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

/** Big genre pill with icon */
function GenrePill({ genre, active, onClick }: {
  genre: typeof GENRES[0];
  active: boolean;
  onClick: () => void;
}) {
  const IconComp = genre.icon;
  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black tracking-widest transition-all duration-300 overflow-hidden border ${
        active
          ? 'border-transparent text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
          : 'bg-white/[0.025] border-white/8 text-white/40 hover:text-white/70 hover:border-white/15'
      }`}
      style={active ? {
        background: `linear-gradient(135deg, ${genre.color}CC, ${genre.color}88)`,
        boxShadow: `0 8px 24px ${genre.color}40`,
      } : undefined}
    >
      {active && <div className="absolute inset-0 bg-gradient-to-r opacity-30" style={{ background: `linear-gradient(135deg, ${genre.color}, transparent)` }} />}
      <IconComp className="w-4 h-4 relative z-10" />
      <span className="relative z-10">{genre.name}</span>
    </motion.button>
  );
}

/** Sort dropdown */
function SortDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find(s => s.value === value) || SORT_OPTIONS[0];
  const IconComp = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.025] border border-white/10 text-sm hover:border-white/20 transition-all"
      >
        <IconComp className="w-4 h-4 text-white/50" />
        <span className="font-bold text-white/80 text-xs tracking-wider">{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="absolute top-full left-0 mt-2 w-52 bg-[#0d0d16] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
          >
            {SORT_OPTIONS.map(s => {
              const SI = s.icon;
              return (
                <button
                  key={s.value}
                  onClick={() => { onChange(s.value); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs text-left hover:bg-white/5 transition-colors ${
                    value === s.value ? 'text-white' : 'text-white/50'
                  }`}
                >
                  <SI className="w-3.5 h-3.5 flex-none" />
                  <span className="font-bold tracking-wider">{s.label}</span>
                  {value === s.value && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Advanced filters drawer */
function FilterDrawer({
  filters, onChange, onClose, resultCount
}: {
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
  onClose: () => void;
  resultCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[100] flex items-start justify-end p-4 pt-16"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm h-full max-h-[calc(100vh-80px)] bg-[#0d0d16] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8 flex-none">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-violet-400" />
            <span className="font-black tracking-[0.15em] text-sm">ADVANCED FILTERS</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-white/30">{resultCount.toLocaleString()} RESULTS</span>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

          {/* Media type */}
          <FilterSection title="MEDIA TYPE" icon={Film}>
            <div className="flex gap-2">
              {MEDIA_TYPES.map(mt => {
                const MI = mt.icon;
                return (
                  <button
                    key={mt.value}
                    onClick={() => onChange({ mediaType: mt.value as 'movie' | 'tv' })}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black tracking-wider transition-all border ${
                      filters.mediaType === mt.value
                        ? 'bg-white text-black border-transparent'
                        : 'bg-white/5 text-white/40 border-white/8 hover:text-white/70'
                    }`}
                  >
                    <MI className="w-3.5 h-3.5" />{mt.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {/* Decade */}
          <FilterSection title="ERA / DECADE" icon={Calendar}>
            <div className="flex flex-wrap gap-2">
              {DECADE_FILTERS.map(d => (
                <button
                  key={d.label}
                  onClick={() => onChange({ decade: d })}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all border ${
                    filters.decade.label === d.label
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-white/5 text-white/40 border-white/8 hover:text-white/60'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Rating */}
          <FilterSection title="MIN RATING" icon={Star}>
            <div className="flex flex-wrap gap-2">
              {RATING_PRESETS.map(r => (
                <button
                  key={r.label}
                  onClick={() => onChange({ minRating: r.min })}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all border flex items-center gap-1 ${
                    filters.minRating === r.min
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : 'bg-white/5 text-white/40 border-white/8 hover:text-white/60'
                  }`}
                >
                  {r.min > 0 && <Star className="w-2.5 h-2.5" />}{r.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Language */}
          <FilterSection title="LANGUAGE" icon={Globe}>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map(l => (
                <button
                  key={l.value}
                  onClick={() => onChange({ language: l.value })}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all border ${
                    filters.language === l.value
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      : 'bg-white/5 text-white/40 border-white/8 hover:text-white/60'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Min votes */}
          <FilterSection title="MIN VOTE COUNT" icon={Users}>
            <div className="flex flex-wrap gap-2">
              {[0, 100, 500, 1000, 5000, 10000].map(v => (
                <button
                  key={v}
                  onClick={() => onChange({ minVotes: v })}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all border ${
                    filters.minVotes === v
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-white/5 text-white/40 border-white/8 hover:text-white/60'
                  }`}
                >
                  {v === 0 ? 'Any' : v.toLocaleString() + '+'}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Multi-genre toggle */}
          <FilterSection title="GENRE MATCHING" icon={Layers}>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/8">
              <div>
                <p className="text-xs font-black text-white/70 tracking-wider">Multi-Genre AND</p>
                <p className="text-[10px] text-white/30 font-mono mt-0.5">Match ALL selected genres</p>
              </div>
              <button
                onClick={() => onChange({ multipleGenres: !filters.multipleGenres })}
                className={`w-10 h-5.5 rounded-full transition-all relative ${filters.multipleGenres ? 'bg-indigo-500' : 'bg-white/15'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${filters.multipleGenres ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </FilterSection>
        </div>

        {/* Footer */}
        <div className="flex-none p-4 border-t border-white/8 flex gap-3">
          <button
            onClick={() => onChange({ genres: [0], sort: 'popularity.desc', mediaType: 'movie', decade: DECADE_FILTERS[0], minRating: 0, language: '', minVotes: 0, multipleGenres: false })}
            className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-black tracking-wider text-white/50 hover:text-white/80 hover:bg-white/8 transition-all"
          >
            RESET ALL
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white text-xs font-black tracking-wider hover:bg-indigo-400 transition-colors"
          >
            APPLY
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FilterSection({ title, icon: IconComp, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <IconComp className="w-3 h-3 text-white/30" />
        <p className="text-[9px] font-black tracking-[0.25em] text-white/30 font-mono">{title}</p>
      </div>
      {children}
    </div>
  );
}

/** Movie grid item with rank badge */
function RankedCard({ movie, rank, viewMode }: { movie: any; rank: number; viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    const type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(rank * 0.02, 0.4) }}
        className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/6 hover:bg-white/5 hover:border-white/12 transition-all group"
      >
        <span className="text-2xl font-black text-white/10 tabular-nums w-10 text-center flex-none">{rank}</span>
        <img
          src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : ''}
          className="w-12 h-16 rounded-lg object-cover bg-white/5 flex-none"
          alt=""
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm truncate">{movie.title || movie.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-white/30 font-mono">{(movie.release_date || movie.first_air_date || '').slice(0, 4)}</span>
            <span className="flex items-center gap-0.5 text-yellow-400 text-[10px]">
              <Star className="w-2.5 h-2.5 fill-current" />{movie.vote_average?.toFixed(1)}
            </span>
          </div>
        </div>
        <a
          href={`/movie/${movie.id}?type=${type}`}
          className="flex-none opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      {rank <= 10 && (
        <div className="absolute -top-2 -left-2 z-10 w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <span className="text-[9px] font-black text-black">{rank}</span>
        </div>
      )}
      <MovieCard movie={movie} />
    </div>
  );
}

/** Active filter chips */
function ActiveFilterChips({ filters, onChange }: { filters: FilterState; onChange: (f: Partial<FilterState>) => void }) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.mediaType === 'tv')       chips.push({ label: 'TV Shows',           onRemove: () => onChange({ mediaType: 'movie' }) });
  if (filters.decade.label !== 'Any Era') chips.push({ label: filters.decade.label, onRemove: () => onChange({ decade: DECADE_FILTERS[0] }) });
  if (filters.minRating > 0)           chips.push({ label: `${filters.minRating}+ ★`,  onRemove: () => onChange({ minRating: 0 }) });
  if (filters.language)                chips.push({ label: LANGUAGE_OPTIONS.find(l => l.value === filters.language)?.label || '', onRemove: () => onChange({ language: '' }) });
  if (filters.minVotes > 0)            chips.push({ label: `${filters.minVotes.toLocaleString()}+ votes`, onRemove: () => onChange({ minVotes: 0 }) });

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map(chip => (
        <motion.div
          key={chip.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[10px] font-bold tracking-wider"
        >
          {chip.label}
          <button onClick={chip.onRemove} className="w-4 h-4 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors">
            <X className="w-2.5 h-2.5" />
          </button>
        </motion.div>
      ))}
    </div>
  );
}

/** Floating genre stat bar */
function GenreStatBar({ genre, count, total }: { genre: typeof GENRES[0]; count: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono text-white/30 w-20 text-right">{genre.name}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(count / total) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: genre.color }}
        />
      </div>
      <span className="text-[10px] font-mono text-white/20 w-5 text-right">{count}</span>
    </div>
  );
}

/** Surprise me — random genre + sort */
function useSurpriseMe(onChange: (f: Partial<FilterState>) => void) {
  return useCallback(() => {
    const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
    const sort = SORT_OPTIONS[Math.floor(Math.random() * SORT_OPTIONS.length)];
    const decade = DECADE_FILTERS[Math.floor(Math.random() * DECADE_FILTERS.length)];
    onChange({ genres: [genre.id], sort: sort.value, decade });
  }, [onChange]);
}

/** Page number pill */
function PagePill({ page, active, onClick }: { page: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
        active
          ? 'bg-white text-black'
          : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80 border border-white/8'
      }`}
    >
      {page}
    </button>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function Discover() {
  const DEFAULT_FILTERS: FilterState = {
    genres:        [0],
    sort:          'popularity.desc',
    mediaType:     'movie',
    decade:        DECADE_FILTERS[0],
    minRating:     0,
    language:      '',
    minVotes:      0,
    runtime:       RUNTIME_OPTIONS[0],
    includeAdult:  false,
    multipleGenres:false,
  };

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [cardSize, setCardSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [savedFilters, setSavedFilters] = useState<{ name: string; state: FilterState }[]>([]);
  const [saveName, setSaveName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [compareList, setCompareList] = useState<any[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const updateFilters = useCallback((f: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...f }));
    setPage(1);
  }, []);

  const surpriseMe = useSurpriseMe(updateFilters);

  // ── Fetch movies ──
  useEffect(() => {
    setLoading(true);
    const endpoint = buildTMDBEndpoint(filters, page);
    fetch(`/api/tmdb?endpoint=${encodeURIComponent(endpoint)}`)
      .then(r => r.json())
      .then(d => {
        setMovies(d.results || []);
        setTotalPages(Math.min(d.total_pages || 1, 500));
        setTotalResults(d.total_results || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters, page]);

  // ── Auto-scroll to top on page change ──
  useEffect(() => {
    if (page > 1) topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [page]);

  // ── Active genre info ──
  const activeGenreObj = useMemo(() =>
    GENRES.find(g => filters.genres[0] === g.id) || GENRES[0],
    [filters.genres]
  );

  // ── Filter count ──
  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.mediaType === 'tv') c++;
    if (filters.decade.label !== 'Any Era') c++;
    if (filters.minRating > 0) c++;
    if (filters.language) c++;
    if (filters.minVotes > 0) c++;
    if (filters.multipleGenres) c++;
    return c;
  }, [filters]);

  // ── Visible page numbers ──
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const range = 2;
    for (let p = Math.max(1, page - range); p <= Math.min(totalPages, page + range); p++) {
      pages.push(p);
    }
    return pages;
  }, [page, totalPages]);

  const gridCols = {
    sm: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9',
    md: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7',
    lg: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  }[cardSize];

  return (
    <div className="min-h-screen bg-[#030508] pb-32" ref={topRef}>
      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden">
        {/* Dynamic background based on active genre */}
        <div
          className="absolute inset-0 opacity-[0.06] blur-3xl transition-all duration-1000"
          style={{ background: `radial-gradient(ellipse at 30% 50%, ${activeGenreObj.color}, transparent 60%)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030508]" />

        <div className="relative max-w-[1900px] mx-auto px-6 pt-16 pb-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/25 tracking-widest mb-8">
            <span>OMNIMUX</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/50">DISCOVERY ENGINE</span>
            {!filters.genres.includes(0) && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span style={{ color: activeGenreObj.color }}>{activeGenreObj.name.toUpperCase()}</span>
              </>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <motion.h1
                key={activeGenreObj.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-none mb-4"
              >
                {filters.genres.includes(0) ? 'DISCOVER' : activeGenreObj.name.toUpperCase()}
              </motion.h1>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-white/40 text-sm font-mono tracking-wider">
                  {totalResults.toLocaleString()} {filters.mediaType === 'tv' ? 'shows' : 'movies'} found
                </p>
                <div className="h-3 w-px bg-white/15" />
                <p className="text-white/25 text-xs font-mono tracking-wider">
                  PAGE {page} OF {totalPages.toLocaleString()}
                </p>
                {activeFilterCount > 0 && (
                  <>
                    <div className="h-3 w-px bg-white/15" />
                    <span className="flex items-center gap-1 text-indigo-400 text-xs font-mono">
                      <Filter className="w-3 h-3" />{activeFilterCount} FILTER{activeFilterCount !== 1 ? 'S' : ''} ACTIVE
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Surprise me */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={surpriseMe}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-black tracking-wider shadow-lg hover:shadow-xl hover:brightness-110 transition-all"
              >
                <Sparkles className="w-4 h-4" /> SURPRISE ME
              </motion.button>

              {/* Sort */}
              <SortDropdown value={filters.sort} onChange={v => updateFilters({ sort: v })} />

              {/* Advanced filters */}
              <button
                onClick={() => setShowFilters(true)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-black tracking-wider transition-all ${
                  activeFilterCount > 0
                    ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                    : 'bg-white/[0.025] border-white/10 text-white/60 hover:border-white/20 hover:text-white/80'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                FILTERS
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center font-black">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* View mode */}
              <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/8">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/15' : 'hover:bg-white/8'}`}>
                  <Grid3X3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/15' : 'hover:bg-white/8'}`}>
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Card size (grid only) */}
              {viewMode === 'grid' && (
                <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/8">
                  {(['sm','md','lg'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setCardSize(s)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-black tracking-wider transition-all ${cardSize === s ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'}`}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}

              {/* Refresh */}
              <button
                onClick={() => setPage(p => p)}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : 'text-white/50'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1900px] mx-auto px-6">
        {/* ── GENRE PILLS ── */}
        <div className="mb-6 overflow-x-auto custom-scrollbar pb-2 -mx-6 px-6">
          <div className="flex gap-2 min-w-max">
            {GENRES.map(g => (
              <GenrePill
                key={g.id}
                genre={g}
                active={filters.genres.includes(g.id)}
                onClick={() => {
                  if (g.id === 0) {
                    updateFilters({ genres: [0] });
                  } else if (filters.multipleGenres) {
                    const next = filters.genres.filter(x => x !== 0);
                    const toggled = next.includes(g.id) ? next.filter(x => x !== g.id) : [...next, g.id];
                    updateFilters({ genres: toggled.length ? toggled : [0] });
                  } else {
                    updateFilters({ genres: filters.genres.includes(g.id) ? [0] : [g.id] });
                  }
                }}
              />
            ))}
          </div>
        </div>

        {/* ── ACTIVE FILTER CHIPS ── */}
        <AnimatePresence>
          {activeFilterCount > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <ActiveFilterChips filters={filters} onChange={updateFilters} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SAVE FILTER PRESETS ── */}
        {(savedFilters.length > 0 || showSaveInput) && (
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="text-[9px] font-mono text-white/25 tracking-widest">SAVED:</span>
            {savedFilters.map(sf => (
              <button
                key={sf.name}
                onClick={() => setFilters(sf.state)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-xs font-black text-white/50 hover:text-white/80 hover:bg-white/8 transition-all"
              >
                <Bookmark className="w-3 h-3" />{sf.name}
              </button>
            ))}
            {showSaveInput && (
              <div className="flex items-center gap-2">
                <input
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="Preset name..."
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30 w-36"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && saveName.trim()) {
                      setSavedFilters(p => [...p, { name: saveName.trim(), state: { ...filters } }]);
                      setSaveName('');
                      setShowSaveInput(false);
                    }
                  }}
                />
              </div>
            )}
            <button
              onClick={() => setShowSaveInput(s => !s)}
              className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-[10px] font-black text-white/30 hover:text-white/60 tracking-wider transition-all"
            >
              + SAVE CURRENT
            </button>
          </div>
        )}
        {!showSaveInput && savedFilters.length === 0 && (
          <div className="mb-6 flex items-center gap-2">
            <button
              onClick={() => setShowSaveInput(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/6 text-[10px] font-black text-white/25 hover:text-white/50 hover:bg-white/5 tracking-wider transition-all"
            >
              <Bookmark className="w-3 h-3" /> SAVE FILTER PRESET
            </button>
          </div>
        )}

        {/* ── MOVIES GRID / LIST ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              style={{ borderColor: `${activeGenreObj.color}40`, borderTopColor: activeGenreObj.color }}
              className="w-14 h-14 rounded-full border-4"
            />
            <p className="text-xs font-mono text-white/25 tracking-widest animate-pulse">SCANNING CATALOG…</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Filter className="w-12 h-12 text-white/10" />
            <p className="text-white/30 text-sm font-mono tracking-wider">NO RESULTS — TRY LOOSENING FILTERS</p>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black text-white/50 hover:text-white/80 hover:bg-white/8 transition-all tracking-wider"
            >
              RESET FILTERS
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${JSON.stringify(filters)}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {movies.map((m, i) => (
                <RankedCard key={m.id} movie={m} rank={(page - 1) * 20 + i + 1} viewMode="list" />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${JSON.stringify(filters)}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`grid ${gridCols} gap-4 md:gap-5`}
            >
              {movies.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5), ease: [0.22, 1, 0.36, 1] }}
                >
                  <RankedCard movie={m} rank={(page - 1) * 20 + i + 1} viewMode="grid" />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ── PAGINATION ── */}
        {totalPages > 1 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-14 flex items-center justify-center gap-2 flex-wrap"
          >
            {/* First page */}
            {page > 3 && (
              <>
                <PagePill page={1} active={false} onClick={() => setPage(1)} />
                {page > 4 && <span className="text-white/20 text-xs font-mono px-1">…</span>}
              </>
            )}

            {/* Prev */}
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            {pageNumbers.map(p => (
              <PagePill key={p} page={p} active={p === page} onClick={() => setPage(p)} />
            ))}

            {/* Next */}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center hover:bg-white/10 disabled:opacity-20 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last page */}
            {page < totalPages - 2 && (
              <>
                {page < totalPages - 3 && <span className="text-white/20 text-xs font-mono px-1">…</span>}
                <PagePill page={totalPages} active={false} onClick={() => setPage(totalPages)} />
              </>
            )}

            {/* Jump to page */}
            <div className="flex items-center gap-2 ml-4">
              <span className="text-[10px] text-white/25 font-mono tracking-wider">GO TO</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                defaultValue={page}
                key={page}
                className="w-14 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-center text-white/70 focus:outline-none focus:border-white/25 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const v = parseInt((e.target as HTMLInputElement).value);
                    if (!isNaN(v)) setPage(Math.max(1, Math.min(totalPages, v)));
                  }
                }}
              />
            </div>
          </motion.div>
        )}

        {/* ── DISCOVERY STATS FOOTER ── */}
        {!loading && movies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 p-6 rounded-3xl bg-white/[0.015] border border-white/6 flex flex-wrap gap-6 items-center justify-between"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-center">
                <div className="text-2xl font-black text-white">{totalResults.toLocaleString()}</div>
                <div className="text-[9px] font-mono text-white/25 tracking-[0.2em]">TOTAL RESULTS</div>
              </div>
              <div className="h-8 w-px bg-white/8" />
              <div className="text-center">
                <div className="text-2xl font-black text-white">{totalPages.toLocaleString()}</div>
                <div className="text-[9px] font-mono text-white/25 tracking-[0.2em]">PAGES</div>
              </div>
              <div className="h-8 w-px bg-white/8" />
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: activeGenreObj.color }}>{activeGenreObj.name}</div>
                <div className="text-[9px] font-mono text-white/25 tracking-[0.2em]">ACTIVE GENRE</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={surpriseMe}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-black tracking-wider hover:brightness-110 transition-all"
              >
                <Sparkles className="w-4 h-4" /> SHUFFLE GENRES
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-black tracking-wider text-white/50 hover:text-white/80 hover:bg-white/8 transition-all"
              >
                <ChevronUp className="w-4 h-4" /> BACK TO TOP
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── ADVANCED FILTERS DRAWER ── */}
      <AnimatePresence>
        {showFilters && (
          <FilterDrawer
            filters={filters}
            onChange={updateFilters}
            onClose={() => setShowFilters(false)}
            resultCount={totalResults}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
