// Cloudflare Pages Function: /api/sample-links

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SAMPLE_LINKS = [
  {
    platform: 'tiktok',
    name: 'TikTok Viral Clip',
    url: 'https://www.tiktok.com/@mrbeast/video/7448330707941805358',
    description: 'No watermark HD MP4 & MP3 audio',
  },
  {
    platform: 'youtube',
    name: 'YouTube 4K Demo',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Supports HD video & 320kbps MP3',
  },
  {
    platform: 'instagram',
    name: 'Instagram Reel',
    url: 'https://www.instagram.com/reel/C3bW8xQL_9y/',
    description: 'Direct MP4 reel extraction',
  },
  {
    platform: 'facebook',
    name: 'Facebook Video',
    url: 'https://www.facebook.com/watch/?v=10158789324567890',
    description: 'Public HD video stream',
  },
];

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestGet(): Promise<Response> {
  return new Response(JSON.stringify({ success: true, links: SAMPLE_LINKS }), {
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}
