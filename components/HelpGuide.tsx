import React from 'react';
import { X, Terminal, Bot, MessageSquare, ExternalLink, Globe, AlertTriangle, ChevronRight, RefreshCw, Key, Play } from 'lucide-react';

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
            Telegram 機器人設定教學
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
          
          {/* Step 1 */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">STEP 1</span>
              建立機器人 (Bot)
            </h3>
            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-sm space-y-2">
              <p>1. 在 Telegram 搜尋 <strong className="text-blue-300">@BotFather</strong> (這是官方的機器人管理員)。</p>
              <p>2. 輸入指令 <code className="bg-slate-800 px-1 py-0.5 rounded text-orange-300">/newbot</code> 開始建立。</p>
              <p>3. 依照指示輸入「顯示名稱」和「Username」(必須以 bot 結尾)。</p>
              <p>4. 成功後，複製 <strong className="text-green-400">HTTP API Token</strong> (紅色的那一串)。</p>
            </div>
          </section>

          {/* Step 2 */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">STEP 2</span>
              建立頻道並加入機器人
            </h3>
            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-sm space-y-2">
              <p>1. 建立一個新的 Telegram 頻道 (Channel)。</p>
              <p>2. 點擊頻道上方名稱 &gt; <strong className="text-slate-200">管理員 (Administrators)</strong> &gt; 新增管理員。</p>
              <p>3. 搜尋您剛剛建立的機器人 ID 並加入。</p>
              <p className="text-orange-400 font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                重要：請在頻道內隨便發送一則訊息 (如 "hello")，讓機器人偵測到頻道存在。
              </p>
            </div>
          </section>

          {/* Step 3 */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">STEP 3</span>
              獲取頻道 ID (兩種方法)
            </h3>
            
            {/* Method A: Browser (Recommended) */}
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow-inner ring-1 ring-blue-500/30">
               <div className="flex items-center gap-2 mb-3">
                  <div className="bg-green-500/20 text-green-300 text-xs font-bold px-2 py-0.5 rounded border border-green-500/30 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    推薦方法
                  </div>
                  <h4 className="text-white font-medium text-sm">瀏覽器直接查詢 (最簡單，免安裝)</h4>
               </div>
               
               <div className="text-sm text-slate-300 space-y-3">
                  <p>不需要執行任何指令，直接用瀏覽器就能看到：</p>
                  <ol className="list-decimal list-inside space-y-2 text-slate-400 ml-1">
                    <li>確保您已經在頻道內發送了一則訊息。</li>
                    <li>複製以下網址，並將 <code className="text-yellow-400">&lt;您的Token&gt;</code> 換成您在 Step 1 拿到的 Token：</li>
                  </ol>
                  
                  <div className="bg-black p-3 rounded border border-slate-600 font-mono text-xs text-blue-300 break-all select-all">
                    https://api.telegram.org/bot<span className="text-yellow-400">&lt;您的Token&gt;</span>/getUpdates
                  </div>

                  {/* Troubleshooting Alert */}
                  <div className="bg-orange-900/20 border border-orange-500/20 p-3 rounded-lg mt-3 animate-pulse-subtle">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-orange-200">
                        <p className="font-bold mb-1 flex items-center gap-1">
                          看到 <code>result: []</code> (空陣列) 嗎？
                        </p>
                        <p className="opacity-90">這代表機器人暫時沒收到新訊息。請嘗試：</p>
                        <ul className="list-disc list-inside mt-1 space-y-1 opacity-80">
                          <li>回到頻道，<strong>發送一則新訊息</strong> (例如 "Hi")。</li>
                          <li>發送後，<strong>重新整理</strong>瀏覽器頁面。</li>
                          <li>若還是空的，請檢查機器人是否為頻道管理員。</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 p-3 rounded text-xs text-slate-400 border border-slate-800 mt-2">
                    <span className="text-green-400 font-bold">👀 找到資料後看哪裡？</span><br/>
                    尋找一段類似這樣的文字：<br/>
                    <code className="text-slate-300">"chat":{"{"}"id": <span className="text-green-400 font-bold">-100123456789</span>, "title": "您的頻道名稱" ...</code>
                    <br/>那個 <span className="text-green-400">-100 開頭的數字</span> 就是您的頻道 ID。
                  </div>
               </div>
            </div>

            {/* Method B: Terminal (Advanced) */}
            <details className="group">
              <summary className="flex items-center gap-2 text-slate-500 text-sm cursor-pointer hover:text-slate-300 transition-colors py-2 select-none">
                <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                <span>方法二：使用終端機 (需要安裝 Node.js)</span>
              </summary>
              <div className="mt-2 pl-6 border-l-2 border-slate-800 ml-2">
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                  <div className="flex items-start gap-3 mb-3">
                     <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                     <p className="text-xs text-slate-400">
                       如果您在終端機看到 <span className="text-red-400">npm : 無法辨識</span> 錯誤，代表您電腦沒安裝開發環境，請直接使用上面的「瀏覽器方法」即可。
                     </p>
                  </div>
                  <div className="bg-black p-3 rounded border border-slate-600 font-mono text-xs text-green-400 break-all">
                    npm run find-id <span className="text-yellow-400">&lt;您的Token&gt;</span>
                  </div>
                </div>
              </div>
            </details>
          </section>

          {/* Step 4: GitHub Secrets */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">STEP 4</span>
              設定 GitHub Secrets
            </h3>
            <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-sm space-y-3">
              <p>請至 GitHub 專案的 <span className="text-slate-200 font-bold">Settings &gt; Secrets and variables &gt; Actions</span> 建立以下 3 個 Secret：</p>
              
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700">
                  <code className="text-purple-300 font-bold font-mono">API_KEY</code>
                  <span className="text-slate-400 text-xs">您的 Gemini API 金鑰</span>
                </div>
                <div className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700">
                  <code className="text-purple-300 font-bold font-mono">TELEGRAM_BOT_TOKEN</code>
                  <span className="text-slate-400 text-xs">Bot Token</span>
                </div>
                <div className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700">
                  <code className="text-purple-300 font-bold font-mono">TELEGRAM_CHAT_ID</code>
                  <span className="text-slate-400 text-xs">-100... ID</span>
                </div>
              </div>
            </div>
          </section>

          {/* Step 5: Test (New) */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">STEP 5</span>
              馬上測試 (Run Workflow)
            </h3>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-sm space-y-4 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Play className="w-24 h-24 text-white" />
               </div>
               <p className="text-slate-300 relative z-10">設定好 Secrets 後，請依照以下步驟手動觸發一次，確認機器人能正常發文：</p>
               
               <ol className="list-decimal list-inside space-y-2 text-slate-300 relative z-10">
                 <li>回到 GitHub 專案頁面，點擊上方的 <strong className="text-white bg-slate-700 px-1 rounded">Actions</strong> 頁籤。</li>
                 <li>在左側列表中點選 <strong className="text-white">Daily Market Insight Bot</strong>。</li>
                 <li>右側會出現 <strong className="text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded border border-blue-500/50">Run workflow</strong> 按鈕，點擊它。</li>
                 <li>再次點擊綠色的 <span className="text-green-400">Run workflow</span> 確認。</li>
               </ol>

               <div className="bg-green-900/20 border border-green-500/30 p-3 rounded text-green-200 text-xs flex items-center gap-2 relative z-10">
                 <Bot className="w-5 h-5 flex-shrink-0" />
                 <span>等待約 30-60 秒，如果看到 ✅ 綠色勾勾，請檢查您的 Telegram 頻道，應該就會收到最新的 AI 分析貼文囉！</span>
               </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default HelpGuide;