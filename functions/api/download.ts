// Cloudflare Pages Function: /api/download & download-stream

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestGet(context: any): Promise<Response> {
  const urlObj = new URL(context.request.url);
  const targetUrl = urlObj.searchParams.get('url') || urlObj.searchParams.get('sourceUrl');
  const filename = urlObj.searchParams.get('filename') || '1Click_Download.mp4';

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return new Response('Target media URL parameter is missing or invalid.', {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!upstreamRes.ok) {
      // Fallback: Redirect directly to upstream media
      return Response.redirect(targetUrl, 302);
    }

    const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
    const contentLength = upstreamRes.headers.get('content-length');

    const headers: Record<string, string> = {
      ...CORS_HEADERS,
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Cache-Control': 'public, max-age=3600',
    };

    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    return new Response(upstreamRes.body, {
      status: 200,
      headers,
    });
  } catch {
    // If streaming fails, redirect to direct URL
    return Response.redirect(targetUrl, 302);
  }
}
