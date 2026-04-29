import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Node runtime required for heavy buffer/stream manipulation

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'Missing source URL' }, { status: 400 });

  try {
    const rangeHeader = req.headers.get('range');
    const fetchHeaders: HeadersInit = {
      'User-Agent': 'Omnimux-Core-Server/11.0',
      'Referer': new URL(targetUrl).origin,
    };

    if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

    const response = await fetch(targetUrl, { headers: fetchHeaders });

    if (!response.ok && response.status !== 206) {
      throw new Error(`Upstream responded with ${response.status}`);
    }

    const headers = new Headers(response.headers);
    // Overwrite CORS to allow our player to extract canvas data for Ambilight
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Security headers removal to allow processing
    headers.delete('x-frame-options');
    headers.delete('content-security-policy');

    return new NextResponse(response.body as any, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error: any) {
    console.error('Omnimux Stream Error:', error);
    return NextResponse.json({ error: 'Stream bridge failed', details: error.message }, { status: 502 });
  }
}
