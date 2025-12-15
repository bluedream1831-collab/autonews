import React, { useState } from 'react';
import { Platform, Tone, ImageStyle, GenerateRequest } from '../types';
import { getTrendingTopics } from '../services/geminiService';
import { Send, TrendingUp, Loader2, Tag, Flame, RefreshCw, Palette } from 'lucide-react';

interface InputFormProps {
  onGenerate: (req: GenerateRequest) => void;
  isLoading: boolean;
}

const QUICK_TAGS = [
  "NVIDIA (NVDA)", 
  "台積電 (2330)", 
  "聯準會 (Fed)", 
  "蘋果 (AAPL)", 
  "AMD", 
  "特斯拉 (TSLA)",
  "美股大盤"
];

const InputForm: React.FC<InputFormProps> = ({ onGenerate, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<Platform>(Platform.Blog);
  const [tone, setTone] = useState<Tone>(Tone.Professional);
  const [imageStyle, setImageStyle] = useState<ImageStyle>(ImageStyle.Editorial);
  
  // Trending Topics State
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [hasFetchedTrending, setHasFetchedTrending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onGenerate({ topic, platform, tone, imageStyle });
  };

  const addTag = (tag: string) => {
    if (topic.includes(tag)) return;
    const newTopic = topic ? `${topic}，${tag}` : tag;
    setTopic(newTopic);
  };

  const handleFetchTrending = async () => {
    setIsTrendingLoading(true);
    try {
      const topics = await getTrendingTopics();
      setTrendingTopics(topics);
      setHasFetchedTrending(true);
    } catch (error) {
      console.error(error);
      alert("無法取得熱搜，請稍後再試");
    } finally {
      setIsTrendingLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-850 p-6 rounded-xl border border-slate-700 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-primary-500">
          <TrendingUp className="w-6 h-6" />
          <h2 className="text-xl font-bold text-white">貼文參數設定</h2>
        </div>
      </div>

      <div className="space-y-6">
        {/* Topic Input */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            核心主題 / 股票代號 / 新聞事件
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：NVIDIA 財報分析、台積電高雄廠進度、聯準會降息對科技股影響..."
            className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none transition-all placeholder-slate-600 h-24 resize-none"
            required
          />
          
          {/* Trending & Quick Tags Section */}
          <div className="mt-4 space-y-4">
            {/* Real-time Trending */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 uppercase tracking-wide">
                  <Flame className="w-3.5 h-3.5" />
                  即時熱搜 (Real-time Trends)
                </div>
                <button 
                  type="button"
                  onClick={handleFetchTrending}
                  disabled={isTrendingLoading}
                  className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isTrendingLoading ? 'animate-spin' : ''}`} />
                  {hasFetchedTrending ? '刷新' : '載入'}
                </button>
              </div>
              
              {!hasFetchedTrending && !isTrendingLoading && (
                <div 
                  onClick={handleFetchTrending}
                  className="p-3 border border-dashed border-slate-700 rounded-lg bg-slate-900/50 text-slate-500 text-xs text-center cursor-pointer hover:bg-slate-800 hover:text-slate-400 transition-all flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4 text-orange-500/50" />
                  點擊透過 AI 搜尋今日市場熱門話題
                </div>
              )}

              {isTrendingLoading && (
                <div className="flex gap-2 animate-pulse overflow-hidden">
                  <div className="h-7 w-20 bg-slate-800 rounded-full"></div>
                  <div className="h-7 w-24 bg-slate-800 rounded-full"></div>
                  <div className="h-7 w-16 bg-slate-800 rounded-full"></div>
                </div>
              )}

              {hasFetchedTrending && !isTrendingLoading && (
                <div className="flex flex-wrap gap-2 animate-fade-in">
                  {trendingTopics.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-full text-xs text-orange-300 transition-colors"
                    >
                      <TrendingUp className="w-3 h-3" />
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Static Quick Tags */}
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                常用標籤 (Common Tags)
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs text-slate-300 transition-colors"
                  >
                    <Tag className="w-3 h-3 text-primary-500" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              發布平台
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-600 outline-none appearance-none"
            >
              {Object.values(Platform).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              文章風格
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-600 outline-none appearance-none"
            >
              {Object.values(Tone).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Image Style Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-purple-400 mb-2">
              <Palette className="w-3.5 h-3.5" />
              配圖風格
            </label>
            <select
              value={imageStyle}
              onChange={(e) => setImageStyle(e.target.value as ImageStyle)}
              className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-600 outline-none appearance-none"
            >
              {Object.values(ImageStyle).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.02] ${
            isLoading || !topic.trim()
              ? 'bg-slate-700 cursor-not-allowed text-slate-400'
              : 'bg-gradient-to-r from-primary-600 to-blue-500 hover:from-primary-500 hover:to-blue-400 shadow-lg shadow-blue-900/20'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>正在搜尋數據並撰寫中...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>生成專業貼文</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default InputForm;