import React from 'react';
import { History, X, Trash2, CheckCircle2, AlertCircle, Clock, File, FileText } from 'lucide-react';
import { AppLanguage, HistoryItem } from '../types';
import { translations } from '../lib/i18n';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: AppLanguage;
  history: HistoryItem[];
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  lang,
  history,
  onClearHistory,
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111726] border-s border-slate-800 w-full max-w-md h-full shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm sm:text-base font-bold text-slate-100">{t.common.history}</h3>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                title={t.common.clear}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              {lang === 'ar' ? 'لا توجد عمليات سابقة في هذه الجلسة' : 'No cryptographic operations in this session'}
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 font-mono text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.mode === 'encrypt'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      {item.mode === 'encrypt' ? t.common.encrypt : t.common.decrypt}
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {item.status === 'success' ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.durationMs}ms
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1 text-[10px]">
                      <AlertCircle className="w-3 h-3" />
                      {t.common.error}
                    </span>
                  )}
                </div>

                <div className="text-slate-200 text-[11px] truncate flex items-center gap-1.5">
                  {item.type === 'file' ? (
                    <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  <span className="truncate">{item.summary}</span>
                </div>

                <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                  <span>{item.iterations.toLocaleString()} iter</span>
                  <span>{item.type.toUpperCase()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-center text-slate-500 font-mono">
          {lang === 'ar' ? 'تُحفظ السجلات في الذاكرة المؤقتة فقط' : 'Session logs kept in volatile RAM only'}
        </div>

      </div>
    </div>
  );
};
