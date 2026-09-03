import { Platform, VideoMetadata, DownloadFormat } from '../types.js';

export function detectPlatform(rawUrl: string): Platform {
  const url = rawUrl.toLowerCase().trim();
  if (url.includes('tiktok.com') || url.includes('douyin.com')) {
    return 'tiktok';
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) {
    return 'facebook';
  }
  if (url.includes('instagram.com') || url.includes('instagr.am')) {
    return 'instagram';
  }
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

/**
 * Resolves TikTok video directly in the browser via CORS-enabled TikWM API.
 */
async function clientResolveTikTok(url: string): Promise<VideoMetadata> {
  const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    throw new Error('TikTok resolver service is temporarily unavailable. Please try again.');
  }

  const json = await res.json();
  if (json.code === 0 && json.data) {
    const d = json.data;
    const title = d.title || 'TikTok Video';
    const author = d.author?.unique_id ? `@${d.author.unique_id}` : (d.author?.nickname || 'TikTok Creator');
    const safeTitle = sanitizeFilename(title);

    const formats: DownloadFormat[] = [];

    // 1. HD No Watermark (Direct CDN stream)
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

    // 2. Standard No Watermark
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

    // 3. MP3 Audio
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

    return {
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
  }

  if (json.msg?.includes('Url parsing is failed') || json.code === -1) {
    if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com') || url.includes('/t/')) {
      throw new Error(
        'Could not expand this TikTok short link directly. Please open the link in your browser or TikTok app and copy the full URL (e.g., https://www.tiktok.com/@creator/video/...).'
      );
    }
    throw new Error('Could not parse this TikTok link. Please verify the link is public and accessible.');
  }

  throw new Error(json.msg || 'Failed to fetch TikTok details. Please verify the URL.');
}

/**
 * Resolves YouTube video details in the browser via YouTube oEmbed API.
 */
async function clientResolveYouTube(url: string): Promise<VideoMetadata> {
  // Extract YouTube ID
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
  const videoId = ytMatch ? ytMatch[1] : '';

  let title = 'YouTube Video';
  let author = 'YouTube Creator';
  let thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      title = data.title || title;
      author = data.author_name || author;
      thumbnail = data.thumbnail_url || thumbnail;
    }
  } catch {
    // fallback to defaults
  }

  const safeTitle = sanitizeFilename(title);

  const formats: DownloadFormat[] = [
    {
      id: 'yt-hd-web',
      label: 'Full HD Video (MP4)',
      quality: '1080p / 720p HD',
      extension: 'mp4',
      badge: 'Best Video',
      downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=best&ext=mp4&filename=${encodeURIComponent(safeTitle)}_HD.mp4`,
      isAudioOnly: false,
    },
    {
      id: 'yt-mp3-web',
      label: 'Audio Only (MP3)',
      quality: '320kbps MP3',
      extension: 'mp3',
      badge: 'HQ Audio',
      downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=audio&ext=mp3&filename=${encodeURIComponent(safeTitle)}_audio.mp3`,
      isAudioOnly: true,
    },
  ];

  return {
    id: videoId || String(Date.now()),
    originalUrl: url,
    platform: 'youtube',
    title,
    author,
    thumbnail,
    formats,
  };
}

/**
 * Fallback resolver for Instagram, Facebook, and generic URLs
 */
async function clientResolveGeneral(url: string, platform: Platform): Promise<VideoMetadata> {
  const safeTitle = sanitizeFilename(platform.toUpperCase() + '_Media_' + Date.now().toString().slice(-4));
  return {
    id: String(Date.now()),
    originalUrl: url,
    platform,
    title: `${platform.toUpperCase()} Video / Media`,
    author: `${platform.toUpperCase()} Creator`,
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    formats: [
      {
        id: `${platform}-video`,
        label: 'Video (MP4)',
        quality: 'HD Quality',
        extension: 'mp4',
        badge: 'Recommended',
        downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=best&ext=mp4&filename=${encodeURIComponent(safeTitle)}.mp4`,
        isAudioOnly: false,
      },
      {
        id: `${platform}-mp3`,
        label: 'Audio Only (MP3)',
        quality: '320kbps MP3',
        extension: 'mp3',
        badge: 'HQ Audio',
        downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=audio&ext=mp3&filename=${encodeURIComponent(safeTitle)}_audio.mp3`,
        isAudioOnly: true,
      },
    ],
  };
}

/**
 * Client-Side Master Resolver:
 * Resolves media links directly inside the browser when backend routes are not available or returning 405/404.
 */
export async function clientResolveVideo(url: string): Promise<VideoMetadata> {
  const platform = detectPlatform(url);

  switch (platform) {
    case 'tiktok':
      return await clientResolveTikTok(url);
    case 'youtube':
      return await clientResolveYouTube(url);
    case 'facebook':
    case 'instagram':
    default:
      return await clientResolveGeneral(url, platform);
  }
}

/**
 * Smart file download handler:
 * - Direct blob stream download for true offline/file saving with designated filenames
 * - Seamless fallback for cross-origin URLs
 */
export async function downloadMediaFile(url: string, filename: string): Promise<void> {
  // If it's a same-origin or proxy path, standard click triggers download directly
  if (url.startsWith('/')) {
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // If it's an external CDN link (e.g. TikTok CDN), attempt blob fetch so filename is honored
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      return;
    }
  } catch {
    // Cross-origin restrictions: open link directly in new tab or trigger direct download
  }

  // Fallback: Open in new tab or direct download anchor
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
