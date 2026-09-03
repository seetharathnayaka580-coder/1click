import React, { useState, useEffect } from 'react';
import { Search, Clipboard, X, Loader2, ArrowRight, Video, Youtube, Facebook, Instagram, AlertCircle, Sparkles } from 'lucide-react';
import { Platform } from '../types.js';

interface SampleLink {
  platform: Platform;
  title: string;
  url: string;
  label: string;
}

interface UrlInputBarProps {
  url: string;
  setUrl: (url: string) => void;
  isLoading: boolean;
  onSubmit: (targetUrl?: string) => void;
  error?: string | null;
  onClearError: () => void;
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  url,
  setUrl,
  isLoading,
  onSubmit,
  error,
  onClearError,
}) => {
  const [samples, setSamples] = useState<SampleLink[]>([]);
  const [pasteSuccess, setPasteSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/sample-links')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSamples(data);
        }
      })
      .catch(() => {
        // Fallback default samples
        setSamples([
          {
            platform: 'tiktok',
            title: 'TikTok Viral',
            url: 'https://www.tiktok.com/@mrbeast/video/7448330707941805358',
            label: 'Try TikTok (No Watermark)',
          },
          {
            platform: 'youtube',
            title: 'YouTube HD',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            label: 'Try YouTube (HD/MP3)',
          },
          {
            platform: 'facebook',
            title: 'Facebook Clip',
            url: 'https://www.facebook.com/watch/?v=10153231379946729',
            label: 'Try Facebook (HD)',
          },
        ]);
      });
  }, []);

  const detectPlatform = (val: string): Platform => {
    const v = val.toLowerCase();
    if (v.includes('tiktok.com') || v.includes('douyin.com')) return 'tiktok';
    if (v.includes('youtube.com') || v.includes('youtu.be')) return 'youtube';
    if (v.includes('facebook.com') || v.includes('fb.watch') || v.includes('fb.com')) return 'facebook';
    if (v.includes('instagram.com') || v.includes('instagr.am')) return 'instagram';
    return 'unknown';
  };

  const currentPlatform = detectPlatform(url);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          onClearError();
          setPasteSuccess(true);
          setTimeout(() => setPasteSuccess(false), 2000);
          onSubmit(text.trim());
        }
      }
    } catch {
      // If clipboard permission is blocked, focus the input
      const input = document.getElementById('video-url-input');
      input?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit();
  };

  const getPlatformIcon = () => {
    switch (currentPlatform) {
      case 'tiktok':
        return <Video className="w-5 h-5 text-cyan-400" />;
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-500" />;
      case 'facebook':
        return <Facebook className="w-5 h-5 text-blue-500" />;
      case 'instagram':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      default:
        return <Search className="w-5 h-5 text-zinc-400" />;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
      {/* Form Container */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center bg-zinc-900/90 border border-zinc-700/80 hover:border-zinc-600 focus-within:border-emerald-500/80 rounded-2xl p-1.5 sm:p-2 shadow-2xl shadow-emerald-500/5 transition-all duration-300">
          {/* Leading Icon */}
          <div className="pl-3 pr-2 hidden sm:flex items-center justify-center">
            {getPlatformIcon()}
          </div>

          {/* Text Input */}
          <input
            id="video-url-input"
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) onClearError();
            }}
            placeholder="Paste TikTok, YouTube, Facebook, or Instagram video URL..."
            className="w-full bg-transparent px-3 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none"
            disabled={isLoading}
            autoComplete="off"
            spellCheck="false"
          />

          {/* Clear Button */}
          {url && (
            <button
              type="button"
              onClick={() => {
                setUrl('');
                onClearError();
              }}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors mr-1"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Paste Button */}
          <button
            type="button"
            onClick={handlePaste}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-750 hover:text-white border border-zinc-700 transition-all mr-2"
          >
            <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
            <span>{pasteSuccess ? 'Pasted!' : 'Paste'}</span>
          </button>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className={`inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm font-semibold text-zinc-950 transition-all duration-200 shadow-md ${
              isLoading || !url.trim()
                ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-emerald-500/20 active:scale-98'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                <span className="hidden sm:inline">Extracting...</span>
              </>
            ) : (
              <>
                <span>Download</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs sm:text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-red-200">{error}</p>
            <p className="text-red-400/80 mt-0.5 text-xs">
              Make sure the video link is public, accessible without private login, and formatted correctly.
            </p>
          </div>
          <button
            onClick={onClearError}
            className="text-red-400 hover:text-red-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Test Samples */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-zinc-400">
        <span className="flex items-center gap-1 text-zinc-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Quick Test Links:
        </span>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {samples.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setUrl(sample.url);
                onClearError();
                onSubmit(sample.url);
              }}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-zinc-850/80 hover:bg-zinc-800 border border-zinc-750 text-zinc-300 hover:text-white transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
