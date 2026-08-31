import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Copy,
  Check,
  Trash2,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  Download,
  ArrowRightLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileCode2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppLanguage, HistoryItem } from '../types';
import { translations } from '../lib/i18n';
import { encryptText, decryptData, DecryptionError } from '../lib/cipher';
import { evaluateKeyStrength } from '../lib/keyGen';

interface TextEncryptorProps {
  lang: AppLanguage;
  sharedKey: string;
  onUpdateSharedKey: (key: string) => void;
  onOpenKeyGen: () => void;
  onInspectCiphertext: (ciphertext: string) => void;
  iterations: number;
  onAddHistory: (item: HistoryItem) => void;
}

export const TextEncryptor: React.FC<TextEncryptorProps> = ({
  lang,
  sharedKey,
  onUpdateSharedKey,
  onOpenKeyGen,
  onInspectCiphertext,
  iterations,
  onAddHistory,
}) => {
  const t = translations[lang];

  // Encrypt State
  const [plaintext, setPlaintext] = useState<string>('');
  const [encKey, setEncKey] = useState<string>(sharedKey);
  const [showEncKey, setShowEncKey] = useState<boolean>(false);
  const [ciphertext, setCiphertext] = useState<string>('');
  const [encLoading, setEncLoading] = useState<boolean>(false);
  const [encProgress, setEncProgress] = useState<string>('');
  const [encCopied, setEncCopied] = useState<boolean>(false);
  const [encStats, setEncStats] = useState<{
    durationMs: number;
    codesCount: number;
    bytes: number;
  } | null>(null);
  const [encError, setEncError] = useState<string>('');

  // Decrypt State
  const [decInput, setDecInput] = useState<string>('');
  const [decKey, setDecKey] = useState<string>(sharedKey);
  const [showDecKey, setShowDecKey] = useState<boolean>(false);
  const [decResult, setDecResult] = useState<string>('');
  const [decLoading, setDecLoading] = useState<boolean>(false);
  const [decProgress, setDecProgress] = useState<string>('');
  const [decCopied, setDecCopied] = useState<boolean>(false);
  const [decStats, setDecStats] = useState<{
    durationMs: number;
    bytes: number;
    iterations: number;
  } | null>(null);
  const [decError, setDecError] = useState<string>('');

  // Keep synced if sharedKey changed from outside
  React.useEffect(() => {
    if (sharedKey) {
      setEncKey(sharedKey);
      setDecKey(sharedKey);
    }
  }, [sharedKey]);

  // Handle Encrypt
  const handleEncrypt = async () => {
    setEncError('');
    if (!plaintext) {
      setEncError(lang === 'ar' ? 'الرجاء إدخال النص المراد تشفيره' : 'Please enter a message to encrypt');
      return;
    }
    if (!encKey) {
      setEncError(lang === 'ar' ? 'الرجاء إدخال المفتاح السري' : 'Please enter a secret key');
      return;
    }

    setEncLoading(true);
    setEncProgress(t.common.working);
    try {
      const result = await encryptText(plaintext, encKey, iterations, (status) => {
        setEncProgress(status);
      });
      setCiphertext(result.ciphertext);
      setEncStats({
        durationMs: result.stats.durationMs,
        codesCount: result.stats.repCodesCount,
        bytes: result.stats.cipherBytes,
      });

      onAddHistory({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        mode: 'encrypt',
        type: 'text',
        summary: plaintext.slice(0, 32) + (plaintext.length > 32 ? '...' : ''),
        iterations,
        durationMs: result.stats.durationMs,
        status: 'success',
      });
    } catch (err: any) {
      setEncError(err.message || 'Encryption error');
      onAddHistory({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        mode: 'encrypt',
        type: 'text',
        summary: 'Failed encryption',
        iterations,
        durationMs: 0,
        status: 'error',
        errorMessage: err.message,
      });
    } finally {
      setEncLoading(false);
      setEncProgress('');
    }
  };

  // Handle Decrypt
  const handleDecrypt = async () => {
    setDecError('');
    if (!decInput.trim()) {
      setDecError(lang === 'ar' ? 'الرجاء لصق النص المشفر (Base64)' : 'Please paste the ciphertext');
      return;
    }
    if (!decKey) {
      setDecError(lang === 'ar' ? 'الرجاء إدخال المفتاح السري' : 'Please enter the secret key');
      return;
    }

    setDecLoading(true);
    setDecProgress(t.common.working);
    try {
      const result = await decryptData(decInput.trim(), decKey, (status) => {
        setDecProgress(status);
      });

      if (result.plaintext !== undefined) {
        setDecResult(result.plaintext);
        setDecStats({
          durationMs: result.stats.durationMs,
          bytes: result.stats.outputBytes,
          iterations: result.stats.iterations,
        });

        // Micro celebration
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#f59e0b', '#06b6d4', '#10b981'],
        });

        onAddHistory({
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          mode: 'decrypt',
          type: 'text',
          summary: result.plaintext.slice(0, 32) + (result.plaintext.length > 32 ? '...' : ''),
          iterations: result.stats.iterations,
          durationMs: result.stats.durationMs,
          status: 'success',
        });
      }
    } catch (err: any) {
      const msg = err instanceof DecryptionError ? err.message : `Error: ${err.message}`;
      setDecError(msg);
      setDecResult('');
      onAddHistory({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        mode: 'decrypt',
        type: 'text',
        summary: 'Failed decryption',
        iterations: 0,
        durationMs: 0,
        status: 'error',
        errorMessage: msg,
      });
    } finally {
      setDecLoading(false);
      setDecProgress('');
    }
  };

  const handleCopy = async (text: string, isEnc: boolean) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    if (isEnc) {
      setEncCopied(true);
      setTimeout(() => setEncCopied(false), 2000);
    } else {
      setDecCopied(true);
      setTimeout(() => setDecCopied(false), 2000);
    }
  };

  const handleDownloadCiphertext = () => {
    if (!ciphertext) return;
    const blob = new Blob([ciphertext], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `encrypted_message_${Date.now()}.rep500`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendToDecrypt = () => {
    if (!ciphertext) return;
    setDecInput(ciphertext);
    setDecKey(encKey);
  };

  const encStrength = evaluateKeyStrength(encKey);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      
      {/* ----------------- ENCRYPT PANEL ----------------- */}
      <div className="bg-[#12182b] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col gap-4">
        
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{t.common.encrypt}</span>
                <span className="text-[11px] font-mono font-medium text-amber-400/90 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                  AES-GCM → REP500
                </span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPlaintext('Hello World! مرحباً بالعالم - هذا نص تجريبي لتأكيد التشفير العالي.');
            }}
            className="text-[11px] text-slate-400 hover:text-amber-400 underline underline-offset-2 transition-colors cursor-pointer"
          >
            {lang === 'ar' ? 'نص تجريبي' : 'Sample Text'}
          </button>
        </div>

        {/* Plaintext Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="enc-plain-input" className="font-semibold text-slate-300">
              {t.textModule.plainLabel}
            </label>
            <span className="font-mono text-slate-500 text-[11px]">
              {plaintext.length} {t.common.characters}
            </span>
          </div>
          <textarea
            id="enc-plain-input"
            rows={4}
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            placeholder={t.textModule.plainPlaceholder}
            className="w-full bg-[#090d16] border border-slate-800 focus:border-amber-500/80 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors resize-y font-mono leading-relaxed"
          />
        </div>

        {/* Secret Key Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="enc-key-input" className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.common.secretKey}</span>
            </label>
            {encKey && (
              <span className={`font-mono text-[11px] font-bold ${encStrength.color}`}>
                {encStrength.label[lang]} ({encStrength.entropyBits}b)
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="enc-key-input"
              type={showEncKey ? 'text' : 'password'}
              value={encKey}
              onChange={(e) => {
                setEncKey(e.target.value);
                onUpdateSharedKey(e.target.value);
              }}
              placeholder={t.common.secretKeyPlaceholder}
              className="w-full bg-[#090d16] border border-slate-800 focus:border-amber-500/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors font-mono"
              autoComplete="off"
            />
            <div className="absolute inset-y-0 end-0 flex items-center pe-2.5 gap-1">
              <button
                type="button"
                onClick={() => setShowEncKey(!showEncKey)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showEncKey ? t.common.hideKey : t.common.showKey}
              >
                {showEncKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onOpenKeyGen}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>{t.common.generateKey}</span>
            </button>
          </div>
        </div>

        {/* Encrypt Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            id="enc-run-btn"
            type="button"
            onClick={handleEncrypt}
            disabled={encLoading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>{encLoading ? encProgress || t.common.working : t.common.encrypt}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaintext('');
              setCiphertext('');
              setEncStats(null);
              setEncError('');
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all cursor-pointer"
            title={t.common.clear}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Encrypt Error Display */}
        {encError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{encError}</span>
          </div>
        )}

        {/* Ciphertext Output Area */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="enc-out-area" className="font-semibold text-slate-300">
              {t.textModule.cipherLabel}
            </label>
            {encStats && (
              <span className="font-mono text-emerald-400 text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {encStats.durationMs}ms · {encStats.codesCount} REP codes
              </span>
            )}
          </div>
          <textarea
            id="enc-out-area"
            rows={4}
            readOnly
            value={ciphertext}
            placeholder={lang === 'ar' ? 'ستظهر النتيجة المشفرة (Base64 Envelope) هنا...' : 'Encrypted Base64 envelope appears here...'}
            className="w-full bg-[#090d16] border border-slate-800 rounded-xl p-3 text-xs text-amber-200/90 font-mono focus:outline-none resize-y leading-relaxed select-all"
          />

          {/* Action Row for Ciphertext */}
          {ciphertext && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(ciphertext, true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  {encCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{encCopied ? t.common.copied : t.common.copy}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCiphertext}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  title="Download .rep500 file"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">{t.common.download}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendToDecrypt}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all cursor-pointer"
                  title="Copy to Decrypt tab"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'إرسال لفك التشفير' : 'Send to Decrypt'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInspectCiphertext(ciphertext)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition-all cursor-pointer"
                  title="Inspect envelope"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lang === 'ar' ? 'فحص المظروف' : 'Inspect'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>


      {/* ----------------- DECRYPT PANEL ----------------- */}
      <div className="bg-[#12182b] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col gap-4">
        
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Unlock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{t.common.decrypt}</span>
                <span className="text-[11px] font-mono font-medium text-cyan-400/90 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                  REP500 → AES-GCM
                </span>
              </h2>
            </div>
          </div>

          <label className="text-[11px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors cursor-pointer flex items-center gap-1">
            <FileCode2 className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تحميل ملف .rep500' : 'Load .rep500 file'}</span>
            <input
              type="file"
              accept=".rep500,.txt,.b64"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const text = await file.text();
                  setDecInput(text);
                }
              }}
            />
          </label>
        </div>

        {/* Ciphertext Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="dec-cipher-input" className="font-semibold text-slate-300">
              {t.textModule.cipherLabel}
            </label>
            <span className="font-mono text-slate-500 text-[11px]">
              {decInput.length} {t.common.characters}
            </span>
          </div>
          <textarea
            id="dec-cipher-input"
            rows={4}
            value={decInput}
            onChange={(e) => setDecInput(e.target.value)}
            placeholder={t.textModule.cipherPlaceholder}
            className="w-full bg-[#090d16] border border-slate-800 focus:border-cyan-500/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-colors resize-y font-mono leading-relaxed"
          />
        </div>

        {/* Secret Key Input for Decrypt */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="dec-key-input" className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.common.secretKey}</span>
            </label>
            {encKey && decKey !== encKey && (
              <button
                type="button"
                onClick={() => setDecKey(encKey)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono cursor-pointer"
              >
                {lang === 'ar' ? 'استخدام نفس مفتاح التشفير' : 'Use Encrypt Key'}
              </button>
            )}
          </div>
          <div className="relative">
            <input
              id="dec-key-input"
              type={showDecKey ? 'text' : 'password'}
              value={decKey}
              onChange={(e) => setDecKey(e.target.value)}
              placeholder={t.common.secretKeyPlaceholder}
              className="w-full bg-[#090d16] border border-slate-800 focus:border-cyan-500/80 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors font-mono"
              autoComplete="off"
            />
            <div className="absolute inset-y-0 end-0 flex items-center pe-2.5 gap-1">
              <button
                type="button"
                onClick={() => setShowDecKey(!showDecKey)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showDecKey ? t.common.hideKey : t.common.showKey}
              >
                {showDecKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Decrypt Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            id="dec-run-btn"
            type="button"
            onClick={handleDecrypt}
            disabled={decLoading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Unlock className="w-4 h-4 stroke-[2.5]" />
            <span>{decLoading ? decProgress || t.common.working : t.common.decrypt}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDecInput('');
              setDecResult('');
              setDecStats(null);
              setDecError('');
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all cursor-pointer"
            title={t.common.clear}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Decrypt Error Display */}
        {decError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{decError}</span>
          </div>
        )}

        {/* Plaintext Result Output Area */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between items-center text-xs">
            <label htmlFor="dec-out-area" className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>{t.textModule.plainLabel}</span>
              {decResult && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {t.common.done}
                </span>
              )}
            </label>
            {decStats && (
              <span className="font-mono text-cyan-400 text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {decStats.durationMs}ms · {decStats.iterations.toLocaleString()} iter
              </span>
            )}
          </div>
          <textarea
            id="dec-out-area"
            rows={4}
            readOnly
            value={decResult}
            placeholder={lang === 'ar' ? 'ستظهر الرسالة الأصلية بعد فك التشفير هنا...' : 'Decrypted message appears here...'}
            className="w-full bg-[#090d16] border border-slate-800 rounded-xl p-3 text-sm text-emerald-300 font-mono focus:outline-none resize-y leading-relaxed select-all"
          />

          {/* Action Row for Decrypted Text */}
          {decResult && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCopy(decResult, false)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                {decCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{decCopied ? t.common.copied : t.common.copy}</span>
              </button>

              <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.textModule.decSuccess}</span>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
