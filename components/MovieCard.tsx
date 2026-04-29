import Link from 'next/link';
import { Star, Play, Heart, Plus, Eye } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// This is an advanced card with its own state and data-fetching logic.
export function MovieCard({ movie }: { movie: any }) {
    const { watchlist, toggleWatchlist } = useStore();
    const [quickView, setQuickView] = useState(false);
    const [details, setDetails] = useState<any>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const isFav = watchlist.some((m) => m.id === movie.id);
    const type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');

    // Fetch detailed info for the quick view modal
    const handleQuickView = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setQuickView(true);
        if (details) return; // Don't refetch if we already have it
        setIsLoadingDetails(true);
        try {
            const res = await fetch(`/api/tmdb?endpoint=/${type}/${movie.id}`);
            const data = await res.json();
            setDetails(data);
        } catch (error) {
            console.error("Failed to fetch quick view details:", error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    return (
        <>
            <motion.div whileHover="hover" className="min-w-[200px] md:min-w-[240px] group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-500 hover:-translate-y-3 shadow-lg hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] cursor-pointer">
                <Link href={`/movie/${movie.id}?type=${type}`} className="block relative aspect-[2/3] overflow-hidden bg-black/50">
                    <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-80" />
                </Link>
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <motion.div initial={{ y: 20, opacity: 0 }} variants={{ hover: { y: 0, opacity: 1 } }} transition={{ ease: 'easeOut' }}>
                        <h3 className="text-lg font-bold text-white line-clamp-1 drop-shadow-md">{movie.title || movie.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-300 mt-2 font-medium">
                            <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"/>{movie.vote_average?.toFixed(1)}</span>
                            <span className="uppercase tracking-wider">{type}</span>
                        </div>
                    </motion.div>
                </div>
                {/* Interaction Overlay */}
                <motion.div initial={{ opacity: 0 }} variants={{hover: {opacity: 1}}} className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4">
                    <Link href={`/movie/${movie.id}?type=${type}`} className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-lg border border-white/20 hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 fill-black ml-1" />
                    </Link>
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWatchlist(movie); }} className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 ${isFav ? "bg-indigo-600 text-white" : "bg-black/60 text-white hover:bg-white/20"}`}>
                            {isFav ? <Heart className="w-5 h-5 fill-white" /> : <Plus className="w-5 h-5" />}
                        </button>
                        <button onClick={handleQuickView} className="w-10 h-10 rounded-full flex items-center justify-center bg-black/60 text-white hover:bg-white/20 backdrop-blur-md transition-all">
                            <Eye className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {quickView && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-[100] flex items-center justify-center" onClick={() => setQuickView(false)}>
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-2xl h-[70vh] bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                             {isLoadingDetails ? <div className="flex items-center justify-center h-full text-white">Loading...</div> : details && (
                                <div className="w-full h-full flex flex-col">
                                    <div className="relative h-1/2 w-full">
                                        <img src={`https://image.tmdb.org/t/p/w780${details.backdrop_path}`} className="w-full h-full object-cover"/>
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent"/>
                                    </div>
                                    <div className="p-6 flex-1 -mt-10 relative">
                                        <h2 className="text-3xl font-bold">{details.title || details.name}</h2>
                                        <p className="line-clamp-3 text-gray-400 mt-2">{details.overview}</p>
                                        <div className="mt-4 flex gap-4">{details.genres.map((g: any) => <span key={g.id} className="text-xs bg-white/10 px-2 py-1 rounded">{g.name}</span>)}</div>
                                    </div>
                                </div>
                             )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
