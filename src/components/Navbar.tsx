import React from 'react';
import { Shield, Key, Sliders, Globe, Lock, History } from 'lucide-react';
import { AppLanguage } from '../types';
import { translations } from '../lib/i18n';

interface NavbarProps {
  lang: AppLanguage;
  onToggleLang: () => void;
  onOpenKeyGen: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  currentIterations: number;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  onOpenKeyGen,
  onOpenSettings,
  onOpenHistory,
  currentIterations,
  historyCount,
}) => {
  const t = translations[lang];

  return (
    <header className="border-b border-slate-800 bg-[#0d1322]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-[#0b0f19]">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-wide font-mono">
                {lang === 'ar' ? 'مختبر REP500' : 'Cipher Lab'}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-semibold">
                v1 · AES-256
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Key Generator Shortcut */}
          <button
            id="btn-nav-keygen"
            onClick={onOpenKeyGen}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:border-amber-500/50 hover:text-amber-300 cursor-pointer"
            title={t.common.generateKey}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">{t.common.generateKey}</span>
          </button>

          {/* PBKDF2 Settings */}
          <button
            id="btn-nav-settings"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:border-cyan-500/50 hover:text-cyan-300 cursor-pointer"
            title={t.common.settings}
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs hidden lg:inline">
              {(currentIterations / 1000).toFixed(0)}k iter
            </span>
          </button>

          {/* History drawer */}
          <button
            id="btn-nav-history"
            onClick={onOpenHistory}
            className="relative flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            title={t.common.history}
          >
            <History className="w-4 h-4" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </button>

          {/* Language Toggle */}
          <button
            id="btn-nav-lang"
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all text-xs font-semibold cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
          </button>
        </div>

      </div>

      {/* Security Banner Ribbon */}
      <div className="bg-slate-900/60 border-t border-slate-800/60 px-4 py-1 text-center">
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>{t.badgeClientOnly}</span>
        </div>
      </div>
    </header>
  );
};
