import React from 'react';
import { HistoryItem } from '../types';
import { X, Trash2, Clock, MessageSquare, History } from 'lucide-react';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onDelete,
  onClearAll,
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-semibold">
            <History className="w-5 h-5 text-primary-500" />
            <h2>生成紀錄 ({history.length})</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="h-[calc(100%-8rem)] overflow-y-auto custom-scrollbar p-4 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
              <Clock className="w-12 h-12 opacity-20" />
              <p>尚無歷史紀錄</p>
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id}
                className="group bg-slate-850 border border-slate-800 hover:border-primary-500/50 rounded-xl p-3 transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-primary-900/10 cursor-pointer relative overflow-hidden"
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-sm font-medium text-slate-200 line-clamp-2 pr-6">
                    {item.topic}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="text-slate-600 hover:text-red-400 p-1 rounded transition-colors absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                    title="刪除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.timestamp.split(' ')[0]}
                  </div>
                  <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-full">
                    <MessageSquare className="w-3 h-3" />
                    {item.result.platform}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800 bg-slate-900">
          <button
            onClick={onClearAll}
            disabled={history.length === 0}
            className={`w-full py-2.5 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
              history.length === 0 
                ? 'border-slate-800 text-slate-600 cursor-not-allowed' 
                : 'border-red-900/30 text-red-400 hover:bg-red-900/20 hover:border-red-800'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            清除所有紀錄
          </button>
        </div>
      </div>
    </>
  );
};

export default HistoryDrawer;