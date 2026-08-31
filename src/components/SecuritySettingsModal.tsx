import React, { useState } from 'react';
import { Sliders, X, Zap, ShieldCheck, Gauge, Info, Check } from 'lucide-react';
import { AppLanguage } from '../types';
import { translations } from '../lib/i18n';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: AppLanguage;
  currentIterations: number;
  onSaveIterations: (iter: number) => void;
}

export const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  lang,
  currentIterations,
  onSaveIterations,
}) => {
  const t = translations[lang];
  const [iter, setIter] = useState<number>(currentIterations);

  if (!isOpen) return null;

  const presets = [
    { value: 50_000, label: t.settingsModal.presetFast, icon: Zap, color: 'text-emerald-400', tag: 'Fast' },
    { value: 150_000, label: t.settingsModal.presetBalanced, icon: Gauge, color: 'text-cyan-400', tag: 'Balanced' },
    { value: 300_000, label: t.settingsModal.presetHigh, icon: ShieldCheck, color: 'text-amber-400', tag: 'Standard' },
    { value: 600_000, label: t.settingsModal.presetOriginal, icon: ShieldCheck, color: 'text-red-400', tag: 'Original (600k)' },
  ];

  const handleSave = () => {
    onSaveIterations(iter);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111726] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{t.settingsModal.title}</h3>
              <p className="text-xs text-slate-400">{t.settingsModal.desc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Preset Buttons */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-300 block">
              {lang === 'ar' ? 'المستويات الجاهزة للاشتقاق:' : 'PBKDF2 Presets:'}
            </label>
            <div className="space-y-2">
              {presets.map((preset) => {
                const isSelected = iter === preset.value;
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setIter(preset.value)}
                    className={`w-full p-3 rounded-xl border text-start flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${preset.color}`} />
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-slate-100 flex items-center gap-2">
                          <span>{preset.value.toLocaleString()} {t.common.iterations}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-800 ${preset.color}`}>
                            {preset.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{preset.label}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Slider */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">{t.settingsModal.customIter}</span>
              <span className="font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                {iter.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="10000"
              max="1000000"
              step="10000"
              value={iter}
              onChange={(e) => setIter(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer bg-slate-800"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>10,000 (Faster)</span>
              <span>600,000 (Original)</span>
              <span>1,000,000 (Ultra)</span>
            </div>
          </div>

          {/* Compatibility Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{t.settingsModal.warning}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              {t.common.close}
            </button>
            <button
              id="btn-save-settings"
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              {t.settingsModal.save}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
