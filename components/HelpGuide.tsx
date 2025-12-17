import React from 'react';
import { X, Bot, Sun, Moon, CalendarClock, AlertTriangle } from 'lucide-react';

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
              <p className="text-sm">建立頻道 → 加入機器人為管理員 → 發送一則訊息 → 用瀏覽器打開：</p>
              <div className="bg-black p-2 rounded border border-slate-600 font-mono text-xs text-blue-300 break-all select-all flex flex-wrap">
                <span>https://api.telegram.org/bot</span>
                <span className="text-yellow-400">{'<您的Token>'}</span>
                <span>/getUpdates</span>
              </div>
              <p className="text-xs text-slate-400">尋找 <code className="text-green-400">"id": -100xxxxxxx</code> 即為頻道 ID。</p>
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
              </div>
            </div>
          </section>

          {/* Automated Schedule Info */}
          <section className="space-y-4 pt-6 border-t border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-orange-400" />
              📅 自動發文排程 (台灣時間)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Morning Report */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="w-4 h-4 text-orange-500" />
                      <span className="font-bold text-orange-200">06:37 AM 早報</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      <strong>起床第一手消息：</strong>美股剛收盤數據、Fed 最新談話。趕在讀者 7 點起床前送達。
                    </p>
              </div>

              {/* Evening Report */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Moon className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-blue-200">18:37 PM 晚報</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      <strong>下班通勤閱讀：</strong>台股籌碼(三大法人)全數公布、歐洲股市開盤動態。
                    </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 italic text-center mt-2">
               * 我們刻意選擇 37 分 (冷門分鐘數) 以避開 GitHub 整點的網路塞車。
            </p>
          </section>

          {/* Troubleshooting Section */}
          <section className="space-y-4 pt-6 border-t border-slate-800">
             <h3 className="text-lg font-bold text-white flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              疑難排解
            </h3>
            <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4 space-y-3 text-sm text-slate-300">
               <ul className="list-disc list-inside space-y-2">
                  <li>
                     <strong className="text-white">GitHub 專案閒置</strong>：若專案超過 60 天沒有新的 Commit，GitHub 會自動暫停排程。請至 Actions 頁面手動啟用。
                  </li>
                  <li>
                     <strong className="text-white">時區觀念</strong>：GitHub 伺服器使用 UTC 時間。我們設定 UTC 22:37 其實就是台灣隔天的 06:37。
                  </li>
               </ul>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default HelpGuide;