import React from 'react';
import { Clock, Trash2, Download, ExternalLink, Music, Video } from 'lucide-react';
import { Platform } from '../types.js';

export interface RecentItem {
  id: string;
  title: string;
  platform: Platform;
  formatLabel: string;
  downloadUrl: string;
  thumbnail?: string;
  timestamp: number;
}

interface RecentDownloadsProps {
  items: RecentItem[];
  onClear: () => void;
  onSelectUrl: (url: string) => void;
}

export const RecentDownloads: React.FC<RecentDownloadsProps> = ({
  items,
  onClear,
  onSelectUrl,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Recent Downloads ({items.length})</span>
        </div>

        <button
          onClick={onClear}
          className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
          title="Clear history"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      <div className="divide-y divide-zinc-800/60 mt-2">
        {items.slice(0, 5).map((item) => {
          const isAudio = item.formatLabel.toLowerCase().includes('mp3') || item.formatLabel.toLowerCase().includes('audio');

          return (
            <div
              key={item.id + item.timestamp}
              className="py-3 flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shrink-0 overflow-hidden">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : isAudio ? (
                    <Music className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Video className="w-4 h-4 text-emerald-400" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span className="capitalize text-zinc-400">{item.platform}</span>
                    <span>•</span>
                    <span className="text-emerald-400/90 font-medium">{item.formatLabel}</span>
                    <span>•</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <a
                href={item.downloadUrl}
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-all shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Re-Download</span>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
