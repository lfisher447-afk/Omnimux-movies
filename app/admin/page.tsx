'use client';
import { useStore } from '@/store/useStore';
import { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Activity, Server, Zap, Globe, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';
import { SERVERS } from '@/lib/servers';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const { stats } = useStore();
  const [realTimeUsers, setRealTimeUsers] = useState(14203);
  const [ping, setPing] = useState(42);

  useEffect(() => {
    const int = setInterval(() => {
      setRealTimeUsers(prev => prev + Math.floor(Math.random() * 10) - 4);
      setPing(prev => Math.max(20, Math.min(120, prev + Math.floor(Math.random() * 15) - 7)));
    }, 3000);
    return () => clearInterval(int);
  }, []);

  const barData = {
    labels:['Movies Watched', 'Episodes Watched', 'Total Hours'],
    datasets: [{
      label: 'Local Profile Metrics',
      data:[stats.movies, stats.episodes, Math.round(stats.hoursWatched)],
      backgroundColor:['#3b82f6', '#8b5cf6', '#10b981'],
      borderRadius: 8,
    }]
  };

  const sysData = {
    labels:['CPU Load', 'Memory Usage', 'Network I/O'],
    datasets: [{
      data:[65, 45, 80],
      backgroundColor:['#ef4444', '#f59e0b', '#3b82f6'],
      borderWidth: 0,
    }]
  };

  return (
    <div className="pt-32 max-w-[1600px] mx-auto px-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b border-white/10 pb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <Server className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter">Command Center</h1>
            <p className="text-gray-400 font-mono text-sm mt-1">Omnimux Edge Real-time Analytics v11</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20 text-green-400 font-bold w-fit">
          <ShieldCheck className="w-5 h-5" /> All Systems Nominal
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-2xl liquid-panel relative overflow-hidden group">
          <Activity className="w-6 h-6 text-blue-500 mb-4" />
          <p className="text-gray-400 text-sm font-bold mb-1">Active Connections</p>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl font-black">{realTimeUsers.toLocaleString()}</h2>
            <span className="text-green-500 text-sm font-bold flex items-center mb-1"><ArrowUpRight className="w-4 h-4"/> 2.4%</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-2xl liquid-panel relative overflow-hidden group">
           <Zap className="w-6 h-6 text-yellow-500 mb-4" />
           <p className="text-gray-400 text-sm font-bold mb-1">Global Edge Ping</p>
           <div className="flex items-end gap-3">
             <h2 className={`text-4xl font-black transition-colors ${ping < 60 ? 'text-green-400' : 'text-yellow-400'}`}>{ping}ms</h2>
             <span className="text-gray-500 text-sm font-mono mb-1">avg latency</span>
           </div>
        </div>

        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-2xl liquid-panel relative overflow-hidden group">
          <Globe className="w-6 h-6 text-purple-500 mb-4" />
          <p className="text-gray-400 text-sm font-bold mb-1">WebRTC Hubs</p>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl font-black text-white">1,248</h2>
            <span className="text-red-500 text-sm font-bold flex items-center mb-1"><ArrowDownRight className="w-4 h-4"/> 0.5%</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 p-6 rounded-2xl liquid-panel relative overflow-hidden group">
          <Server className="w-6 h-6 text-emerald-500 mb-4" />
          <p className="text-gray-400 text-sm font-bold mb-1">Fallback Nodes</p>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl font-black text-white">{SERVERS.length}</h2>
            <span className="text-emerald-500 text-sm font-bold mb-1 ml-1 px-2 py-0.5 bg-emerald-500/20 rounded border border-emerald-500/30">ONLINE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-b from-white/5 to-black/50 border border-white/10 p-8 rounded-3xl liquid-panel shadow-2xl">
          <h3 className="text-xl font-bold mb-6 tracking-tight flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400"/> Personal Consumption Profile</h3>
          <div className="h-[300px] flex items-center justify-center">
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } }, x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } } } }} />
          </div>
        </div>
        
        <div className="bg-gradient-to-b from-white/5 to-black/50 border border-white/10 p-8 rounded-3xl liquid-panel flex flex-col items-center justify-center shadow-2xl">
          <h3 className="text-lg font-bold mb-8 tracking-tight w-full text-center">System Edge Resources</h3>
          <div className="w-[220px] h-[220px]">
             <Doughnut data={sysData} options={{ cutout: '78%', plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)', padding: 20 } } } }} />
          </div>
        </div>
      </div>
    </div>
  );
}
