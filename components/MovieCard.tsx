import Link from 'next/link';
import { Star, Play, Heart } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function MovieCard({ movie }: { movie: any }) {
    const { watchlist, toggleWatchlist } = useStore();
    const isFav = watchlist.some((m) => m.id === movie.id);
    const type = movie.media_type || (movie.first_air_date ? 'tv' : 'movie');

    return (
        <div className="min-w-[160px] md:min-w-[200px] group relative rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer liquid-panel">
            <Link href={`/movie/${movie.id}?type=${type}`} className="block relative aspect-[2/3] overflow-hidden">
                <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20 transform scale-75 group-hover:scale-100 transition-transform">
                        <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                </div>
            </Link>
            <button onClick={(e) => { e.preventDefault(); toggleWatchlist(movie); }} className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all z-10 opacity-0 group-hover:opacity-100 ${isFav ? "bg-indigo-600 text-white" : "bg-black/60 text-white hover:bg-white/20"}`}>
                <Heart className={`w-4 h-4 ${isFav ? "fill-white" : ""}`} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
                <h3 className="text-sm font-bold text-white line-clamp-1">{movie.title || movie.name}</h3>
                <div className="flex items-center gap-2 text-[11px] text-white/50 mt-1">
                    <span className="flex items-center text-yellow-500 font-bold bg-black/50 px-1.5 py-0.5 rounded"><Star className="w-3 h-3 fill-current mr-1"/>{movie.vote_average?.toFixed(1)}</span>
                    <span className="uppercase">{type}</span>
                </div>
            </div>
        </div>
    );
}
