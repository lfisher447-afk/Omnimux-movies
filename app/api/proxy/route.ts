import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });

    let html = await response.text();
    const targetOrigin = new URL(targetUrl).origin;

    // Advanced URL Rewriting to keep assets working locally
    html = html.replace(/href="\/(?!\/)/g, `href="${targetOrigin}/`);
    html = html.replace(/src="\/(?!\/)/g, `src="${targetOrigin}/`);

    // Strip out malicious scripts or frame-busting scripts
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '<!-- OmegaShield: Script Scrubbed -->');

    const headers = new Headers();
    headers.set('Content-Type', 'text/html; charset=utf-8');
    headers.set('Access-Control-Allow-Origin', '*');
    
    // We do NOT pass X-Frame-Options or CSP back to the client!
    return new NextResponse(html, { status: 200, headers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
