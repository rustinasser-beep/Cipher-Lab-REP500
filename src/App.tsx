/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileUp,
  Search,
  Grid,
  ShieldAlert,
  Sliders,
  Key,
  Shield,
  Layers,
  Sparkles,
  Lock,
  ArrowRight,
  Video,
} from 'lucide-react';
import { AppLanguage, HistoryItem } from './types';
import { translations } from './lib/i18n';
import { DEFAULT_PBKDF2_ITERATIONS } from './lib/cipher';
import { Navbar } from './components/Navbar';
import { TextEncryptor } from './components/TextEncryptor';
import { FileEncryptor } from './components/FileEncryptor';
import { EnvelopeInspector } from './components/EnvelopeInspector';
import { RepTableVisualizer } from './components/RepTableVisualizer';
import { VideoTutorial } from './components/VideoTutorial';
import { KeyGeneratorModal } from './components/KeyGeneratorModal';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import { HistoryDrawer } from './components/HistoryDrawer';

export default function App() {
  const [lang, setLang] = useState<AppLanguage>('ar');
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'video' | 'inspector' | 'matrix'>('text');
  const [sharedKey, setSharedKey] = useState<string>('');
  const [iterations, setIterations] = useState<number>(DEFAULT_PBKDF2_ITERATIONS);
  
  // Modals & Drawers
  const [isKeyGenOpen, setIsKeyGenOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  
  // Cross-component inspector target
  const [inspectorPayload, setInspectorPayload] = useState<string>('');
  
  // Ephemeral history
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const t = translations[lang];

  // Adjust document direction when language changes
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const handleToggleLang = () => {
    setLang(lang === 'ar' ? 'en' : 'ar');
  };

  const handleAddHistory = (item: HistoryItem) => {
    setHistory((prev) => [item, ...prev.slice(0, 29)]);
  };

  const handleApplyKey = (key: string) => {
    setSharedKey(key);
  };

  const handleInspectCiphertext = (cipher: string) => {
    setInspectorPayload(cipher);
    setActiveTab('inspector');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Navigation */}
      <Navbar
        lang={lang}
        onToggleLang={handleToggleLang}
        onOpenKeyGen={() => setIsKeyGenOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        currentIterations={iterations}
        historyCount={history.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
        
        {/* Technical Notice Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 sm:gap-3.5 shadow-lg shadow-amber-500/5">
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4 sm:w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed min-w-0">
            <span className="font-bold text-amber-300 block mb-0.5 sm:mb-1">
              {lang === 'ar' ? 'مواصفات ومعايير الأمان الخوارزمي:' : 'Cryptographic Architecture Notice:'}
            </span>
            <p className="text-slate-300/90 text-[11px] sm:text-xs">
              {t.noticeWarning}
            </p>
          </div>
        </div>

        {/* Primary View Navigation Tabs - Scrollable on mobile, centered on tablet/desktop */}
        <div className="flex justify-center border-b border-slate-800/80 pb-2 sm:pb-3 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
          <nav className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-[#0f1424] border border-slate-800 shadow-xl min-w-max">
            
            <button
              id="tab-text"
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'text'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{t.tabs.text}</span>
            </button>

            <button
              id="tab-file"
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'file'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{t.tabs.file}</span>
            </button>

            <button
              id="tab-video"
              type="button"
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'video'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span>{t.tabs.videoTutorial}</span>
            </button>

            <button
              id="tab-inspector"
              type="button"
              onClick={() => setActiveTab('inspector')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'inspector'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{t.tabs.inspector}</span>
            </button>

            <button
              id="tab-matrix"
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Grid className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{t.tabs.matrix}</span>
            </button>

          </nav>
        </div>

        {/* Tab Content Panels */}
        <div className="pt-2">
          {activeTab === 'text' && (
            <TextEncryptor
              lang={lang}
              sharedKey={sharedKey}
              onUpdateSharedKey={setSharedKey}
              onOpenKeyGen={() => setIsKeyGenOpen(true)}
              onInspectCiphertext={handleInspectCiphertext}
              iterations={iterations}
              onAddHistory={handleAddHistory}
            />
          )}

          {activeTab === 'file' && (
            <FileEncryptor
              lang={lang}
              sharedKey={sharedKey}
              onUpdateSharedKey={setSharedKey}
              onOpenKeyGen={() => setIsKeyGenOpen(true)}
              iterations={iterations}
              onAddHistory={handleAddHistory}
            />
          )}

          {activeTab === 'video' && (
            <VideoTutorial
              lang={lang}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'inspector' && (
            <EnvelopeInspector
              lang={lang}
              initialCiphertext={inspectorPayload}
            />
          )}

          {activeTab === 'matrix' && (
            <RepTableVisualizer
              lang={lang}
              sharedKey={sharedKey}
            />
          )}
        </div>

      </main>

      {/* Global Modals & Drawers */}
      <KeyGeneratorModal
        isOpen={isKeyGenOpen}
        onClose={() => setIsKeyGenOpen(false)}
        lang={lang}
        onApplyKey={handleApplyKey}
      />

      <SecuritySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        lang={lang}
        currentIterations={iterations}
        onSaveIterations={setIterations}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        lang={lang}
        history={history}
        onClearHistory={() => setHistory([])}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#090d16] py-6 px-4 text-center mt-12">
        <div className="max-w-7xl mx-auto space-y-2 text-xs font-mono text-slate-500">
          <p className="text-slate-400">{t.footer.spec}</p>
          <p className="text-emerald-400/80">{t.footer.privacy}</p>
        </div>
      </footer>

    </div>
  );
}
