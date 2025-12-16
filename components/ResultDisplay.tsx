import React, { useState } from 'react';
import { GeneratedResult, Platform, AppSettings } from '../types';
import { Copy, ExternalLink, RefreshCw, MessageCircle, Smartphone, Sparkles, Send, CheckCircle, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendToTelegram } from '../services/telegramService';

interface ResultDisplayProps {
  result: GeneratedResult | null;
  onReset: () => void;
  settings: AppSettings;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onReset, settings }) => {
  const [isSending, setIsSending] = useState(false);
  
  if (!result) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已複製到剪貼簿！');
  };

  const handleSendToTelegram = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      alert("請先點擊右上角「設定」按鈕，填寫 Telegram Bot Token 和 Channel ID");
      return;
    }

    if (!confirm("確定要立即發送此內容到 Telegram 頻道嗎？")) return;

    setIsSending(true);
    try {
      // 1. Send Main Content
      await sendToTelegram(settings.telegramBotToken, settings.telegramChatId, result.content);
      
      // 2. Optional: Send Image Prompt if exists
      if (result.imagePrompt) {
        const promptMsg = `🎨 AI 配圖指令:\n\n${result.imagePrompt}`;
        await sendToTelegram(settings.telegramBotToken, settings.telegramChatId, promptMsg);
      }
      
      alert("✅ 發送成功！");
    } catch (error) {
      console.error(error);
      alert(`❌ 發送失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    } finally {
      setIsSending(false);
    }
  };

  const isChatMode = result.platform === Platform.InstantMessaging;

  return (
    <div className="bg-slate-850 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-full animate-fade-in relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-900/50 flex flex-wrap justify-between items-center z-10 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <h3 className="text-white font-semibold">生成結果</h3>
          <span className="text-xs text-slate-500 ml-2">({result.timestamp})</span>
        </div>
        <div className="flex gap-2">
           <button
            onClick={onReset}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="重新開始"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {/* Telegram Send Button */}
          <button
            onClick={handleSendToTelegram}
            disabled={isSending}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-sm rounded-lg transition-colors shadow-lg ${
              isSending 
                ? 'bg-slate-600 cursor-wait' 
                : 'bg-[#229ED9] hover:bg-[#1b8abf] shadow-blue-900/20'
            }`}
            title="發布到 Telegram 頻道"
          >
            <Send className={`w-4 h-4 ${isSending ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{isSending ? '發送中...' : '發布'}</span>
          </button>

          <button
            onClick={() => handleCopy(result.content)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors shadow-lg"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">複製</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 overflow-y-auto custom-scrollbar flex-grow max-h-[600px] bg-slate-850">
        {isChatMode ? (
          // Mobile Chat Preview UI
          <div className="max-w-sm mx-auto">
             <div className="flex items-center justify-center gap-2 mb-4 text-slate-500 text-xs">
                <Smartphone className="w-4 h-4" />
                <span>行動裝置預覽</span>
             </div>
             <div className="bg-[#2b3445] p-4 rounded-2xl rounded-tl-none relative shadow-md text-slate-100 font-sans text-[15px] leading-relaxed border border-slate-700">
                <div className="absolute -top-2 left-0 w-3 h-3 bg-[#2b3445] [clip-path:polygon(0_100%,100%_0,100%_100%)] border-t border-l border-transparent"></div>
                <div className="whitespace-pre-wrap">{result.content}</div>
                <div className="mt-2 text-[10px] text-slate-400 text-right flex items-center justify-end gap-1">
                   <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
             </div>
          </div>
        ) : (
          // Standard Document View
          <div className="prose prose-invert prose-blue max-w-none text-slate-200 leading-relaxed whitespace-pre-wrap">
            <ReactMarkdown>{result.content}</ReactMarkdown>
          </div>
        )}

        {/* Image Prompt Section */}
        {result.imagePrompt && (
          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <div className="flex items-center gap-2 mb-3 text-purple-400">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-sm font-semibold uppercase tracking-wider">AI 繪圖提示詞 (Midjourney / DALL-E)</h4>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 border border-purple-500/20 relative group">
              <p className="text-slate-300 font-mono text-sm leading-relaxed pr-8">
                <span className="text-purple-400 font-bold mr-2">圖片提示詞:</span>
                {result.imagePrompt}
              </p>
              <button
                onClick={() => result.imagePrompt && handleCopy(result.imagePrompt)}
                className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-md transition-all opacity-0 group-hover:opacity-100"
                title="複製提示詞"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Sources */}
      {result.sources.length > 0 && (
        <div className="bg-slate-900 p-4 border-t border-slate-700 z-10">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            資料來源 (Grounding Sources)
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.sources.map((source, index) => (
              <a
                key={index}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs text-blue-400 hover:text-blue-300 transition-colors truncate max-w-[200px]"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;