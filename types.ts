export enum Platform {
  LinkedIn = 'LinkedIn',
  Twitter = 'Twitter/X',
  Facebook = 'Facebook',
  Blog = 'Blog/Newsletter',
  InstantMessaging = 'Line / Telegram (快訊)'
}

export enum Tone {
  Professional = '專業分析 (Professional)',
  Bullish = '看多/樂觀 (Bullish)',
  Bearish = '看空/謹慎 (Bearish)',
  Educational = '科普教學 (Educational)'
}

export enum ImageStyle {
  Cyberpunk = '賽博龐克 (Cyberpunk)',
  Minimalist = '極簡主義 (Minimalist)',
  Isometric = '3D 等距 (3D Isometric)',
  Editorial = '新聞插畫 (Editorial)',
  Abstract = '抽象數據 (Abstract Data)',
  Realistic = '寫實攝影 (Photorealistic)'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface GeneratedResult {
  content: string;
  imagePrompt?: string;
  sources: GroundingSource[];
  timestamp: string;
  platform: Platform;
}

export interface GenerateRequest {
  topic: string;
  platform: Platform;
  tone: Tone;
  imageStyle: ImageStyle;
}

export interface HistoryItem {
  id: string;
  topic: string;
  timestamp: string;
  result: GeneratedResult;
}