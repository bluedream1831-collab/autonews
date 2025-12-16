import React, { useState } from 'react';
import { GeneratedResult, Platform, AppSettings } from '../types';
import { Copy, ExternalLink, RefreshCw, Smartphone, Sparkles, Send, Share2 } from 'lucide-react';
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
    // Could add a toast notification here ideally
    const btn = document.getElementById('copy-btn-text');
    if (btn) {
       const originalText = btn.innerText;
       btn.innerText = '已複製!';
       setTimeout(() => btn.innerText = originalText, 2000);
    }
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
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full animate-fade-in relative">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-wrap justify-between items-center z-10 gap-3 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
          <div>
            <h3 className="text-white font-bold tracking-tight text-lg">生成結果</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
               <span>{result.timestamp}</span>
               <span className="w-1 h-1 rounded-full bg-slate-700"></span>
               <span>{result.platform}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <button
            onClick={onReset}
            className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all duration-200"
            title="重新開始"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <div className="h-6 w-px bg-slate-800 mx-1"></div>

          {/* Telegram Send Button */}
          <button
            onClick={handleSendToTelegram}
            disabled={isSending}
            className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg ${
              isSending 
                ? 'bg-slate-700 cursor-wait' 
                : 'bg-[#229ED9] hover:bg-[#1b8abf] hover:shadow-[#229ED9]/20 hover:-translate-y-0.5'
            }`}
            title="發布到 Telegram 頻道"
          >
            <Send className={`w-4 h-4 ${isSending ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{isSending ? '發送中...' : '發布到 Telegram'}</span>
          </button>

          <button
            onClick={() => handleCopy(result.content)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-sm font-medium rounded-xl transition-all duration-200 shadow-lg border border-slate-700 hover:border-slate-600"
          >
            <Copy className="w-4 h-4" />
            <span id="copy-btn-text" className="hidden sm:inline">複製</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-grow overflow-y-auto custom-scrollbar bg-[#0B1120]">
        {isChatMode ? (
          // Mobile Chat Preview UI
          <div className="max-w-md mx-auto py-12 px-4">
             <div className="flex items-center justify-center gap-2 mb-6 opacity-60">
                <div className="h-px w-8 bg-slate-700"></div>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium uppercase tracking-widest">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Telegram Preview</span>
                </div>
                <div className="h-px w-8 bg-slate-700"></div>
             </div>

             <div className="space-y-4">
               {/* Date Bubble */}
               <div className="flex justify-center">
                  <span className="bg-slate-800/80 text-slate-400 text-[10px] font-medium px-2.5 py-1 rounded-full backdrop-blur-sm border border-slate-700/50">
                     Today
                  </span>
               </div>

               {/* Message Bubble */}
               <div className="flex flex-col items-start animate-slide-up">
                 <div className="bg-[#2A2A2A] p-4 rounded-2xl rounded-tl-none relative shadow-xl text-slate-200 font-sans text-[15px] leading-relaxed border border-slate-700/50 max-w-[95%]">
                    {/* Tail SVG */}
                    <svg className="absolute top-0 -left-[9px] w-[10px] h-[15px] fill-[#2A2A2A] stroke-slate-700/50 stroke-[0.5px]" viewBox="0 0 10 15">
                        <path d="M10,0 L0,0 C0,0 2,5 10,15 L10,0 Z" stroke="none" />
                        <path d="M0,0 C0,0 2,5 10,15" fill="none" className="stroke-slate-700/50" />
                    </svg>
                    
                    {/* Message Body */}
                    <div className="whitespace-pre-wrap break-words">{result.content}</div>
                    
                    {/* Message Meta */}
                    <div className="mt-2 pt-1 flex items-center justify-end gap-1.5 opacity-60 select-none">
                       <span className="text-[10px] text-slate-400">
                         {new Date().toLocaleTimeString("zh-TW", { 
                           timeZone: "Asia/Taipei", 
                           hour: '2-digit', 
                           minute: '2-digit', 
                           hour12: false 
                         })}
                       </span>
                    </div>
                 </div>
               </div>
             </div>
          </div>
        ) : (
          // Document View - Enhanced Typography
          <div className="max-w-4xl mx-auto py-12 px-8">
             <article className="prose prose-invert prose-lg max-w-none 
                prose-headings:font-bold prose-headings:text-slate-100 prose-headings:tracking-tight
                prose-h1:text-3xl prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-slate-800
                prose-h2:text-2xl prose-h2:text-blue-400 prose-h2:mt-10 prose-h2:mb-6 prose-h2:flex prose-h2:items-center prose-h2:gap-2
                prose-h3:text-xl prose-h3:text-slate-200 prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-slate-300 prose-p:leading-8 prose-p:mb-6 prose-p:text-[17px]
                prose-strong:text-white prose-strong:font-bold prose-strong:text-lg
                prose-ul:my-6 prose-li:my-2 prose-li:text-slate-300 prose-li:leading-7
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-500/5 
                prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:my-8 prose-blockquote:rounded-r-lg 
                prose-blockquote:not-italic prose-blockquote:text-slate-200 prose-blockquote:shadow-sm
                prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
             ">
                <ReactMarkdown
                  components={{
                    // Custom paragraph to ensure consistent spacing
                    p: ({node, ...props}) => <p className="mb-6 leading-8 text-slate-300" {...props} />,
                    // Style blockquotes specifically for "Deep Insight" feel
                    blockquote: ({node, ...props}) => (
                      <blockquote className="border-l-4 border-blue-500 bg-slate-800/30 pl-6 py-4 my-8 rounded-r-xl shadow-inner italic" {...props} />
                    ),
                    // Make headers pop
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white mb-8 pb-4 border-b border-slate-800" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-blue-400 mt-10 mb-6" {...props} />,
                    // Ensure lists are readable
                    li: ({node, ...props}) => <li className="text-slate-300 leading-8" {...props} />,
                  }}
                >
                  {result.content}
                </ReactMarkdown>
             </article>
          </div>
        )}

        {/* Image Prompt Section - Styled as a distinct card */}
        {result.imagePrompt && (
          <div className="max-w-4xl mx-auto px-8 pb-12 animate-fade-in-up">
            <div className="bg-slate-900/50 rounded-xl border border-purple-500/20 overflow-hidden shadow-lg">
               <div className="bg-slate-900/80 px-6 py-3 border-b border-purple-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Sparkles className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">AI Image Prompt</h4>
                  </div>
                  <button
                    onClick={() => result.imagePrompt && handleCopy(result.imagePrompt)}
                    className="text-slate-500 hover:text-purple-400 transition-colors"
                    title="Copy Prompt"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
               </div>
               <div className="p-6 relative group bg-gradient-to-br from-slate-900 to-purple-900/10">
                  <p className="text-slate-300 font-mono text-sm leading-relaxed whitespace-pre-wrap opacity-90 group-hover:opacity-100 transition-opacity">
                    {result.imagePrompt}
                  </p>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Sources */}
      {result.sources.length > 0 && (
        <div className="bg-[#0f1623] px-6 py-4 border-t border-slate-800 z-10 shrink-0">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Share2 className="w-3 h-3" />
            Sources & References
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.sources.map((source, index) => (
              <a
                key={index}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-lg transition-all duration-200"
              >
                <div className="bg-slate-700 group-hover:bg-blue-500/20 p-1 rounded">
                   <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-400" />
                </div>
                <span className="text-xs text-slate-400 group-hover:text-slate-200 truncate max-w-[200px]">{source.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;