
import React from 'react';
import { X, Bot, Search, BrainCircuit, Zap, Sparkles, Timer, CheckCircle2, ChevronRight, Github } from 'lucide-react';

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpGuide: React.FC<HelpGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const modelComparison = [
    {
      name: "Gemini 3 Pro (分析師首選)",
      icon: BrainCircuit,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      strength: "最高精度的 Google Search 整合、邏輯推演",
      speed: "慢 (因進行深度檢索與思考)",
      thinking: "支援 (最高預算 32k)",
      bestFor: "專業投研報告、需要精準數據的自動發文"
    },
    {
      name: "Gemini 3 Flash",
      icon: Zap,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      strength: "平衡效能、快速連網摘要",
      speed: "快",
      thinking: "支援 (最高預算 24k)",
      bestFor: "一般社群分享、即時資訊彙整"
    },
    {
      name: "Gemini 2.5 Flash",
      icon: Sparkles,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      strength: "長文穩定性、推理能力穩健",
      speed: "中等",
      thinking: "支援 (最高預算 24k)",
      bestFor: "固定格式的週報、長期數據追蹤"
    },
    {
      name: "Gemini 2.0 Flash",
      icon: Timer,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      strength: "極速響應、基礎資訊生成",
      speed: "極快",
      thinking: "不支援 (或建議設為 0)",
      bestFor: "市場快訊、短評論、高頻率測試"
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 z-10 sticky top-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-400" />
            🤖 自動化機器人設定指南
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-10 text-slate-300">
          
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-blue-400" />
              <h3 className="text-xl font-bold text-white">為什麼 Pro 模型生成更好？</h3>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
               <p className="text-sm leading-relaxed">
                 <strong className="text-white">Pro 模型不僅僅是「搜尋」而已。</strong><br/>
                 它具備強大的推理引擎，能從多個 Google 搜尋結果中過濾掉雜訊，並將碎片化的資訊重組為具備專業邏輯的分析文。
               </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {modelComparison.map((m) => {
                const ModelIcon = m.icon;
                return (
                  <div key={m.name} className={`${m.bg} ${m.border} border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 group hover:bg-opacity-20 transition-all`}>
                    <div className={`${m.bg} p-3 rounded-lg shrink-0`}>
                      <ModelIcon className={`w-6 h-6 ${m.color}`} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white">{m.name}</h4>
                          {m.name.includes("Pro") && (
                            <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded uppercase">Strongest Search</span>
                          )}
                        </div>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          {m.speed}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-slate-600" /> 
                          優勢: <span className="text-slate-300">{m.strength}</span>
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <BrainCircuit className="w-3 h-3 text-slate-600" /> 
                          推理: <span className="text-slate-300">{m.thinking}</span>
                        </p>
                      </div>
                      <div className="mt-2 text-[11px] text-blue-400/80 italic flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" />
                        建議用途：{m.bestFor}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-4 pt-6 border-t border-slate-800">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Github className="w-6 h-6" /> 🛠️ GitHub 自動化設定 (Secrets)
            </h3>
            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-sm space-y-3">
              <p>若要在 GitHub 執行自動排程，請至專案的 <span className="text-blue-400 font-bold">Settings &gt; Secrets &gt; Actions</span> 設定：</p>
              
              <div className="grid grid-cols-1 gap-2 font-mono text-[11px]">
                <div className="flex justify-between bg-slate-800 p-2 rounded border border-slate-700">
                  <span className="text-purple-300">API_KEY</span>
                  <span className="text-slate-500">Gemini API Key</span>
                </div>
                <div className="flex justify-between bg-slate-800 p-2 rounded border border-slate-700">
                  <span className="text-blue-300">TELEGRAM_BOT_TOKEN</span>
                  <span className="text-slate-500">Bot Token</span>
                </div>
                <div className="flex justify-between bg-slate-800 p-2 rounded border border-slate-700">
                  <span className="text-blue-300">TELEGRAM_CHAT_ID</span>
                  <span className="text-slate-500">頻道 ID (-100...)</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpGuide;
