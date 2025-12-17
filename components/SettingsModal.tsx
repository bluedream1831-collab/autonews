import React, { useState, useEffect } from 'react';
import { X, Save, Key, MessageSquare, ShieldCheck, Eye, EyeOff, Zap, PlayCircle, Loader2, BrainCircuit, Timer, Sparkles } from 'lucide-react';
import { AppSettings, AIModel } from '../types';
import { runManualAutoPost } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isRunningAuto, setIsRunningAuto] = useState(false);
  const [autoLog, setAutoLog] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...settings,
        preferredModel: settings.preferredModel || AIModel.Pro
      });
      setAutoLog(""); 
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleRunAutoPost = async () => {
    if (!formData.geminiApiKey && !process.env.API_KEY) {
      setAutoLog("❌ 錯誤：請先輸入 Gemini API Key");
      return;
    }
    
    onSave(formData);
    setIsRunningAuto(true);
    setAutoLog("⏳ 初始化中...");
    
    try {
      await runManualAutoPost(formData, (msg) => {
        setAutoLog(prev => prev + "\n" + msg);
      });
    } catch (error) {
      setAutoLog(prev => prev + "\n❌ 執行失敗: " + (error instanceof Error ? error.message : "未知錯誤"));
    } finally {
      setIsRunningAuto(false);
    }
  };

  const models = [
    { id: AIModel.Pro, label: '3 Pro', icon: BrainCircuit, color: 'purple', desc: '🧠 深度推理，最強分析能力。' },
    { id: AIModel.Flash3, label: '3 Flash', icon: Zap, color: 'blue', desc: '⚡ 現代標準，速度與品質平衡。' },
    { id: AIModel.Flash25, label: '2.5 Flash', icon: Sparkles, color: 'indigo', desc: '💎 支援思考，穩定性極佳。' },
    { id: AIModel.Flash2, label: '2.0 Flash', icon: Timer, color: 'emerald', desc: '🍃 極速效能，最低延遲首選。' },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary-500" />
            應用程式設定
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="space-y-4">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              AI 核心引擎選擇
            </label>
            <div className="grid grid-cols-2 gap-3">
              {models.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, preferredModel: m.id })}
                  className={`p-3 rounded-xl border transition-all text-left group ${
                    formData.preferredModel === m.id 
                    ? `border-${m.color}-500 bg-${m.color}-500/10 ring-1 ring-${m.color}-500/30` 
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-bold ${formData.preferredModel === m.id ? `text-${m.color}-400` : 'text-slate-400'}`}>
                      {m.label}
                    </span>
                    <m.icon className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${formData.preferredModel === m.id ? `text-${m.color}-500` : 'text-slate-600'}`} />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">{m.desc}</p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 italic px-1">
               * 註：2.5 及 3 系列支援 Thinking 深度思考模式，雖然生成較慢但邏輯更嚴謹。
            </p>
          </div>

          <div className="border-t border-slate-800"></div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={formData.geminiApiKey}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                placeholder="輸入您的 Gemini API Key"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pr-10 text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Telegram 發送設定
            </h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Bot Token</label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={formData.telegramBotToken}
                  onChange={(e) => setFormData({ ...formData, telegramBotToken: e.target.value })}
                  placeholder="123456:ABC-DEF..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 pr-10 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                />
                 <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Channel ID</label>
              <input
                type="text"
                value={formData.telegramChatId}
                onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                placeholder="-100..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
             <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
               <div className="flex items-center justify-between mb-2">
                 <h4 className="text-sm font-bold text-white flex items-center gap-2">
                   <Zap className="w-4 h-4 text-yellow-400" />
                   立即執行自動排程
                 </h4>
               </div>
               
               <button
                type="button"
                onClick={handleRunAutoPost}
                disabled={isRunningAuto}
                className={`w-full py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                   isRunningAuto 
                   ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                   : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg'
                }`}
               >
                 {isRunningAuto ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                 {isRunningAuto ? '執行中...' : '手動發布一次'}
               </button>

               {autoLog && (
                 <div className="mt-3 p-3 bg-black/50 rounded border border-slate-700 font-mono text-[10px] text-green-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
                   {autoLog}
                 </div>
               )}
             </div>
          </div>

          <div className="pt-2 flex justify-end gap-3 sticky bottom-0 bg-slate-900 pb-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              關閉
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-primary-900/20"
            >
              <Save className="w-4 h-4" />
              儲存設定
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;