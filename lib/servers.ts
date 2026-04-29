export const SERVERS =[
  { id: 'vidlink', name: 'VidLink Pro', badge: '⚡', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://vidlink.pro/movie/${id}?primaryColor=ffffff&autoplay=true` : `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=ffffff&autoplay=true` },
  { id: 'vidsrcpro', name: 'VidSrc PRO', badge: '🔥', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://vidsrc.pro/embed/movie/${id}` : `https://vidsrc.pro/embed/tv/${id}/${s}/${e}` },
  { id: 'videasy', name: 'Videasy', badge: '🎬', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://player.videasy.net/movie/${id}` : `https://player.videasy.net/tv/${id}/${s}/${e}` },
  { id: 'vidsrccc', name: 'VidSrc CC', badge: '🌐', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://vidsrc.cc/v2/embed/movie/${id}` : `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}` },
  { id: 'superembed', name: 'SuperEmbed HD', badge: '🔮', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://multiembed.mov/directstream.php?video_id=${id}` : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}` },
  { id: 'autoembed', name: 'AutoEmbed', badge: '🤖', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://player.autoembed.cc/embed/movie/${id}` : `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}` },
  { id: '2embed', name: '2Embed', badge: '✨', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://www.2embed.cc/embed/${id}` : `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}` },
  { id: 'vidsrcme', name: 'VidSrc.ME', badge: '💾', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://vidsrc.me/embed/movie?tmdb=${id}` : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}` },
  { id: 'embedsu', name: 'Embed.su', badge: '⭐', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://embed.su/embed/movie/${id}` : `https://embed.su/embed/tv/${id}/${s}/${e}` },
  { id: 'nontonid', name: 'NontonID', badge: '🎯', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://www.NontonID.live/embed/movie/${id}` : `https://www.NontonID.live/embed/tv/${id}/${s}/${e}` },
  { id: 'moviesapi', name: 'MoviesAPI', badge: '🌊', build: (t: string, id: string, s: number, e: number) => t === 'movie' ? `https://moviesapi.club/movie/${id}` : `https://moviesapi.club/tv-shows/${id}-${s}-${e}` }
];
