import { execFile, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getFbVideoInfo } from 'fb-downloader-scrapper';
import { Platform, VideoMetadata, DownloadFormat } from '../src/types.js';

const YTDLP_PATH = path.resolve(process.cwd(), 'yt-dlp');

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

export function formatDuration(seconds?: number): string {
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

export function sanitizeFilename(name: string): string {
  // Strip invalid file system characters: / \ : * ? " < > |
  let cleaned = name
    .replace(/[/\\:*?"<>|]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 50);

  // If title was only symbols or stripped
  if (!cleaned || /^[_\-.]+$/.test(cleaned)) {
    cleaned = 'Video_Media';
  }
  return cleaned;
}

export async function unshortenUrl(rawUrl: string): Promise<string> {
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

// 1. TikTok Resolver via TikWM API
async function resolveTikTok(url: string): Promise<VideoMetadata> {
  const finalUrl = await unshortenUrl(url);
  const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(finalUrl)}&hd=1`;
  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  const json: any = await response.json();
  if (json.code === 0 && json.data) {
    const d = json.data;
    const title = d.title || 'TikTok Video';
    const author = d.author?.unique_id ? `@${d.author.unique_id}` : (d.author?.nickname || 'TikTok Creator');
    const safeTitle = sanitizeFilename(title);

    const formats: DownloadFormat[] = [];

    // HD No Watermark
    if (d.hdplay) {
      formats.push({
        id: 'tiktok-hd',
        label: 'HD Video (No Watermark)',
        quality: '1080p HD',
        extension: 'mp4',
        isNoWatermark: true,
        badge: 'Best Quality',
        downloadUrl: d.hdplay,
        directUrl: d.hdplay,
        isAudioOnly: false,
      });
    }

    // Standard No Watermark
    if (d.play) {
      formats.push({
        id: 'tiktok-sd',
        label: d.hdplay ? 'Standard Video (No Watermark)' : 'HD Video (No Watermark)',
        quality: '720p / Original',
        extension: 'mp4',
        isNoWatermark: true,
        badge: d.hdplay ? undefined : 'Recommended',
        downloadUrl: d.play,
        directUrl: d.play,
        isAudioOnly: false,
      });
    }

    // MP3 Audio Only
    if (d.music) {
      formats.push({
        id: 'tiktok-mp3',
        label: 'Audio Only (MP3)',
        quality: '320kbps MP3',
        extension: 'mp3',
        isAudioOnly: true,
        badge: 'High Quality',
        downloadUrl: d.music,
        directUrl: d.music,
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

  // Fallback if TikWM returned error
  if (json.msg?.includes('Url parsing is failed') || json.code === -1) {
    throw new Error('Could not parse this TikTok link. Please make sure the full share URL was copied and that the video is public.');
  }
  throw new Error(json.msg || 'Could not fetch TikTok video. Please ensure the video is public.');
}

// 2. YouTube Resolver via yt-dlp
async function resolveYouTube(url: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    execFile(
      YTDLP_PATH,
      ['--dump-json', '--no-playlist', '--no-warnings', '--js-runtimes', 'node', url],
      { maxBuffer: 10 * 1024 * 1024, timeout: 25000 },
      (err, stdout, stderr) => {
        if (err) {
          return reject(new Error(`Failed to extract YouTube video: ${stderr || err.message}`));
        }

        try {
          const info = JSON.parse(stdout);
          const title = info.title || 'YouTube Video';
          const author = info.uploader || info.channel || 'YouTube Channel';
          const safeTitle = sanitizeFilename(title);

          const formats: DownloadFormat[] = [];

          // 1. Full HD / Best Video (1080p / 720p)
          formats.push({
            id: 'yt-hd-1080',
            label: 'Full HD Video (MP4)',
            quality: '1080p / 720p HD',
            extension: 'mp4',
            badge: 'Best Video',
            downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best&ext=mp4&filename=${encodeURIComponent(safeTitle)}_HD.mp4`,
            isAudioOnly: false,
          });

          // 2. Standard 720p / 480p Video
          formats.push({
            id: 'yt-sd-720',
            label: 'Standard Video (MP4)',
            quality: '720p / 480p',
            extension: 'mp4',
            downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=best[height<=720][ext=mp4]/best[height<=720]/best&ext=mp4&filename=${encodeURIComponent(safeTitle)}_SD.mp4`,
            isAudioOnly: false,
          });

          // 3. Compact 360p Video
          formats.push({
            id: 'yt-mobile-360',
            label: 'Mobile Video (MP4)',
            quality: '360p Fast',
            extension: 'mp4',
            downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=best[height<=360][ext=mp4]/best[height<=360]/best&ext=mp4&filename=${encodeURIComponent(safeTitle)}_360p.mp4`,
            isAudioOnly: false,
          });

          // 4. MP3 Audio Only
          formats.push({
            id: 'yt-mp3',
            label: 'Audio Only (MP3)',
            quality: '320kbps MP3',
            extension: 'mp3',
            isAudioOnly: true,
            badge: 'HQ Audio',
            downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=audio&ext=mp3&filename=${encodeURIComponent(safeTitle)}_audio.mp3`,
          });

          resolve({
            id: info.id || String(Date.now()),
            originalUrl: url,
            platform: 'youtube',
            title,
            author,
            duration: info.duration,
            durationFormatted: formatDuration(info.duration),
            thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`,
            previewUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=18/best[height<=360]&ext=mp4&filename=${encodeURIComponent(safeTitle)}_preview.mp4`,
            formats,
            stats: {
              views: info.view_count ? Number(info.view_count).toLocaleString() : undefined,
              likes: info.like_count ? Number(info.like_count).toLocaleString() : undefined,
            },
          });
        } catch (e: any) {
          reject(new Error(`Failed to parse YouTube metadata: ${e.message}`));
        }
      }
    );
  });
}

// 3. Facebook Resolver via fb-downloader-scrapper & yt-dlp
async function resolveFacebook(url: string): Promise<VideoMetadata> {
  try {
    const res: any = await getFbVideoInfo(url);
    if (res && (res.hd || res.sd)) {
      const title = res.title || 'Facebook Video';
      const safeTitle = sanitizeFilename(title);
      const durationSec = res.duration_ms ? Math.round(res.duration_ms / 1000) : undefined;

      const formats: DownloadFormat[] = [];

      if (res.hd) {
        formats.push({
          id: 'fb-hd',
          label: 'HD Video (High Definition)',
          quality: 'HD 720p/1080p',
          extension: 'mp4',
          badge: 'Recommended',
          downloadUrl: res.hd,
          directUrl: res.hd,
          isAudioOnly: false,
        });
      }

      if (res.sd) {
        formats.push({
          id: 'fb-sd',
          label: 'Standard Video (SD)',
          quality: 'SD 480p',
          extension: 'mp4',
          downloadUrl: res.sd,
          directUrl: res.sd,
          isAudioOnly: false,
        });
      }

      // MP3 Audio Only
      const sourceStream = res.hd || res.sd;
      formats.push({
        id: 'fb-mp3',
        label: 'Audio Only (MP3)',
        quality: 'HQ MP3 Audio',
        extension: 'mp3',
        isAudioOnly: true,
        badge: 'HQ Audio',
        downloadUrl: sourceStream,
        directUrl: sourceStream,
      });

      return {
        id: String(Date.now()),
        originalUrl: url,
        platform: 'facebook',
        title,
        author: 'Facebook Creator',
        duration: durationSec,
        durationFormatted: formatDuration(durationSec),
        thumbnail: res.thumbnail || '',
        previewUrl: res.hd || res.sd,
        formats,
      };
    }
  } catch (err) {
    // Proceed to yt-dlp fallback
  }

  // Fallback to yt-dlp
  return new Promise((resolve, reject) => {
    execFile(
      YTDLP_PATH,
      ['--dump-json', '--no-playlist', '--no-warnings', url],
      { maxBuffer: 10 * 1024 * 1024, timeout: 25000 },
      (err, stdout, stderr) => {
        if (err) {
          return reject(new Error('Could not fetch Facebook video. Ensure the video is public.'));
        }
        try {
          const info = JSON.parse(stdout);
          const title = info.title || 'Facebook Video';
          const safeTitle = sanitizeFilename(title);

          const formats: DownloadFormat[] = [
            {
              id: 'fb-hd-dlp',
              label: 'HD Video (MP4)',
              quality: 'Best Available',
              extension: 'mp4',
              badge: 'Best Quality',
              downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=best[ext=mp4]/best&ext=mp4&filename=${encodeURIComponent(safeTitle)}_HD.mp4`,
              isAudioOnly: false,
            },
            {
              id: 'fb-mp3-dlp',
              label: 'Audio Only (MP3)',
              quality: 'HQ MP3',
              extension: 'mp3',
              isAudioOnly: true,
              badge: 'Audio Only',
              downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=audio&ext=mp3&filename=${encodeURIComponent(safeTitle)}_audio.mp3`,
            },
          ];

          resolve({
            id: info.id || String(Date.now()),
            originalUrl: url,
            platform: 'facebook',
            title,
            author: info.uploader || 'Facebook User',
            duration: info.duration,
            durationFormatted: formatDuration(info.duration),
            thumbnail: info.thumbnail || '',
            previewUrl: info.url,
            formats,
          });
        } catch (e: any) {
          reject(new Error(`Failed to parse Facebook video: ${e.message}`));
        }
      }
    );
  });
}

// 4. Instagram Resolver
async function resolveInstagram(url: string): Promise<VideoMetadata> {
  // First attempt: yt-dlp
  const tryYtdlp = (): Promise<VideoMetadata> => {
    return new Promise((resolve, reject) => {
      execFile(
        YTDLP_PATH,
        ['--dump-json', '--no-playlist', '--no-warnings', url],
        { maxBuffer: 10 * 1024 * 1024, timeout: 20000 },
        (err, stdout) => {
          if (err || !stdout) {
            return reject(new Error('yt-dlp failed'));
          }
          try {
            const info = JSON.parse(stdout);
            const title = info.title || info.description?.slice(0, 60) || 'Instagram Reel';
            const safeTitle = sanitizeFilename(title);

            const formats: DownloadFormat[] = [
              {
                id: 'ig-hd',
                label: 'HD Video (Original Quality)',
                quality: 'HD MP4',
                extension: 'mp4',
                badge: 'Original HD',
                downloadUrl: info.url || `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=best&ext=mp4&filename=${encodeURIComponent(safeTitle)}_HD.mp4`,
                directUrl: info.url || undefined,
                isAudioOnly: false,
              },
              {
                id: 'ig-mp3',
                label: 'Audio Only (MP3)',
                quality: 'HQ MP3 Audio',
                extension: 'mp3',
                isAudioOnly: true,
                badge: 'HQ Audio',
                downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=audio&ext=mp3&filename=${encodeURIComponent(safeTitle)}_audio.mp3`,
              },
            ];

            resolve({
              id: info.id || String(Date.now()),
              originalUrl: url,
              platform: 'instagram',
              title,
              author: info.uploader || 'Instagram User',
              duration: info.duration,
              durationFormatted: formatDuration(info.duration),
              thumbnail: info.thumbnail || '',
              previewUrl: info.url,
              formats,
            });
          } catch (e: any) {
            reject(e);
          }
        }
      );
    });
  };

  try {
    return await tryYtdlp();
  } catch (error) {
    // If Instagram blocks datacenter request directly, provide standard direct downloader format
    // or parse shortcode for guidance
    const shortcodeMatch = url.match(/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/);
    const shortcode = shortcodeMatch ? shortcodeMatch[1] : 'video';
    const safeTitle = `Instagram_Reel_${shortcode}`;

    // Return structured metadata with direct extraction stream
    return {
      id: shortcode,
      originalUrl: url,
      platform: 'instagram',
      title: `Instagram Reel (${shortcode})`,
      author: 'Instagram Creator',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      durationFormatted: '0:30',
      formats: [
        {
          id: 'ig-hd-stream',
          label: 'HD Video (MP4)',
          quality: 'Original 1080p HD',
          extension: 'mp4',
          badge: 'No Watermark',
          downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=best&ext=mp4&filename=${encodeURIComponent(safeTitle)}_HD.mp4`,
          isAudioOnly: false,
        },
        {
          id: 'ig-mp3-stream',
          label: 'Audio Only (MP3)',
          quality: 'HQ MP3 Audio',
          extension: 'mp3',
          isAudioOnly: true,
          badge: 'Audio Only',
          downloadUrl: `/api/download-stream?sourceUrl=${encodeURIComponent(url)}&format=audio&ext=mp3&filename=${encodeURIComponent(safeTitle)}_audio.mp3`,
        },
      ],
    };
  }
}

// 5. General Video Resolver (Direct MP4 / WebM / Generic Sites)
async function resolveGeneral(url: string): Promise<VideoMetadata> {
  const safeTitle = sanitizeFilename(path.basename(new URL(url).pathname) || 'Media_File');

  return {
    id: String(Date.now()),
    originalUrl: url,
    platform: 'unknown',
    title: safeTitle,
    author: 'Direct Video Source',
    thumbnail: '',
    formats: [
      {
        id: 'gen-mp4',
        label: 'Original Video (MP4)',
        quality: 'Source Quality',
        extension: 'mp4',
        badge: 'Direct Download',
        downloadUrl: `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(safeTitle)}.mp4&format=mp4`,
        isAudioOnly: false,
      },
      {
        id: 'gen-mp3',
        label: 'Convert to MP3 (Audio Only)',
        quality: '320kbps MP3',
        extension: 'mp3',
        isAudioOnly: true,
        badge: 'HQ Audio',
        downloadUrl: `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(safeTitle)}_audio.mp3&format=mp3&convertAudio=true`,
      },
    ],
  };
}

// Master Resolve function
export async function resolveVideo(url: string): Promise<VideoMetadata> {
  const finalUrl = await unshortenUrl(url);
  const platform = detectPlatform(finalUrl);

  switch (platform) {
    case 'tiktok':
      return await resolveTikTok(finalUrl);
    case 'youtube':
      return await resolveYouTube(finalUrl);
    case 'facebook':
      return await resolveFacebook(finalUrl);
    case 'instagram':
      return await resolveInstagram(finalUrl);
    default:
      return await resolveGeneral(finalUrl);
  }
}
