import React, { useState } from 'react';
import {
  Download,
  Music,
  Video,
  Play,
  Pause,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Heart,
  Clock,
  Sparkles,
  Share2,
  Youtube,
  Facebook,
  Instagram,
} from 'lucide-react';
import { VideoMetadata, DownloadFormat } from '../types.js';
import { downloadMediaFile } from '../utils/clientResolvers.js';

interface VideoResultCardProps {
  metadata: VideoMetadata;
  onDownloadStarted: (format: DownloadFormat) => void;
}

export const VideoResultCard: React.FC<VideoResultCardProps> = ({
  metadata,
  onDownloadStarted,
}) => {
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const getPlatformBadge = () => {
    switch (metadata.platform) {
      case 'tiktok':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">
            <Video className="w-3.5 h-3.5" />
            TikTok (No Watermark)
          </span>
        );
      case 'youtube':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/80 text-red-400 border border-red-800/80">
            <Youtube className="w-3.5 h-3.5" />
            YouTube HD & MP3
          </span>
        );
      case 'facebook':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/80">
            <Facebook className="w-3.5 h-3.5" />
            Facebook HD
          </span>
        );
      case 'instagram':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-950/80 text-pink-400 border border-pink-800/80">
            <Instagram className="w-3.5 h-3.5" />
            Instagram Reel
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Video className="w-3.5 h-3.5" />
            Video Media
          </span>
        );
    }
  };

  const handleDownloadClick = (format: DownloadFormat) => {
    setDownloadingId(format.id);
    onDownloadStarted(format);

    const filename = `${metadata.title.replace(/[^a-zA-Z0-9_\-\. ]/g, '_').slice(0, 50)}_${format.quality}.${format.extension}`;
    downloadMediaFile(format.downloadUrl, filename);

    setTimeout(() => {
      setDownloadingId(null);
    }, 3000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(metadata.originalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-900/90 border border-zinc-750/80 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl">
      {/* Header section: Platform and Share */}
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          {getPlatformBadge()}
          <span className="text-xs text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Ready for Download
          </span>
        </div>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/80 transition-all"
          title="Copy original link"
        >
          {copiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6">
        {/* Thumbnail / Preview Player (5 cols on md) */}
        <div className="md:col-span-5 flex flex-col gap-3">
          <div className="relative aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 group shadow-inner">
            {isPlayingPreview && metadata.previewUrl ? (
              <video
                src={metadata.previewUrl}
                controls
                autoPlay
                className="w-full h-full object-contain bg-black"
              />
            ) : (
              <>
                {metadata.thumbnail ? (
                  <img
                    src={metadata.thumbnail}
                    alt={metadata.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-gradient-to-b from-zinc-900 to-zinc-950">
                    <Video className="w-12 h-12 mb-2 stroke-1" />
                    <span className="text-xs font-medium text-zinc-500">Video Preview</span>
                  </div>
                )}

                {/* Duration Badge */}
                {metadata.durationFormatted && (
                  <div className="absolute bottom-3 right-3 bg-zinc-950/80 backdrop-blur-md text-white text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border border-zinc-800">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    {metadata.durationFormatted}
                  </div>
                )}

                {/* Play Button Overlay */}
                {metadata.previewUrl && (
                  <button
                    onClick={() => setIsPlayingPreview(true)}
                    className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-emerald-500/90 text-zinc-950 flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-transform"
                    title="Play Preview"
                  >
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Toggle preview button if video is playing */}
          {isPlayingPreview && (
            <button
              onClick={() => setIsPlayingPreview(false)}
              className="text-xs text-zinc-400 hover:text-white py-1 flex items-center justify-center gap-1"
            >
              <Pause className="w-3.5 h-3.5" />
              Close Player
            </button>
          )}
        </div>

        {/* Details & Download Options (7 cols on md) */}
        <div className="md:col-span-7 flex flex-col justify-between gap-5">
          {/* Title & Author */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug line-clamp-2">
              {metadata.title}
            </h2>

            <div className="flex items-center gap-3 mt-2 text-sm text-zinc-400">
              {metadata.authorAvatar && (
                <img
                  src={metadata.authorAvatar}
                  alt={metadata.author}
                  className="w-6 h-6 rounded-full object-cover border border-zinc-700"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="font-medium text-zinc-300">{metadata.author}</span>
            </div>

            {/* Stats chips */}
            {metadata.stats && (
              <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400">
                {metadata.stats.views && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{metadata.stats.views} views</span>
                  </div>
                )}
                {metadata.stats.likes && (
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-pink-500/80" />
                    <span>{metadata.stats.likes}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Available Formats Section */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              Download Formats
            </span>

            <div className="flex flex-col gap-2.5">
              {metadata.formats.map((fmt) => {
                const isDownloading = downloadingId === fmt.id;
                const isAudio = fmt.isAudioOnly;

                return (
                  <div
                    key={fmt.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                      fmt.badge === 'Best Quality' || fmt.isNoWatermark
                        ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-500/70'
                        : isAudio
                        ? 'bg-purple-950/20 border-purple-500/30 hover:border-purple-500/60'
                        : 'bg-zinc-850/60 border-zinc-750 hover:border-zinc-650'
                    }`}
                  >
                    {/* Format Label & Quality */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isAudio
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : fmt.isNoWatermark
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {isAudio ? (
                          <Music className="w-4 h-4" />
                        ) : (
                          <Video className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {fmt.label}
                          </span>
                          {fmt.badge && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                                isAudio
                                  ? 'bg-purple-900/60 text-purple-300 border-purple-700/50'
                                  : 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50'
                              }`}
                            >
                              {fmt.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-400">
                          {fmt.quality} • {fmt.extension.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Download Button */}
                    <button
                      type="button"
                      onClick={() => handleDownloadClick(fmt)}
                      disabled={isDownloading}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 shadow-md ${
                        isDownloading
                          ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/50'
                          : isAudio
                          ? 'bg-purple-500 hover:bg-purple-400 text-zinc-950 shadow-purple-500/20'
                          : fmt.isNoWatermark
                          ? 'bg-emerald-400 hover:bg-emerald-300 text-zinc-950 shadow-emerald-500/20'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Starting...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>{isAudio ? 'Get MP3' : 'Get Video'}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
