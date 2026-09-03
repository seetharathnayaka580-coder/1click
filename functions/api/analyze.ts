// Cloudflare Pages Function: /api/analyze

interface DownloadFormat {
  id: string;
  label: string;
  quality: string;
  extension: string;
  badge?: string;
  downloadUrl: string;
  directUrl?: string;
  isAudioOnly?: boolean;
  isNoWatermark?: boolean;
}

interface VideoMetadata {
  id: string;
  originalUrl: string;
  platform: 'tiktok' | 'youtube' | 'facebook' | 'instagram' | 'unknown';
  title: string;
  author: string;
  authorAvatar?: string;
  duration?: number;
  durationFormatted?: string;
  thumbnail: string;
  previewUrl?: string;
  formats: DownloadFormat[];
  stats?: {
    views?: string;
    likes?: string;
    comments?: string;
    shares?: string;
  };
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function detectPlatform(rawUrl: string): 'tiktok' | 'youtube' | 'facebook' | 'instagram' | 'unknown' {
  const url = rawUrl.toLowerCase().trim();
  if (url.includes('tiktok.com') || url.includes('douyin.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) return 'facebook';
  if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
  return 'unknown';
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-\. ]/g, '_').trim().slice(0, 80) || '1Click_Download';
}

function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hours = Math.floor(mins / 60);
  if (hours > 0) {
    const remMins = mins % 60;
    return `${hours}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function unshortenUrl(rawUrl: string): Promise<string> {
  let current = rawUrl.trim();
  for (let i = 0; i < 4; i++) {
    const isShortLink =
      current.includes('vt.tiktok.com') ||
      current.includes('vm.tiktok.com') ||
      current.includes('/t/') ||
      current.includes('youtu.be') ||
      current.includes('fb.watch') ||
      current.includes('bit.ly') ||
      current.includes('tinyurl.com');

    if (!isShortLink) break;

    try {
      const res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      const loc = res.headers.get('location');
      if (loc) {
        if (loc.startsWith('http')) {
          current = loc;
        } else {
          current = new URL(loc, current).href;
        }
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return current;
}

export async function onRequestPost(context: any): Promise<Response> {
  try {
    let body: any = {};
    try {
      body = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON body.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const { url } = body;
    if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please enter a valid HTTP/HTTPS video URL.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const finalUrl = await unshortenUrl(url);
    const platform = detectPlatform(finalUrl);

    // 1. TikTok Resolution
    if (platform === 'tiktok') {
      const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}&hd=1`;
      const res = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const json: any = await res.json();
      if (json.code === 0 && json.data) {
        const d = json.data;
        const title = d.title || 'TikTok Video';
        const author = d.author?.unique_id ? `@${d.author.unique_id}` : (d.author?.nickname || 'TikTok Creator');
        const safeTitle = sanitizeFilename(title);

        const formats: DownloadFormat[] = [];
        if (d.hdplay) {
          formats.push({
            id: 'tiktok-hd',
            label: 'HD Video (No Watermark)',
            quality: '1080p HD',
            extension: 'mp4',
            isNoWatermark: true,
            badge: 'Best Quality',
            downloadUrl: d.hdplay,
            isAudioOnly: false,
          });
        }
        if (d.play) {
          formats.push({
            id: 'tiktok-sd',
            label: d.hdplay ? 'Standard Video (No Watermark)' : 'HD Video (No Watermark)',
            quality: '720p / Original',
            extension: 'mp4',
            isNoWatermark: true,
            badge: d.hdplay ? undefined : 'Recommended',
            downloadUrl: d.play,
            isAudioOnly: false,
          });
        }
        if (d.music) {
          formats.push({
            id: 'tiktok-mp3',
            label: 'Audio Only (MP3)',
            quality: '320kbps MP3',
            extension: 'mp3',
            isAudioOnly: true,
            badge: 'High Quality',
            downloadUrl: d.music,
          });
        }

        const metadata: VideoMetadata = {
          id: d.id || String(Date.now()),
          originalUrl: url,
          platform: 'tiktok',
          title,
          author,
          authorAvatar: d.author?.avatar,
          duration: d.duration,
          durationFormatted: formatDuration(d.duration),
          thumbnail: d.cover || d.origin_cover || '',
          previewUrl: d.play || d.hdplay,
          formats,
          stats: {
            views: d.play_count ? Number(d.play_count).toLocaleString() : undefined,
            likes: d.digg_count ? Number(d.digg_count).toLocaleString() : undefined,
            comments: d.comment_count ? Number(d.comment_count).toLocaleString() : undefined,
            shares: d.share_count ? Number(d.share_count).toLocaleString() : undefined,
          },
        };

        return new Response(JSON.stringify({ success: true, data: metadata }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
        });
      }

      if (json.msg?.includes('Url parsing is failed') || json.code === -1) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Could not parse this TikTok link. Please make sure the full share URL is copied and that the video is public.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: json.msg || 'Could not fetch TikTok video.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    // 2. YouTube Resolution (via oEmbed)
    if (platform === 'youtube') {
      const ytMatch = finalUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
      const videoId = ytMatch ? ytMatch[1] : '';

      let title = 'YouTube Video';
      let author = 'YouTube Creator';
      let thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(finalUrl)}&format=json`;
        const oembedRes = await fetch(oembedUrl);
        if (oembedRes.ok) {
          const odata: any = await oembedRes.json();
          title = odata.title || title;
          author = odata.author_name || author;
          thumbnail = odata.thumbnail_url || thumbnail;
        }
      } catch {
        // use defaults
      }

      const safeTitle = sanitizeFilename(title);
      const formats: DownloadFormat[] = [
        {
          id: 'yt-hd-1080',
          label: 'Full HD Video (MP4)',
          quality: '1080p / 720p HD',
          extension: 'mp4',
          badge: 'Best Video',
          downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(finalUrl)}&format=best&ext=mp4&filename=${encodeURIComponent(safeTitle)}_HD.mp4`,
          directUrl: `https://en1.savefrom.net/1-youtube-video-downloader-7/?url=${encodeURIComponent(finalUrl)}`,
          isAudioOnly: false,
        },
        {
          id: 'yt-sd-360',
          label: 'Fast Video (MP4)',
          quality: '720p / 360p',
          extension: 'mp4',
          badge: 'Fast Download',
          downloadUrl: `https://ssyoutube.com/watch?v=${videoId || 'video'}`,
          directUrl: `https://ssyoutube.com/watch?v=${videoId || 'video'}`,
          isAudioOnly: false,
        },
        {
          id: 'yt-mp3',
          label: 'Audio Only (MP3)',
          quality: '320kbps MP3',
          extension: 'mp3',
          badge: 'HQ Audio',
          downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(finalUrl)}&format=audio&ext=mp3&filename=${encodeURIComponent(safeTitle)}_audio.mp3`,
          directUrl: videoId ? `https://www.y2mate.com/youtube/${videoId}` : `https://cnvmp3.com/?url=${encodeURIComponent(finalUrl)}`,
          isAudioOnly: true,
        },
      ];

      const metadata: VideoMetadata = {
        id: videoId || String(Date.now()),
        originalUrl: url,
        platform: 'youtube',
        title,
        author,
        thumbnail,
        formats,
      };

      return new Response(JSON.stringify({ success: true, data: metadata }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    // 3. Facebook / Instagram / General
    const safeTitle = sanitizeFilename(platform.toUpperCase() + '_Media_' + Date.now().toString().slice(-4));
    const metadata: VideoMetadata = {
      id: String(Date.now()),
      originalUrl: url,
      platform,
      title: `${platform.toUpperCase()} Video / Media`,
      author: `${platform.toUpperCase()} Creator`,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      formats: [
        {
          id: `${platform}-hd`,
          label: 'HD Video (MP4)',
          quality: 'HD Quality',
          extension: 'mp4',
          badge: 'Recommended',
          downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(finalUrl)}&format=best&ext=mp4&filename=${encodeURIComponent(safeTitle)}.mp4`,
          isAudioOnly: false,
        },
        {
          id: `${platform}-mp3`,
          label: 'Audio Only (MP3)',
          quality: '320kbps MP3',
          extension: 'mp3',
          badge: 'HQ Audio',
          downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(finalUrl)}&format=audio&ext=mp3&filename=${encodeURIComponent(safeTitle)}_audio.mp3`,
          isAudioOnly: true,
        },
      ],
    };

    return new Response(JSON.stringify({ success: true, data: metadata }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Internal resolver error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }
}
