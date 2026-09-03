import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import axios from 'axios';
import { detectPlatform, resolveVideo } from './server/resolvers.js';

const SAMPLE_LINKS = [
  {
    platform: 'tiktok',
    title: 'MrBeast Viral Clip (No Watermark)',
    url: 'https://www.tiktok.com/@mrbeast/video/7448330707941805358',
    label: 'Try TikTok',
  },
  {
    platform: 'youtube',
    title: 'Rick Astley - Never Gonna Give You Up (4K)',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    label: 'Try YouTube',
  },
  {
    platform: 'facebook',
    title: 'How to share with just friends',
    url: 'https://www.facebook.com/watch/?v=10153231379946729',
    label: 'Try Facebook',
  },
  {
    platform: 'instagram',
    title: 'Instagram Travel Reel',
    url: 'https://www.instagram.com/reel/Dcw9mxTJy/',
    label: 'Try Instagram',
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: '1Click Downloader' });
  });

  // 2. Sample links for 1-click test
  app.get('/api/sample-links', (req, res) => {
    res.json(SAMPLE_LINKS);
  });

  // 3. Analyze Video URL
  app.post('/api/analyze', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid HTTP/HTTPS video URL.',
        });
      }

      const cleanUrl = url.trim();
      const metadata = await resolveVideo(cleanUrl);
      return res.json({ success: true, data: metadata });
    } catch (err: any) {
      console.error('Analyze error:', err.message);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch video information. Please verify the URL is public and try again.',
      });
    }
  });

  // 4. Download proxy for direct CDN media (TikTok CDN, Facebook CDN, etc.)
  app.get('/api/download', async (req, res) => {
    try {
      const mediaUrl = req.query.url as string;
      const filename = (req.query.filename as string) || 'download.mp4';
      const format = (req.query.format as string) || 'mp4';
      const convertAudio = req.query.convertAudio === 'true';

      if (!mediaUrl) {
        return res.status(400).send('Missing media URL');
      }

      const encodedFilename = encodeURIComponent(filename).replace(/['()]/g, escape);

      // If audio transcoding with ffmpeg is requested
      if (convertAudio || format === 'mp3') {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);

        const ffmpeg = spawn('ffmpeg', [
          '-i', mediaUrl,
          '-vn',
          '-acodec', 'libmp3lame',
          '-ab', '192k',
          '-ar', '44100',
          '-f', 'mp3',
          'pipe:1',
        ]);

        ffmpeg.stdout.pipe(res);

        ffmpeg.stderr.on('data', () => {
          // Log ffmpeg progress if needed
        });

        ffmpeg.on('error', (err) => {
          console.error('FFmpeg process error:', err);
          if (!res.headersSent) {
            res.status(500).send('Audio conversion failed');
          }
        });

        req.on('close', () => {
          ffmpeg.kill('SIGKILL');
        });

        return;
      }

      // Direct video stream pipe
      const response = await axios({
        method: 'get',
        url: mediaUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: 'https://www.tiktok.com/',
        },
        timeout: 30000,
      });

      const rawContentType = response.headers['content-type'];
      const contentType = format === 'mp3' ? 'audio/mpeg' : (rawContentType ? String(rawContentType) : 'video/mp4');
      const contentLength = response.headers['content-length'];

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);
      if (contentLength) {
        res.setHeader('Content-Length', String(contentLength));
      }

      response.data.pipe(res);

      req.on('close', () => {
        if (response.data.destroy) {
          response.data.destroy();
        }
      });
    } catch (err: any) {
      console.error('Download stream error:', err.message);
      if (!res.headersSent) {
        res.status(500).send(`Failed to stream download: ${err.message}`);
      }
    }
  });

  // 5. Download-stream proxy via yt-dlp (for YouTube and stream extractions)
  app.get('/api/download-stream', (req, res) => {
    const sourceUrl = req.query.sourceUrl as string;
    const formatReq = (req.query.format as string) || 'best';
    const filename = (req.query.filename as string) || 'video.mp4';
    const ext = (req.query.ext as string) || 'mp4';

    if (!sourceUrl) {
      return res.status(400).send('Missing source URL');
    }

    const encodedFilename = encodeURIComponent(filename).replace(/['()]/g, escape);
    const contentType = ext === 'mp3' ? 'audio/mpeg' : 'video/mp4';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`);

    const args: string[] = [
      '--no-playlist',
      '--no-warnings',
      '--js-runtimes', 'node',
    ];

    if (ext === 'mp3' || formatReq === 'audio') {
      args.push('-x', '--audio-format', 'mp3', '-o', '-', sourceUrl);
    } else {
      args.push('-f', formatReq, '-o', '-', sourceUrl);
    }

    const ytdlp = spawn(path.resolve(process.cwd(), 'yt-dlp'), args);

    ytdlp.stdout.pipe(res);

    ytdlp.stderr.on('data', (d) => {
      // console.log('yt-dlp stderr:', d.toString());
    });

    ytdlp.on('error', (err) => {
      console.error('yt-dlp execution error:', err);
      if (!res.headersSent) {
        res.status(500).send('Download processing failed');
      }
    });

    req.on('close', () => {
      ytdlp.kill('SIGKILL');
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`1Click Downloader Server running on http://localhost:${PORT}`);
  });
}

startServer();
