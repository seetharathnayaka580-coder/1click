export type Platform = 'tiktok' | 'youtube' | 'facebook' | 'instagram' | 'unknown';

export interface DownloadFormat {
  id: string;
  label: string;
  quality: string;
  extension: 'mp4' | 'mp3' | 'm4a' | 'webm';
  sizeFormatted?: string;
  downloadUrl: string;
  directUrl?: string;
  isAudioOnly: boolean;
  isNoWatermark?: boolean;
  badge?: string;
}

export interface VideoMetadata {
  id: string;
  originalUrl: string;
  platform: Platform;
  title: string;
  author: string;
  authorAvatar?: string;
  duration?: number;
  durationFormatted?: string;
  thumbnail: string;
  formats: DownloadFormat[];
  previewUrl?: string;
  stats?: {
    views?: string;
    likes?: string;
    comments?: string;
    shares?: string;
  };
}

export interface AnalyzeResponse {
  success: boolean;
  data?: VideoMetadata;
  error?: string;
  warning?: string;
}
