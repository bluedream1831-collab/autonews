
import React, { useState, useEffect } from 'react';
import { Platform, Tone, ImageStyle, GenerateRequest, AIModel } from '../types';
import { getTrendingTopics } from '../services/geminiService';
import { Send, TrendingUp, Loader2, Tag, Flame, RefreshCw, Palette, BrainCircuit, Zap, Timer, Sparkles } from 'lucide-react';

interface InputFormProps {
  onGenerate: (req: GenerateRequest) => void;
  isLoading: boolean;
  currentModel: AIModel;
  onModelChange: (model: AIModel) => void;
}

const QUICK_TAGS = ["NVIDIA (NVDA)", "台積電 (2330)", "聯準會 (Fed)", "比特幣 (BTC)", "美股大盤"];

const LOADING_STEPS = [
  "正在連線 Google Search 檢索最新財經新聞...",
  "分析美股與台股供應鏈關聯性...",
  "AI 正在進行深度邏輯推演 (Thinking)...",
  "根據指定風格撰寫專業貼文內容...",
  "生成 AI 繪圖建議指令...",
  "最後校稿與 Emoji 美化中..."
];

const InputForm: React.FC<InputFormProps> = ({ onGenerate, isLoading, currentModel, onModelChange }) => {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<Platform>(Platform.Blog);
  const [tone, setTone] = useState<Tone>(Tone.Professional);
  const [imageStyle, setImageStyle] = useState<ImageStyle>(ImageStyle.Editorial);
  
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);
  const [hasFetchedTrending, setHasFetchedTrending] = useState(false);
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

  const triggerGenerate = () => {
    if (!topic.trim()) return;
    onGenerate({ topic, platform, tone, imageStyle });
  };

  const modelOptions = [
    { id: AIModel.Pro, label: '3 Pro', icon: BrainCircuit, color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10' },
    { id: AIModel.Flash3, label: '3 Flash', icon: Zap, color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10' },
    { id: AIModel.Flash25, label: '2.5 Flash', icon: Sparkles, color: 'text-indigo-400', border: 'border-indigo-500/50', bg: 'bg-indigo-500/10' },
    { id: AIModel.Flash2, label: '2.0 Flash', icon: Timer, color: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-4">
      {/* 快速切換 AI 引擎 (頂部顯眼處) */}
      <div className="bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800 flex gap-1.5 shadow-2xl">
        {modelOptions.map((m) => {
          const Icon = m.icon;
          const isActive = currentModel === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onModelChange(m.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all duration-300 border ${
                isActive 
                ? `${m.bg} ${m.border} ${m.color} shadow-[0_0_20px_rgba(0,0,0,0.3)] ring-1 ring-white/10` 
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); triggerGenerate(); }} className="bg-slate-850 p-6 rounded-xl border border-slate-700 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-primary-500">
            <TrendingUp className="w-6 h-6" />
            <h2 className="text-xl font-bold text-white">貼文生成器</h2>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">核心主題 / 股票代號</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="例如：NVIDIA 財報分析、聯準會降息對科技股影響..."
              className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-600 outline-none transition-all h-24 resize-none"
              required
            />
            
            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTopic(tag)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs text-slate-300 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-600 outline-none"
            >
              {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-primary-600 outline-none"
            >
              {Object.values(Tone).map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              value={imageStyle}
              onChange={(e) => setImageStyle(e.target.value as ImageStyle)}
              className="bg-slate-900 text-white border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-600 outline-none"
            >
              {Object.values(ImageStyle).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className={`w-full py-4 px-4 rounded-xl font-bold text-white transition-all transform hover:scale-[1.01] flex items-center justify-center gap-2 ${
              isLoading || !topic.trim()
                ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                : 'bg-gradient-to-r from-primary-600 to-blue-500 hover:from-primary-500 hover:to-blue-400 shadow-lg'
            }`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {isLoading ? '正在深度思考中...' : '立即生成專業貼文'}
          </button>
          
          {isLoading && (
            <div className="text-center animate-pulse">
              <p className="text-[11px] text-blue-400 font-medium">{LOADING_STEPS[loadingStepIdx]}</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default InputForm;
