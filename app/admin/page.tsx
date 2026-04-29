'use client';
import { useStore } from '@/store/useStore';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js';
import { Activity, Server, Zap, Globe } from 'lucide-react';
import { SERVERS } from '@/lib/servers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

export default function AdminDashboard() {
  const { stats } = useStore();
  const data = {
    labels:['Movies', 'Episodes', 'Hours'],
    datasets: [{ label: 'Platform Stats', data:[stats.movies, stats.episodes, Math.round(stats.hoursWatched)], backgroundColor:['#3b82f6', '#8b5cf6', '#10b981'], borderRadius: 8 }]
  };

  return (
    <div className="pt-32 max-w-[1600px] mx-auto px-6 pb-20">
      <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
        <Server className="w-12 h-12 text-blue-500" />
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Admin Analytics</h1>
          <p className="text-gray-400 font-mono text-sm mt-1">Omnimux Vercel Edge Architecture</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl liquid-panel">
          <Activity className="w-6 h-6 text-blue-500 mb-4" />
          <p className="text-gray-400 text-sm font-bold mb-1">Total Users</p>
          <h2 className="text-4xl font-black">14,203</h2>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl liquid-panel">
          <Zap className="w-6 h-6 text-yellow-500 mb-4" />
          <p className="text-gray-400 text-sm font-bold mb-1">Edge API Rate Limit</p>
          <h2 className="text-4xl font-black text-green-400">Stable (42ms)</h2>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl liquid-panel">
          <Globe className="w-6 h-6 text-purple-500 mb-4" />
          <p className="text-gray-400 text-sm font-bold mb-1">Active WebRTC Parties</p>
          <h2 className="text-4xl font-black">128</h2>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl liquid-panel">
          <Server className="w-6 h-6 text-emerald-500 mb-4" />
          <p className="text-gray-400 text-sm font-bold mb-1">Available Servers</p>
          <h2 className="text-4xl font-black">{SERVERS.length}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl liquid-panel">
          <h3 className="text-xl font-bold mb-6 tracking-tight">Your Consumption Metrics</h3>
          <Bar data={data} options={{ responsive: true, plugins: { legend: {display: false} } }} />
        </div>
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl liquid-panel">
          <h3 className="text-xl font-bold mb-6 tracking-tight">Active Endpoints (Failover Ready)</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {SERVERS.map(s => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                <span className="font-bold text-sm">{s.badge} {s.name}</span>
                <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded">200 OK</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
