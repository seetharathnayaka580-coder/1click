import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Does 1Click Downloader remove TikTok watermarks?',
      a: 'Yes! When you download a TikTok video through 1Click Downloader, our engine queries the original source CDN stream directly before TikTok renders their bouncing logo and username watermark. The resulting MP4 video is 100% watermark-free.',
    },
    {
      q: 'Can I download only the MP3 audio?',
      a: 'Absolutely. For every video analyzed (TikTok, YouTube, Facebook, and Instagram), 1Click Downloader provides a dedicated "Audio Only (MP3)" option. You can save songs, background music, podcast excerpts, or speeches directly as high-bitrate MP3 files.',
    },
    {
      q: 'What video quality and resolutions are supported?',
      a: 'We support Full HD 1080p, HD 720p, and SD 480p/360p. If the source video was uploaded in 4K or 1080p, 1Click Downloader extracts the highest available resolution.',
    },
    {
      q: 'Where are downloaded files saved on my device?',
      a: 'Files are saved to your browser’s default "Downloads" folder. On Windows and Mac, check your "Downloads" directory. On Android or iOS iPhone, files are stored in your Files app or Downloads folder and can be moved to your Photo Library.',
    },
    {
      q: 'Is there any limit or fee for using 1Click Downloader?',
      a: '1Click Downloader is 100% free with unlimited downloads. No credit card, account registration, or software installation is required.',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-5 h-5 text-emerald-400" />
        <h2 className="text-xl font-bold text-white tracking-tight">
          Frequently Asked Questions
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 hover:bg-zinc-850/50 transition-colors"
              >
                <span className="text-sm font-semibold text-zinc-200">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/40">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
