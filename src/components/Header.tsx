import React from 'react';
import { Download, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onScrollToGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onScrollToGuide }) => {
  return (
    <header className="w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
              <Download className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white font-sans">
                1Click<span className="text-emerald-400">Downloader</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5">
                <Sparkles className="w-3 h-3" />
                HD & MP3
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 font-medium">
              TikTok • YouTube • Facebook • Instagram
            </span>
          </div>
        </div>

        {/* Status and Action */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>High-Speed Direct Engine</span>
          </div>

          <button
            onClick={onScrollToGuide}
            className="text-xs font-medium text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            How it Works
          </button>
        </div>
      </div>
    </header>
  );
};
