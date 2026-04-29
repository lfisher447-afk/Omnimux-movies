export const SERVERS =[
  // Our Custom Direct Stream Server
  { 
    id: 'omnimux-core', 
    name: 'Omnimux Core Proxy', 
    badge: '👑', 
    type: 'direct', // 'direct' tells our player to use <video> instead of <iframe>
    // Mocking a direct MP4/HLS stream for demonstration. In a real app, this queries a database for the .m3u8/.mp4 link.
    build: (t: string, id: string, s: number, e: number) => `/api/stream?url=${encodeURIComponent('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')}` 
  },
  { 
    id: 'webtorrent', 
    name: 'WebTorrent P2P', 
    badge: '🧲', 
    type: 'torrent', 
    build: (t: string, id: string, s: number, e: number) => 'magnet_prompt' 
  },
  // Traditional Embeds
  { id: 'vidlink', name: 'VidLink Pro', badge: '⚡', type: 'iframe', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://vidlink.pro/movie/${id}?primaryColor=ffffff&autoplay=true` : `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=ffffff&autoplay=true` },
  { id: 'vidsrcpro', name: 'VidSrc PRO', badge: '🔥', type: 'iframe', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://vidsrc.pro/embed/movie/${id}` : `https://vidsrc.pro/embed/tv/${id}/${s}/${e}` },
  { id: 'vidsrccc', name: 'VidSrc CC', badge: '🌐', type: 'iframe', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://vidsrc.cc/v2/embed/movie/${id}` : `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}` }
];
