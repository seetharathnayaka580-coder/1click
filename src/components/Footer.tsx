import React from 'react';
import { Download, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-zinc-800/80 bg-zinc-950 py-10 mt-16 text-zinc-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Download className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-zinc-300">1Click Downloader</span>
          <span>•</span>
          <span>Fast Video & MP3 Extraction</span>
        </div>

        <p className="text-center text-zinc-500 max-w-md leading-relaxed text-[11px]">
          1Click Downloader does not host or store copyrighted videos. We provide a direct streaming protocol for personal archiving. Please respect copyright and original content creators.
        </p>

        <div className="flex items-center gap-1 text-zinc-400 text-xs">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          <span>for creators</span>
        </div>
      </div>
    </footer>
  );
};
