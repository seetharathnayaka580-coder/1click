import React from 'react';
import { Sparkles, ShieldCheck, Zap, Headphones, CheckCircle2, Video, FileAudio, Smartphone } from 'lucide-react';

export const FeaturesGuide: React.FC = () => {
  const steps = [
    {
      num: '1',
      title: 'Copy Video Link',
      desc: 'Open TikTok, YouTube, Facebook, or Instagram and copy the share link of the video.',
    },
    {
      num: '2',
      title: 'Paste URL',
      desc: 'Paste the link into the 1Click Downloader input box above.',
    },
    {
      num: '3',
      title: 'Download HD or MP3',
      desc: 'Select your preferred format: HD Video (No Watermark) or High Quality MP3 Audio.',
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: 'No Watermark Video',
      desc: 'Downloads clean TikTok videos directly from original CDN servers with zero logo watermarks.',
      color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
    },
    {
      icon: Zap,
      title: 'Crystal Clear HD Quality',
      desc: 'Preserves full 1080p & 720p HD resolution and high-bitrate video streams.',
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    },
    {
      icon: Headphones,
      title: 'Studio MP3 Extraction',
      desc: 'Extracts crystal clear 320kbps MP3 audio tracks in one click for songs, podcasts, and sound clips.',
      color: 'text-purple-400 bg-purple-950/40 border-purple-800/40',
    },
    {
      icon: ShieldCheck,
      title: '100% Safe & Private',
      desc: 'No registration, no accounts, and no history stored on servers. Fast direct browser download.',
      color: 'text-blue-400 bg-blue-950/40 border-blue-800/40',
    },
  ];

  return (
    <div id="features-guide-section" className="w-full max-w-5xl mx-auto py-12 flex flex-col gap-12">
      {/* 3 Step Guide */}
      <div className="flex flex-col items-center text-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
          Simple 3-Step Process
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          How to Download Videos in Seconds
        </h2>
        <p className="text-sm text-zinc-400 max-w-xl">
          1Click Downloader delivers fast, watermark-free media extraction for all major social platforms.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-750 transition-colors relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black text-lg mb-4 shadow-lg shadow-emerald-500/10">
                {step.num}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature highlights grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col gap-3"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${feat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">{feat.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
