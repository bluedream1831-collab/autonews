import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import HistoryDrawer from './components/HistoryDrawer';
import HelpGuide from './components/HelpGuide';
import SettingsModal from './components/SettingsModal';
import { GenerateRequest, GeneratedResult, HistoryItem, AppSettings } from './types';
import { generatePost } from './services/geminiService';
import { Activity, Cpu, Globe, BarChart3, History, HelpCircle, Settings as SettingsIcon } from 'lucide-react';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Settings & Help State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    geminiApiKey: '',
    telegramBotToken: '',
    telegramChatId: '',
  });

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('post_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('post_history', JSON.stringify(history));
  }, [history]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));
  };

  const addToHistory = (request: GenerateRequest, result: GeneratedResult) => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      topic: request.topic,
      timestamp: new Date().toLocaleString('zh-TW', { 
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      result: result
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (confirm("確定要刪除所有紀錄嗎？")) {
      setHistory([]);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setResult(item.result);
    setError(null);
    // Scroll to result smoothly
    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleGenerate = async (request: GenerateRequest) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Pass the API Key from settings if available
      const data = await generatePost(request, settings.geminiApiKey);
      setResult(data);
      // Automatically save to history
      addToHistory(request, data);
      
      // Scroll to result smoothly after generation
      setTimeout(() => {
        document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      setError(err instanceof Error ? err.message : '發生未預期的錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-primary-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Global FinTech Insight</h1>
              <p className="text-xs text-slate-400">美台股/全球科技時事生成器</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
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
            
            <div className="flex items-center gap-2 border-l border-slate-700 pl-4 ml-2">
              {/* Settings Button */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors relative"
                title="應用程式設定"
              >
                <SettingsIcon className="w-5 h-5" />
                {(!settings.geminiApiKey && !process.env.API_KEY) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                )}
              </button>

              {/* Help Button */}
              <button
                onClick={() => setIsHelpOpen(true)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Bot 設定教學"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              {/* History Toggle Button */}
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">歷史紀錄</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col gap-10">
          
          {/* Top Section: Input - Centered and constrained */}
          <div className="w-full max-w-3xl mx-auto space-y-6">
            <div className="prose prose-invert prose-sm text-center mx-auto">
              <p className="text-slate-400 leading-relaxed">
                輸入感興趣的科技新聞或股票代碼，AI 經由 <span className="text-blue-400 font-semibold">Google Search Grounding</span> 獲取最新即時資訊，並模擬專業分析師口吻撰寫貼文。
              </p>
            </div>
            
            {/* Pass loading state but not settings directly needed here unless for trending */}
            <InputForm 
              onGenerate={handleGenerate} 
              isLoading={loading} 
            />
            
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

          {/* Bottom Section: Output - Full width */}
          <div id="result-section" className="w-full transition-all duration-500 ease-in-out">
            {error ? (
              <div className="max-w-3xl mx-auto bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-start gap-3 animate-fade-in">
                <div className="mt-1">⚠️</div>
                <div>
                  <h3 className="font-semibold">發生錯誤</h3>
                  <p className="text-sm opacity-90">{error}</p>
                  {error.includes("API Key") && (
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="mt-2 text-xs bg-red-800 hover:bg-red-700 text-white px-2 py-1 rounded"
                    >
                      開啟設定輸入 API Key
                    </button>
                  )}
                </div>
              </div>
            ) : result ? (
              <div className="animate-fade-in-up">
                <ResultDisplay 
                  result={result} 
                  onReset={handleReset} 
                  settings={settings} // Pass settings for Telegram button
                />
              </div>
            ) : (
              <div className="max-w-3xl mx-auto h-48 flex flex-col items-center justify-center bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-xl text-slate-600">
                <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-base font-medium">等待生成指令...</p>
                {history.length > 0 && (
                  <button 
                    onClick={() => setIsHistoryOpen(true)}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <History className="w-3 h-3" />
                    查看歷史紀錄
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Drawers and Modals */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={handleSelectHistory}
        onDelete={deleteHistoryItem}
        onClearAll={clearHistory}
      />

      <HelpGuide 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;