import React from 'react';
import { X, Terminal, Bot, MessageSquare, ExternalLink, Globe, AlertTriangle, ChevronRight, RefreshCw, Key, Play, Sun, Moon, CalendarClock, Smartphone } from 'lucide-react';

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpGuide: React.FC<HelpGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 z-10 sticky top-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-400" />
            自動化機器人設定教學
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 text-slate-300">

          <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex gap-3 text-sm text-blue-200">
             <Smartphone className="w-5 h-5 flex-shrink-0 mt-0.5" />
             <div>
               此工具支援同時發送到 <strong>Telegram</strong> 與 <strong>Line</strong>。請依據您的需求設定對應的 Secrets。
             </div>
          </div>
          
          {/* Section: Telegram */}
          <div className="border-l-4 border-blue-500 pl-4 space-y-6">
            <h3 className="text-xl font-bold text-white">📡 Telegram 設定</h3>
            
            {/* Step 1 */}
            <section className="space-y-2">
              <h4 className="font-semibold text-blue-400">1. 建立機器人</h4>
              <p className="text-sm">在 Telegram 搜尋 <strong className="text-white">@BotFather</strong>，輸入 <code className="bg-slate-800 px-1 rounded">/newbot</code> 建立，並取得 <strong>HTTP API Token</strong>。</p>
            </section>

            {/* Step 2 */}
            <section className="space-y-2">
              <h4 className="font-semibold text-blue-400">2. 獲取頻道 ID</h4>
              <p className="text-sm">建立頻道 -> 加入機器人為管理員 -> 發送一則訊息 -> 用瀏覽器打開：</p>
              <div className="bg-black p-2 rounded border border-slate-600 font-mono text-xs text-blue-300 break-all select-all">
                https://api.telegram.org/bot<span className="text-yellow-400">&lt;您的Token&gt;</span>/getUpdates
              </div>
              <p className="text-xs text-slate-400">尋找 <code className="text-green-400">"id": -100xxxxxxx</code> 即為頻道 ID。</p>
            </section>
          </div>

          <hr className="border-slate-800" />

          {/* Section: Line (New) */}
          <div className="border-l-4 border-green-500 pl-4 space-y-6">
            <h3 className="text-xl font-bold text-white">💬 Line 設定 (選用)</h3>
            
            <section className="space-y-3 text-sm">
              <p>若要啟用 Line 自動發文，請至 <a href="https://developers.line.biz/" target="_blank" className="text-green-400 underline">Line Developers Console</a>：</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 ml-1">
                <li>建立一個 Provider 和 <strong>Messaging API</strong> Channel。</li>
                <li>在 <strong>Messaging API</strong> 頁籤下方，產生 <strong className="text-white">Channel access token (long-lived)</strong>。</li>
                <li>在 <strong>Basic settings</strong> 頁籤下方，找到 <strong className="text-white">Your User ID</strong> (個人測試用)；若要發到群組，需將 Line Bot 邀入群組並透過 Webhook 獲取 Group ID (較進階)。</li>
              </ol>
            </section>
          </div>

          <hr className="border-slate-800" />

          {/* Section: GitHub Secrets */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">FINAL STEP</span>
              設定 GitHub Secrets
            </h3>
            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-sm space-y-3">
              <p>請至 GitHub 專案的 <span className="text-slate-200 font-bold">Settings &gt; Secrets and variables &gt; Actions</span> 建立以下 Secrets：</p>
              
              <div className="space-y-2 mt-2 font-mono text-xs">
                <div className="flex justify-between bg-slate-800 p-2 rounded border border-slate-700">
                  <span className="text-purple-300">API_KEY</span>
                  <span className="text-slate-500">Gemini Key</span>
                </div>
                <div className="flex justify-between bg-slate-800 p-2 rounded border border-slate-700">
                  <span className="text-blue-300">TELEGRAM_BOT_TOKEN</span>
                  <span className="text-slate-500">TG Bot Token</span>
                </div>
                <div className="flex justify-between bg-slate-800 p-2 rounded border border-slate-700">
                  <span className="text-blue-300">TELEGRAM_CHAT_ID</span>
                  <span className="text-slate-500">TG Channel ID</span>
                </div>
                {/* Line Secrets */}
                <div className="flex justify-between bg-slate-800 p-2 rounded border border-green-900/30 border-dashed">
                  <span className="text-green-400">LINE_CHANNEL_ACCESS_TOKEN</span>
                  <span className="text-slate-500">選用：Line Token</span>
                </div>
                <div className="flex justify-between bg-slate-800 p-2 rounded border border-green-900/30 border-dashed">
                  <span className="text-green-400">LINE_USER_ID</span>
                  <span className="text-slate-500">選用：發送對象 ID</span>
                </div>
              </div>
            </div>
          </section>

          {/* Automated Schedule Info */}
          <section className="space-y-4 pt-6 border-t border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-orange-400" />
              📅 自動發文排程
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Morning Report */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="w-4 h-4 text-orange-500" />
                      <span className="font-bold text-orange-200">08:00 AM 早報</span>
                    </div>
                    <p className="text-slate-400">鎖定：美股收盤、聯準會政策、國際巨頭。</p>
              </div>

              {/* Evening Report */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Moon className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-blue-200">17:00 PM 晚報</span>
                    </div>
                    <p className="text-slate-400">鎖定：台股盤後、半導體供應鏈、亞洲市場。</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default HelpGuide;