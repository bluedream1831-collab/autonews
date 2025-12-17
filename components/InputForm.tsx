
import React, { useState, useEffect } from 'react';
import { Platform, Tone, ImageStyle, GenerateRequest, AIModel } from '../types';
import { getTrendingTopics } from '../services/geminiService';
// Added Zap to the imports to fix the "Cannot find name 'Zap'" error on line 120
import { Send, TrendingUp, Loader2, Tag, Flame, RefreshCw, Palette, Sparkles, BrainCircuit, Zap } from 'lucide-react';

interface InputFormProps {
  onGenerate: (req: GenerateRequest) => void;
  isLoading: boolean;
  currentModel: AIModel;
}

const QUICK_TAGS = [
  "NVIDIA (NVDA)", 
  "台積電 (2330)", 
  "聯準會 (Fed)", 
  "比特幣 (BTC)",
  "日經指數 (Nikkei)",
  "ASML (ASML)",
  "特斯拉 (TSLA)",
  "美股大盤"
];

const LOADING_STEPS = [
  "正在連線 Google Search 檢索最新財經新聞...",
  "分析美股與台股供應鏈關聯性...",
  "AI 正在進行深度邏輯推演 (Thinking)...",
  "根據指定風格撰寫社群貼文內容...",
  "生成 AI 繪圖建議指令...",
  "最後校稿與 Emoji 美化中..."
];

const InputForm: React.FC<InputFormProps> = ({ onGenerate, isLoading, currentModel }) => {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<Platform>(Platform.Blog);
  const [tone, setTone] = useState<Tone>(Tone.Professional);
  const [imageStyle, setImageStyle] = useState<ImageStyle>(ImageStyle.Editorial);
  
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [hasFetchedTrending, setHasFetchedTrending] = useState(false);
  
  // Loading Step state
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);

  useEffect(() => {
    let interval: number;
    if (isLoading) {
      setLoadingStepIdx(0);
      interval = window.setInterval(() => {
        setLoadingStepIdx(prev => (prev + 1) % LOADING_STEPS.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPlatform(Platform.Blog);
      setImageStyle(ImageStyle.Editorial);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const triggerGenerate = () => {
    if (!topic.trim()) return;
    onGenerate({ topic, platform, tone, imageStyle });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerGenerate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      triggerGenerate();
    }
  };

  const addTag = (tag: string) => {
    if (topic.includes(tag)) return;
    const newTopic = topic ? `${topic}，${tag}` : tag;
    setTopic(newTopic);
  };

  const handleFetchTrending = async () => {
    setIsTrendingLoading(true);
    try {
      let apiKey = process.env.API_KEY;
      try {
          const settings = localStorage.getItem('app_settings');
          if (settings) {
              const parsed = JSON.parse(settings);
              if (parsed.geminiApiKey) apiKey = parsed.geminiApiKey;
          }
      } catch (e) {}

      const topics = await getTrendingTopics(apiKey);
      setTrendingTopics(topics);
      setHasFetchedTrending(true);
    } catch (error) {
      console.error(error);
      alert("無法取得熱搜。請確保您已在「設定」中輸入 API Key。");
    } finally {
      setIsTrendingLoading(false);
    }
  };

  const isSlowModel = currentModel === AIModel.Pro || currentModel === AIModel.Flash25;

  return (
    <form onSubmit={handleSubmit} className="bg-slate-850 p-6 rounded-xl border border-slate-700 shadow-xl" autoComplete="off">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-primary-500">
          <TrendingUp className="w-6 h-6" />
          <h2 className="text-xl font-bold text-white">貼文參數設定</h2>
        </div>
        <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full flex items-center gap-1.5">
           {isSlowModel ? <BrainCircuit className="w-3 h-3 text-purple-400" /> : <Zap className="w-3 h-3 text-emerald-400" />}
           <span className="text-[10px] text-slate-400 font-mono uppercase">{currentModel.split('-')[1] || 'Flash'} MODE</span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2 flex justify-between">
            <span>核心主題 / 股票代號 / 新聞事件</span>
            <span className="text-xs text-slate-500 hidden sm:inline">Ctrl + Enter 快速生成</span>
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例如：NVIDIA 財報分析、台積電高雄廠進度、聯準會降息對科技股影響..."
            className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none transition-all placeholder-slate-600 h-24 resize-none"
            required
            name="topic_input_no_autofill"
            autoComplete="off"
          />
          
          <div className="mt-4 space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              發布平台 (預設:方格子)
            </label>
            <select
              key={`platform-select-${platform}`}
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-600 outline-none appearance-none"
              autoComplete="off"
            >
              {Object.values(Platform).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              文章風格
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-600 outline-none appearance-none"
              autoComplete="off"
            >
              {Object.values(Tone).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-purple-400 mb-2">
              <Palette className="w-3.5 h-3.5" />
              配圖風格 (預設:新聞插畫)
            </label>
            <select
              key={`style-select-${imageStyle}`}
              value={imageStyle}
              onChange={(e) => setImageStyle(e.target.value as ImageStyle)}
              className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-600 outline-none appearance-none"
              autoComplete="off"
            >
              {Object.values(ImageStyle).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className={`w-full flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl font-semibold text-white transition-all transform hover:scale-[1.01] ${
              isLoading || !topic.trim()
                ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                : 'bg-gradient-to-r from-primary-600 to-blue-500 hover:from-primary-500 hover:to-blue-400 shadow-lg shadow-blue-900/20'
            }`}
          >
            {isLoading ? (
              <>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isSlowModel ? 'AI 正在深度思考中...' : '快速生成中...'}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  <span>生成專業貼文</span>
                </div>
              </>
            )}
          </button>
          
          {isLoading && (
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-center animate-pulse">
               <p className="text-[11px] text-blue-400 font-medium tracking-wide transition-all duration-500">
                  {LOADING_STEPS[loadingStepIdx]}
               </p>
               <div className="w-full h-1 bg-slate-800 mt-2 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 animate-loading-bar"></div>
               </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 4s infinite linear;
        }
      `}</style>
    </form>
  );
};

export default InputForm;
