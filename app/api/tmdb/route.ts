import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint');
  if (!endpoint) return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
  
  const tmdbUrl = new URL(`https://api.themoviedb.org/3${endpoint}`);
  tmdbUrl.searchParams.set('api_key', process.env.TMDB_API_KEY || '15d2ea6d0dc1d476efbca3eba2b9bbfb');
  searchParams.forEach((v, k) => { if (k !== 'endpoint') tmdbUrl.searchParams.set(k, v); });
  
  try {
    const res = await fetch(tmdbUrl.toString(), { next: { revalidate: 3600 } });
    const data = await res.json();
    return NextResponse.json(data, { headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400' } });
  } catch (error) {
    return NextResponse.json({ error: 'TMDB Backbone Severed' }, { status: 502 });
  }
}
