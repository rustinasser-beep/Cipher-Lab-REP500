import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, RefreshCw, X, ShieldAlert, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { AppLanguage, KeyGenOptions } from '../types';
import { translations } from '../lib/i18n';
import { evaluateKeyStrength, generateCryptoRandomKey } from '../lib/keyGen';

interface KeyGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: AppLanguage;
  onApplyKey: (key: string, target: 'encrypt' | 'decrypt' | 'both') => void;
}

export const KeyGeneratorModal: React.FC<KeyGeneratorModalProps> = ({
  isOpen,
  onClose,
  lang,
  onApplyKey,
}) => {
  const t = translations[lang];

  const [options, setOptions] = useState<KeyGenOptions>({
    length: 24,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    type: 'complex',
    wordCount: 4,
  });

  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleGenerate = () => {
    const key = generateCryptoRandomKey(options);
    setGeneratedKey(key);
  };

  useEffect(() => {
    if (isOpen) {
      handleGenerate();
    }
  }, [isOpen, options]);

  if (!isOpen) return null;

  const strength = evaluateKeyStrength(generatedKey);

  const handleCopy = async () => {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111726] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{t.keyGenModal.title}</h3>
              <p className="text-xs text-slate-400">{t.keyGenModal.desc}</p>
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
          
          {/* Key Display Card */}
          <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-3 relative group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {strength.entropyBits} {t.common.bit} {t.common.entropy}
              </span>
              <span className={`text-xs font-bold font-mono ${strength.color}`}>
                {strength.label[lang]}
              </span>
            </div>

            <div className="font-mono text-sm sm:text-base break-all text-amber-300 select-all p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 min-h-[48px] flex items-center">
              {generatedKey}
            </div>

            {/* Strength Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${
                  strength.score === 4
                    ? 'bg-cyan-400 w-full'
                    : strength.score === 3
                    ? 'bg-emerald-400 w-3/4'
                    : strength.score === 2
                    ? 'bg-amber-400 w-1/2'
                    : 'bg-red-400 w-1/4'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                id="btn-modal-regen-key"
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.keyGenModal.generateNew}</span>
              </button>
              <button
                id="btn-modal-copy-key"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.common.copied : t.common.copy}</span>
              </button>
            </div>
          </div>

          {/* Key Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300 block">
              {lang === 'ar' ? 'نوع المفتاح' : 'Key Generation Preset'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOptions({ ...options, type: 'complex' })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-start cursor-pointer ${
                  options.type === 'complex'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {t.keyGenModal.typeComplex}
              </button>
              <button
                type="button"
                onClick={() => setOptions({ ...options, type: 'passphrase' })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-start cursor-pointer ${
                  options.type === 'passphrase'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {t.keyGenModal.typePassphrase}
              </button>
              <button
                type="button"
                onClick={() => setOptions({ ...options, type: 'hex' })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-start cursor-pointer ${
                  options.type === 'hex'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {t.keyGenModal.typeHex}
              </button>
              <button
                type="button"
                onClick={() => setOptions({ ...options, type: 'pin' })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-start cursor-pointer ${
                  options.type === 'pin'
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {t.keyGenModal.typePin}
              </button>
            </div>
          </div>

          {/* Length Slider (for complex/hex/pin) */}
          {options.type !== 'passphrase' ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>{t.keyGenModal.length}</span>
                <span className="font-mono font-bold text-amber-400">{options.length}</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={options.length}
                onChange={(e) => setOptions({ ...options, length: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer bg-slate-800"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>{lang === 'ar' ? 'عدد الكلمات:' : 'Word Count:'}</span>
                <span className="font-mono font-bold text-amber-400">{options.wordCount || 4}</span>
              </div>
              <input
                type="range"
                min="3"
                max="8"
                value={options.wordCount || 4}
                onChange={(e) => setOptions({ ...options, wordCount: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer bg-slate-800"
              />
            </div>
          )}

          {/* Insert Shortcut Buttons */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 block font-medium">
              {lang === 'ar' ? 'تطبيق المفتاح مباشرة على الواجهة:' : 'Directly apply this key to:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onApplyKey(generatedKey, 'encrypt');
                  onClose();
                }}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer text-center"
              >
                {t.keyGenModal.useInEncrypt}
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyKey(generatedKey, 'decrypt');
                  onClose();
                }}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all cursor-pointer text-center"
              >
                {t.keyGenModal.useInDecrypt}
              </button>
              <button
                type="button"
                onClick={() => {
                  onApplyKey(generatedKey, 'both');
                  onClose();
                }}
                className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold text-amber-300 transition-all cursor-pointer text-center"
              >
                {t.keyGenModal.useInBoth}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
