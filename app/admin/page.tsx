'use client';
import { useStore } from '@/store/useStore';
import { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Activity, Server, Zap, Globe, ArrowUpRight, ArrowDownRight, ShieldCheck, DownloadCloud, Loader2 } from 'lucide-react';
import { SERVERS } from '@/lib/servers';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const { stats, history, activeProfile } = useStore();
  const [realTimeUsers, setRealTimeUsers] = useState(14203);
  const [ping, setPing] = useState(42);
  const [isZipping, setIsZipping] = useState(false);

  useEffect(() => {
    const int = setInterval(() => {
      setRealTimeUsers(prev => prev + Math.floor(Math.random() * 10) - 4);
      setPing(prev => Math.max(20, Math.min(120, prev + Math.floor(Math.random() * 15) - 7)));
    }, 3000);
    return () => clearInterval(int);
  }, []);

  // Neural HTML ZIP Downloader Logic
  const generateHTMLBackupZip = async () => {
    setIsZipping(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Save raw JSON arrays safely
      zip.file("matrix_stats.json", JSON.stringify(stats, null, 2));
      zip.file("watch_history.json", JSON.stringify(history, null, 2));

      // Generate a standalone HTML file containing the user's data
      const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Omnimux Core Backup</title>
          <style>
              body { background: #030508; color: #fff; font-family: 'Courier New', monospace; padding: 40px; margin: 0; }
              .container { max-width: 1200px; margin: auto; }
              h1 { color: #8b5cf6; text-shadow: 0 0 20px rgba(139, 92, 246, 0.5); font-size: 3rem; margin-bottom: 5px; }
              .tag { background: #111; border: 1px solid #333; padding: 5px 10px; border-radius: 5px; color: #10b981; font-weight: bold; margin-bottom: 30px; display: inline-block; }
              .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px; }
              .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Omnimux Extracted Matrix Profile</h1>
              <div class="tag">Operator: ${activeProfile?.name || 'ROOT'}</div>
              
              <div class="card" style="display:flex; justify-content: space-around; text-align: center; font-size: 1.5rem">
                 <div>🎬 Movies Watched: <strong style="color: #3b82f6">${stats.movies}</strong></div>
                 <div>📺 Episodes: <strong style="color: #8b5cf6">${stats.episodes}</strong></div>
                 <div>⏳ Hours Muxed: <strong style="color: #10b981">${stats.hoursWatched.toFixed(1)}</strong></div>
              </div>

              <h2 style="margin-top:40px; border-bottom: 1px solid #333; padding-bottom:10px;">Recent History Extract</h2>
              <div class="grid">
                  ${history.map((m: any) => `
                      <div class="card">
                         <h3 style="margin: 0 0 10px 0; color: white;">${m.title || m.name}</h3>
                         <p style="margin: 0; color: gray;">TYPE: ${m.type} | RATING: ${m.vote_average?.toFixed(1) || 'N/A'}</p>
                      </div>
                  `).join('')}
              </div>
          </div>
      </body>
      </html>
      `;

      zip.file("Omnimux_Backup.html", htmlTemplate);

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Omnimux_10X_SystemBackup_${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error("Backup failure", err);
    } finally {
      setIsZipping(false);
    }
  };

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
    <div className="pt-32 max-w-[1600px] mx-auto px-6 pb-20 relative">
      {/* Background Matrix Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIvPjwvc3ZnPg==')] opacity-10 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b border-white/10 pb-6 gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <Server className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter">Command Center</h1>
            <p className="text-gray-400 font-mono text-sm mt-1">Omnimux Edge Real-time Analytics v12</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
             onClick={generateHTMLBackupZip} disabled={isZipping}
             className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.3)] disabled:opacity-50">
             {isZipping ? <Loader2 className="w-5 h-5 animate-spin"/> : <DownloadCloud className="w-5 h-5" />}
             Export Archive (ZIP)
          </button>
          <div className="flex items-center gap-2 bg-green-500/10 px-4 py-3 rounded-xl border border-green-500/20 text-green-400 font-bold w-fit">
            <ShieldCheck className="w-5 h-5" /> All Systems Nominal
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
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
