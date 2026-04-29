'use client';
import { useStore } from '@/store/useStore';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { ArrowRight, Download, X } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement);

// Define slide structures for a robust story
type Slide = { type: 'intro' | 'stat' | 'chart' | 'top' | 'outro'; data: any; };

export default function Wrapped() {
  const { stats, history, activeProfile } = useStore();
  const [slideIndex, setSlideIndex] = useState(0);

  const slides: Slide[] = [
    { type: 'intro', data: { title: "Your 2026 Movie Review" } },
    { type: 'stat', data: { prefix: 'You sank', value: stats.hoursWatched.toFixed(0), suffix: 'Hours into new worlds', color: 'text-yellow-400' } },
    { type: 'stat', data: { prefix: 'Exploring', value: stats.movies, suffix: 'Epic Movies', color: 'text-emerald-400' } },
    { type: 'chart', data: { title: 'Your Genre DNA', chartData: { labels: ['Action', 'Sci-Fi', 'Comedy', 'Drama'], datasets: [{ data: [7, 12, 5, 8], backgroundColor: '#8b5cf6' }] } } },
    { type: 'top', data: { title: 'Your Most Watched', movie: history[0] || { title: "Nothing yet!", poster_path: '' } } },
    { type: 'outro', data: { name: activeProfile?.name || 'Explorer' } }
  ];

  // Auto-play and manual navigation logic
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex(s => (s + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setSlideIndex(s => (s + 1) % slides.length);
  const prevSlide = () => setSlideIndex(s => (s - 1 + slides.length) % slides.length);

  const CurrentSlide = slides[slideIndex];

  return (
    <div className="fixed inset-0 z-[9999] bg-[#030508] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden" onClick={nextSlide}>
        {/* Orbs background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 blur-[150px] rounded-full mix-blend-screen animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 blur-[150px] rounded-full mix-blend-screen animate-pulse-glow" style={{ animationDelay: '1s' }}></div>

        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-2 z-20">
            {slides.map((_, i) => (
                <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <AnimatePresence>
                    {i === slideIndex && <motion.div initial={{width: '0%'}} animate={{width: '100%'}} transition={{duration: 6, ease: 'linear'}} className="h-full bg-white"/>}
                    </AnimatePresence>
                     {i < slideIndex && <div className="h-full w-full bg-white"/>}
                </div>
            ))}
        </div>
        <button className="absolute top-8 right-8 z-20 p-2 text-white/50 hover:text-white"><X/></button>

        <div className="w-full max-w-5xl aspect-video relative flex items-center justify-center">
            <AnimatePresence mode="wait">
                <motion.div key={slideIndex} initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.95}} transition={{duration: 0.5}} className="w-full h-full">
                    {CurrentSlide.type === 'intro' && <IntroSlide data={CurrentSlide.data}/>}
                    {CurrentSlide.type === 'stat' && <StatSlide data={CurrentSlide.data}/>}
                    {CurrentSlide.type === 'chart' && <ChartSlide data={CurrentSlide.data}/>}
                    {CurrentSlide.type === 'top' && <TopMovieSlide data={CurrentSlide.data}/>}
                    {CurrentSlide.type === 'outro' && <OutroSlide data={CurrentSlide.data}/>}
                </motion.div>
            </AnimatePresence>
        </div>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-full w-1/3 z-10" onClick={e => { e.stopPropagation(); prevSlide(); }} />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 h-full w-1/3 z-10" onClick={e => { e.stopPropagation(); nextSlide(); }}/>
    </div>
  );
}

// Sub-components for each slide type, making the main component cleaner and more robust
const IntroSlide = ({ data }: { data: any }) => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-6xl md:text-9xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 tracking-tighter">{data.title}</h1>
        <p className="text-2xl text-gray-400 font-medium">A look back at your cinematic journey.</p>
    </div>
);

const StatSlide = ({ data }: { data: any }) => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-3xl text-gray-400 mb-6 font-medium">{data.prefix}</p>
        <h1 className={`text-8xl md:text-[150px] font-black mb-6 ${data.color} drop-shadow-[0_0_50px_currentColor]`}>{data.value}</h1>
        <p className="text-4xl font-bold">{data.suffix}</p>
    </div>
);

const ChartSlide = ({ data }: { data: any }) => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-4xl font-bold mb-8">{data.title}</h2>
        <div className="w-full h-64"><Bar data={data.chartData} options={{ responsive: true, maintainAspectRatio: false }}/></div>
    </div>
);

const TopMovieSlide = ({ data }: { data: any }) => (
    <div className="flex flex-col md:flex-row items-center justify-center h-full gap-8">
        <img src={`https://image.tmdb.org/t/p/w500${data.movie.poster_path}`} className="w-64 rounded-2xl shadow-2xl"/>
        <div>
            <p className="text-2xl font-medium text-gray-400">Your top film was</p>
            <h2 className="text-6xl font-black">{data.movie.title}</h2>
        </div>
    </div>
);

const OutroSlide = ({ data }: { data: any }) =>  (
    <div className="flex flex-col items-center justify-center h-full text-center bg-white/5 border border-white/10 rounded-3xl p-8">
        <h2 className="text-5xl font-bold mb-4">You're in the Top 1%</h2>
        <p className="text-xl text-gray-300 mb-8">Keep exploring, {data.name}.</p>
        <button className="px-6 py-3 bg-white text-black font-bold flex items-center gap-2 rounded-lg"><Download/> Download Your Stats</button>
    </div>
);
