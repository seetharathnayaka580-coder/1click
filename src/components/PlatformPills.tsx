import React from 'react';
import { Video, Youtube, Instagram, Facebook, Flame } from 'lucide-react';
import { Platform } from '../types.js';

interface PlatformPillsProps {
  selectedPlatform: Platform | 'all';
  onSelect: (platform: Platform | 'all') => void;
}

export const PlatformPills: React.FC<PlatformPillsProps> = ({ selectedPlatform, onSelect }) => {
  const platforms = [
    {
      id: 'all' as const,
      label: 'All Supported',
      icon: Flame,
      color: 'hover:border-zinc-700',
      badge: '4 Platforms',
    },
    {
      id: 'tiktok' as const,
      label: 'TikTok',
      icon: Video,
      badge: 'No Watermark',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60',
    },
    {
      id: 'youtube' as const,
      label: 'YouTube',
      icon: Youtube,
      badge: '1080p & MP3',
      badgeColor: 'text-red-400 bg-red-950/60 border-red-800/60',
    },
    {
      id: 'facebook' as const,
      label: 'Facebook',
      icon: Facebook,
      badge: 'HD Video',
      badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800/60',
    },
    {
      id: 'instagram' as const,
      label: 'Instagram',
      icon: Instagram,
      badge: 'Reels & MP4',
      badgeColor: 'text-pink-400 bg-pink-950/60 border-pink-800/60',
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2">
      {platforms.map((p) => {
        const Icon = p.icon;
        const isActive = selectedPlatform === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border ${
              isActive
                ? 'bg-zinc-800/90 text-white border-emerald-500/60 shadow-md shadow-emerald-500/10'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-850 hover:border-zinc-700'
            }`}
          >
            <Icon
              className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                p.id === 'youtube'
                  ? 'text-red-500'
                  : p.id === 'instagram'
                  ? 'text-pink-500'
                  : p.id === 'facebook'
                  ? 'text-blue-500'
                  : p.id === 'tiktok'
                  ? 'text-cyan-400'
                  : 'text-emerald-400'
              }`}
            />
            <span>{p.label}</span>
            {p.badge && (
              <span
                className={`hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                  p.badgeColor || 'text-zinc-400 bg-zinc-800 border-zinc-700'
                }`}
              >
                {p.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
