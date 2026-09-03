import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { PlatformPills } from './components/PlatformPills.js';
import { UrlInputBar } from './components/UrlInputBar.js';
import { VideoResultCard } from './components/VideoResultCard.js';
import { RecentDownloads, RecentItem } from './components/RecentDownloads.js';
import { FeaturesGuide } from './components/FeaturesGuide.js';
import { FaqSection } from './components/FaqSection.js';
import { Footer } from './components/Footer.js';
import { Platform, VideoMetadata, DownloadFormat } from './types.js';
import { clientResolveVideo } from './utils/clientResolvers.js';
import { CheckCircle2, DownloadCloud, Sparkles } from 'lucide-react';

const RECENT_KEY = '1click_recent_downloads_v1';

export default function App() {
  const [url, setUrl] = useState('');
  const [activePlatform, setActivePlatform] = useState<Platform | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoMetadata | null>(null);
  const [recentDownloads, setRecentDownloads] = useState<RecentItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load recent downloads from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) {
        setRecentDownloads(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAnalyze = async (overrideUrl?: string) => {
    const targetUrl = (overrideUrl || url).trim();
    if (!targetUrl) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    let resolvedData: any = null;
    let failureReason: string | null = null;

    // 1. First attempt: Call the backend / Cloudflare Worker API endpoint
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        if (response.ok && json.success && json.data) {
          resolvedData = json.data;
        } else if (json.error) {
          failureReason = json.error;
        }
      }
    } catch {
      // Backend not reached or static deployment (Cloudflare Pages, etc.)
    }

    // 2. Second attempt: Client-side resolver fallback
    if (!resolvedData) {
      try {
        resolvedData = await clientResolveVideo(targetUrl);
      } catch (clientErr: any) {
        if (!failureReason) {
          failureReason = clientErr.message;
        }
      }
    }

    if (resolvedData) {
      setResult(resolvedData);
      if (resolvedData.platform !== 'unknown') {
        setActivePlatform(resolvedData.platform);
      }
    } else {
      setError(
        failureReason ||
          'Could not extract media from this URL. Please ensure the link is public, accessible without private login, and formatted correctly.'
      );
    }

    setIsLoading(false);
  };

  const handleDownloadStarted = (format: DownloadFormat) => {
    if (!result) return;

    // Show toast
    setToastMessage(`Downloading "${result.title.slice(0, 35)}..." (${format.label})`);
    setTimeout(() => setToastMessage(null), 4000);

    // Save to recents
    const newItem: RecentItem = {
      id: result.id,
      title: result.title,
      platform: result.platform,
      formatLabel: format.label,
      downloadUrl: format.downloadUrl,
      thumbnail: result.thumbnail,
      timestamp: Date.now(),
    };

    setRecentDownloads((prev) => {
      const filtered = prev.filter((p) => p.downloadUrl !== format.downloadUrl);
      const updated = [newItem, ...filtered].slice(0, 10);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearRecents = () => {
    setRecentDownloads([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // ignore
    }
  };

  const scrollToGuide = () => {
    const el = document.getElementById('features-guide-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-zinc-950">
      <Header onScrollToGuide={scrollToGuide} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-16 flex flex-col gap-10">
        {/* Hero Title & Subtitle */}
        <div className="flex flex-col items-center text-center gap-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast, Free & Unlimited Online Media Downloader</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Download Video <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Without Watermark</span> & MP3
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
            Download high-definition videos from <strong className="text-zinc-200">TikTok</strong>, <strong className="text-zinc-200">YouTube</strong>, <strong className="text-zinc-200">Facebook</strong>, and <strong className="text-zinc-200">Instagram</strong> or extract audio as <strong className="text-emerald-400">MP3</strong> with 1 click.
          </p>

          {/* Platform Pills */}
          <div className="w-full mt-2">
            <PlatformPills
              selectedPlatform={activePlatform}
              onSelect={(p) => setActivePlatform(p)}
            />
          </div>
        </div>

        {/* Input Bar */}
        <UrlInputBar
          url={url}
          setUrl={setUrl}
          isLoading={isLoading}
          onSubmit={handleAnalyze}
          error={error}
          onClearError={() => setError(null)}
        />

        {/* Extracted Video Result Card */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <VideoResultCard
              metadata={result}
              onDownloadStarted={handleDownloadStarted}
            />
          </div>
        )}

        {/* Recent Downloads */}
        <RecentDownloads
          items={recentDownloads}
          onClear={handleClearRecents}
          onSelectUrl={(u) => {
            setUrl(u);
            handleAnalyze(u);
          }}
        />

        {/* How it Works & Features Guide */}
        <FeaturesGuide />

        {/* FAQ Section */}
        <FaqSection />
      </main>

      <Footer />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-zinc-900 border border-emerald-500/50 shadow-2xl shadow-emerald-500/10 text-xs sm:text-sm text-white animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
