'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { Play, Info, Flame, X, Star } from 'lucide-react';
import Link from 'next/link';

// More detailed mock or fetched data structure
type MovieDetails = {
    id: number;
    backdrop_path: string;
    poster_path: string;
    title?: string;
    name?: string;
    overview: string;
    media_type?: string;
    credits?: { cast: any[] };
    vote_average?: number; // FIXED: Added this property
    release_date?: string; // FIXED: Added this property
};

export function HeroCarousel({ movies }: { movies: MovieDetails[] }) {
    const [index, setIndex] = useState(0);
    const [detailedView, setDetailedView] = useState<MovieDetails | null>(null);
    const x = useMotionValue(0);

    // Auto-play interval
    useEffect(() => {
        if (!movies.length || detailedView) return;
        const interval = setInterval(() => setIndex(p => (p + 1) % Math.min(movies.length, 5)), 8000);
        return () => clearInterval(interval);
    }, [movies, detailedView]);

    const onDragEnd = (event: any, info: any) => {
        if (info.offset.x < -100) setIndex(p => (p + 1) % Math.min(movies.length, 5));
        else if (info.offset.x > 100) setIndex(p => (p - 1 + Math.min(movies.length, 5)) % Math.min(movies.length, 5));
    };

    // Fetch more details when info is clicked
    const fetchDetails = async (movie: MovieDetails) => {
        // Assume movie.media_type is present for simplicity, add checks in production
        const res = await fetch(`/api/tmdb?endpoint=/${movie.media_type}/${movie.id}&append_to_response=credits`);
        const data = await res.json();
        setDetailedView({ ...movie, ...data });
    };

    if (!movies.length) return <div className="h-[90vh] bg-black/50 animate-pulse" />;
    const hero = movies[index];

    return (
        <div className="relative h-[90vh] w-full overflow-hidden bg-black select-none">
            <AnimatePresence>
                <motion.div
                    key={hero.id}
                    drag="x" style={{ x }} dragConstraints={{ left: 0, right: 0 }} onDragEnd={onDragEnd}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}
                    className="absolute inset-0 cursor-grab active:cursor-grabbing"
                >
                    <motion.img initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ duration: 15 }} src={`https://image.tmdb.org/t/p/original${hero.backdrop_path}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030508] to-transparent" />

                    <div className="absolute inset-0 max-w-[1800px] mx-auto px-6 lg:px-16 flex items-center">
                        <div className="max-w-2xl z-10">
                            <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}>
                                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="flex gap-3 mb-6"><span className="bg-red-600 text-white px-3 py-1 rounded text-xs font-black uppercase flex items-center gap-2"><Flame /> Trending</span></motion.div>
                                <motion.h1 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-6xl md:text-8xl font-black text-white leading-none mb-6 tracking-tighter">{hero.title || hero.name}</motion.h1>
                                <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-gray-300 text-xl line-clamp-3 mb-10">{hero.overview}</motion.p>
                                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="flex gap-4">
                                    <Link href={`/movie/${hero.id}?type=${hero.media_type || 'movie'}`} className="bg-white text-black px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition">
                                        <Play className="w-6 h-6 fill-current" /> Watch Now
                                    </Link>
                                    <button onClick={() => fetchDetails(hero)} className="bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition">
                                        <Info className="w-6 h-6" /> More Info
                                    </button>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {detailedView && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-2xl z-50 flex items-center justify-center p-8">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-4xl h-[70vh] bg-black border border-white/10 rounded-3xl flex overflow-hidden">
                            <img src={`https://image.tmdb.org/t/p/w500${detailedView.poster_path}`} className="w-1/3 h-full object-cover hidden md:block" />
                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                                <h2 className="text-4xl font-bold">{detailedView.title}</h2>
                                <div className="flex items-center gap-4 my-4">
                                    <span className="flex items-center gap-1 text-yellow-400">
                                        <Star /> {detailedView.vote_average?.toFixed(1) ?? 'N/A'}
                                    </span>
                                    <span className="text-gray-400">{detailedView.release_date ?? 'Unknown Date'}</span>
                                </div>
                                <p className="text-gray-300 mb-6">{detailedView.overview}</p>
                                <h3 className="font-bold text-xl mb-3">Cast</h3>
                                <div className="flex gap-4 overflow-x-auto pb-4">
                                    {detailedView.credits?.cast.slice(0, 10).map((c: any) => <div key={c.id} className="w-24 text-center"><img src={`https://image.tmdb.org/t/p/w200${c.profile_path}`} className="w-24 h-24 rounded-full object-cover mb-2" /><p className="text-xs line-clamp-1">{c.name}</p></div>)}
                                </div>
                                <button className="mt-6 bg-red-600 px-6 py-3 rounded-lg font-bold">Watch Trailer</button>
                            </div>
                        </motion.div>
                        <button onClick={() => setDetailedView(null)} className="absolute top-8 right-8 p-3 bg-white/10 rounded-full text-white"><X /></button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
