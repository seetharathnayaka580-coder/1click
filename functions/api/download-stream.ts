// Cloudflare Pages Function: /api/download-stream

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
  const sourceUrl = urlObj.searchParams.get('sourceUrl') || urlObj.searchParams.get('url');
  const filename = urlObj.searchParams.get('filename') || 'media_download.mp4';
  const ext = (urlObj.searchParams.get('ext') || 'mp4').toLowerCase();

  if (!sourceUrl || !sourceUrl.startsWith('http')) {
    return new Response('Missing or invalid sourceUrl parameter.', {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  // Handle YouTube links by redirecting to dedicated high-speed conversion portals
  if (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be')) {
    const ytMatch = sourceUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
    const videoId = ytMatch ? ytMatch[1] : '';

    if (ext === 'mp3') {
      const mp3Target = videoId 
        ? `https://www.y2mate.com/youtube/${videoId}`
        : `https://cnvmp3.com/?url=${encodeURIComponent(sourceUrl)}`;
      return Response.redirect(mp3Target, 302);
    } else {
      const videoTarget = videoId
        ? `https://en1.savefrom.net/1-youtube-video-downloader-7/?url=${encodeURIComponent(sourceUrl)}`
        : `https://en1.savefrom.net/1-youtube-video-downloader-7/?url=${encodeURIComponent(sourceUrl)}`;
      return Response.redirect(videoTarget, 302);
    }
  }

  // For direct media URLs (e.g. TikTok CDN, Facebook CDN, Instagram media), stream upstream
  try {
    const upstreamRes = await fetch(sourceUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!upstreamRes.ok) {
      return Response.redirect(sourceUrl, 302);
    }

    const contentType = upstreamRes.headers.get('content-type') || (ext === 'mp3' ? 'audio/mpeg' : 'video/mp4');
    const contentLength = upstreamRes.headers.get('content-length');

    // Never stream HTML as a media file
    if (contentType.includes('text/html')) {
      return Response.redirect(sourceUrl, 302);
    }

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
    return Response.redirect(sourceUrl, 302);
  }
}
