import React, { useState } from 'react';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import { GenerateRequest, GeneratedResult } from './types';
import { generatePost } from './services/geminiService';
import { Activity, Cpu, Globe, BarChart3 } from 'lucide-react';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (request: GenerateRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await generatePost(request);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '發生未預期的錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-primary-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">FinTech Insight Gen</h1>
              <p className="text-xs text-slate-400">美台股與科技時事生成器</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
             <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Global Search</span>
             </div>
             <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Tech Analysis</span>
             </div>
             <div className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-green-400" />
                <span>Market Data</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-6">
            <div className="prose prose-invert prose-sm">
              <p className="text-slate-400 leading-relaxed">
                輸入感興趣的科技新聞或股票代碼，AI 經由 <span className="text-blue-400 font-semibold">Google Search Grounding</span> 獲取最新即時資訊，並模擬專業分析師口吻撰寫貼文。
              </p>
            </div>
            <InputForm onGenerate={handleGenerate} isLoading={loading} />
            
            {/* Quick Tips */}
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">💡 提示與範例</h3>
              <ul className="text-sm text-slate-500 space-y-2 list-disc list-inside">
                <li>分析 <span className="text-slate-300">NVDA 最新財報</span> 重點</li>
                <li>評論 <span className="text-slate-300">台積電 2330</span> 法說會亮點</li>
                <li>探討 <span className="text-slate-300">OpenAI o3 模型</span> 對產業影響</li>
                <li><span className="text-slate-300">聯準會降息</span> 對台股科技股的衝擊</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7">
            {error ? (
              <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-start gap-3">
                <div className="mt-1">⚠️</div>
                <div>
                  <h3 className="font-semibold">發生錯誤</h3>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
            ) : result ? (
              <ResultDisplay result={result} onReset={handleReset} />
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
                <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">等待生成指令...</p>
                <p className="text-sm">在左側輸入主題以開始分析</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;