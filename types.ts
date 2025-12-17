export enum Platform {
  Blog = '方格子 (Vocus)',
  LinkedIn = 'LinkedIn',
  Twitter = 'Twitter/X',
  Facebook = 'Facebook',
  InstantMessaging = 'Telegram (快訊)'
}

export enum Tone {
  Professional = '專業分析 (Professional)',
  Bullish = '看多/樂觀 (Bullish)',
  Bearish = '看空/謹慎 (Bearish)',
  Educational = '科普教學 (Educational)'
}

export enum ImageStyle {
  Editorial = '新聞插畫 (Editorial)',
  Cyberpunk = '賽博龐克 (Cyberpunk)',
  Minimalist = '極簡主義 (Minimalist)',
  Isometric = '3D 等距 (3D Isometric)',
  Abstract = '抽象數據 (Abstract Data)',
  Realistic = '寫實攝影 (Photorealistic)'
}

export enum AIModel {
  Pro = 'gemini-3-pro-preview',
  Flash3 = 'gemini-3-flash-preview',
  Flash25 = 'gemini-2.5-flash',
  Flash2 = 'gemini-flash-latest'
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

export interface AppSettings {
  geminiApiKey: string;
  telegramBotToken: string;
  telegramChatId: string;
  preferredModel: AIModel;
}