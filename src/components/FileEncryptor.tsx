import React, { useState, useRef } from 'react';
import {
  FileUp,
  FileCheck,
  Download,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Sparkles,
  File,
  AlertCircle,
  Clock,
  HardDrive,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppLanguage, HistoryItem } from '../types';
import { translations } from '../lib/i18n';
import { encryptFile, decryptData, DecryptionError } from '../lib/cipher';
import { evaluateKeyStrength } from '../lib/keyGen';

interface FileEncryptorProps {
  lang: AppLanguage;
  sharedKey: string;
  onUpdateSharedKey: (key: string) => void;
  onOpenKeyGen: () => void;
  iterations: number;
  onAddHistory: (item: HistoryItem) => void;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export const FileEncryptor: React.FC<FileEncryptorProps> = ({
  lang,
  sharedKey,
  onUpdateSharedKey,
  onOpenKeyGen,
  iterations,
  onAddHistory,
}) => {
  const t = translations[lang];

  // Mode: 'encrypt' | 'decrypt'
  const [activeMode, setActiveMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  // Encryption state
  const [encSelectedFile, setEncSelectedFile] = useState<File | null>(null);
  const [encKey, setEncKey] = useState<string>(sharedKey);
  const [showEncKey, setShowEncKey] = useState<boolean>(false);
  const [encLoading, setEncLoading] = useState<boolean>(false);
  const [encProgressMsg, setEncProgressMsg] = useState<string>('');
  const [encProgressPct, setEncProgressPct] = useState<number>(0);
  const [encResultUrl, setEncResultUrl] = useState<{ url: string; filename: string; size: number } | null>(null);
  const [encError, setEncError] = useState<string>('');

  // Decryption state
  const [decSelectedFile, setDecSelectedFile] = useState<File | null>(null);
  const [decKey, setDecKey] = useState<string>(sharedKey);
  const [showDecKey, setShowDecKey] = useState<boolean>(false);
  const [decLoading, setDecLoading] = useState<boolean>(false);
  const [decProgressMsg, setDecProgressMsg] = useState<string>('');
  const [decResult, setDecResult] = useState<{
    url: string;
    filename: string;
    mime: string;
    size: number;
    previewUrl?: string;
    isImage?: boolean;
    isText?: boolean;
    textContent?: string;
  } | null>(null);
  const [decError, setDecError] = useState<string>('');

  const encFileInputRef = useRef<HTMLInputElement>(null);
  const decFileInputRef = useRef<HTMLInputElement>(null);

  // Sync key
  React.useEffect(() => {
    if (sharedKey) {
      setEncKey(sharedKey);
      setDecKey(sharedKey);
    }
  }, [sharedKey]);

  // Handle Encrypt File
  const handleEncryptFile = async () => {
    setEncError('');
    if (!encSelectedFile) {
      setEncError(lang === 'ar' ? 'الرجاء اختيار ملف للتشفير' : 'Please select a file to encrypt');
      return;
    }
    if (!encKey) {
      setEncError(lang === 'ar' ? 'الرجاء إدخال المفتاح السري' : 'Please enter a secret key');
      return;
    }

    setEncLoading(true);
    setEncProgressPct(10);
    setEncProgressMsg(t.common.working);
    try {
      const result = await encryptFile(encSelectedFile, encKey, iterations, (msg, pct) => {
        setEncProgressMsg(msg);
        if (pct) setEncProgressPct(pct);
      });

      const blob = new Blob([result.ciphertext], { type: 'text/plain;charset=utf-8' });
      const downloadUrl = URL.createObjectURL(blob);
      const outputFilename = `${encSelectedFile.name}.rep500`;

      setEncResultUrl({
        url: downloadUrl,
        filename: outputFilename,
        size: blob.size,
      });

      // Auto download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = outputFilename;
      a.click();

      onAddHistory({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        mode: 'encrypt',
        type: 'file',
        filename: encSelectedFile.name,
        summary: `${encSelectedFile.name} (${formatBytes(encSelectedFile.size)})`,
        iterations,
        durationMs: result.stats.durationMs,
        status: 'success',
      });
    } catch (err: any) {
      setEncError(err.message || 'File encryption error');
      onAddHistory({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        mode: 'encrypt',
        type: 'file',
        filename: encSelectedFile.name,
        summary: `Failed to encrypt ${encSelectedFile.name}`,
        iterations,
        durationMs: 0,
        status: 'error',
        errorMessage: err.message,
      });
    } finally {
      setEncLoading(false);
    }
  };

  // Handle Decrypt File
  const handleDecryptFile = async () => {
    setDecError('');
    if (!decSelectedFile) {
      setDecError(lang === 'ar' ? 'الرجاء اختيار ملف .rep500 لفك تشفيره' : 'Please select an encrypted .rep500 file');
      return;
    }
    if (!decKey) {
      setDecError(lang === 'ar' ? 'الرجاء إدخال المفتاح السري' : 'Please enter the secret key');
      return;
    }

    setDecLoading(true);
    setDecProgressMsg(t.common.working);
    try {
      const ciphertext = await decSelectedFile.text();
      const result = await decryptData(ciphertext, decKey, (msg) => {
        setDecProgressMsg(msg);
      });

      let blob: Blob;
      let filename = result.filename || 'decrypted_file';
      let mime = result.mime || 'application/octet-stream';

      if (result.type === 'file' && result.fileData) {
        blob = new Blob([result.fileData], { type: mime });
      } else if (result.plaintext) {
        blob = new Blob([result.plaintext], { type: 'text/plain;charset=utf-8' });
        filename = filename.endsWith('.txt') ? filename : `${filename}.txt`;
        mime = 'text/plain';
      } else {
        throw new Error('No data found in decrypted payload.');
      }

      const downloadUrl = URL.createObjectURL(blob);
      const isImage = mime.startsWith('image/');
      const isText = mime.startsWith('text/') || mime === 'application/json';
      let textContent: string | undefined;

      if (isText && result.type === 'file' && result.fileData) {
        try {
          textContent = new TextDecoder().decode(result.fileData).slice(0, 1000);
        } catch {}
      } else if (result.plaintext) {
        textContent = result.plaintext.slice(0, 1000);
      }

      setDecResult({
        url: downloadUrl,
        filename,
        mime,
        size: blob.size,
        previewUrl: isImage ? downloadUrl : undefined,
        isImage,
        isText,
        textContent,
      });

      // Micro celebration
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.7 },
      });

      // Auto download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.click();

      onAddHistory({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        mode: 'decrypt',
        type: 'file',
        filename,
        summary: `${filename} (${formatBytes(blob.size)})`,
        iterations: result.stats.iterations,
        durationMs: result.stats.durationMs,
        status: 'success',
      });
    } catch (err: any) {
      const msg = err instanceof DecryptionError ? err.message : `Error: ${err.message}`;
      setDecError(msg);
      onAddHistory({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        mode: 'decrypt',
        type: 'file',
        filename: decSelectedFile.name,
        summary: `Failed to decrypt ${decSelectedFile.name}`,
        iterations: 0,
        durationMs: 0,
        status: 'error',
        errorMessage: msg,
      });
    } finally {
      setDecLoading(false);
    }
  };

  const encStrength = evaluateKeyStrength(encKey);

  return (
    <div className="space-y-6">
      
      {/* Mode Switcher Tabs */}
      <div className="flex justify-center">
        <div className="bg-[#0f1424] p-1 rounded-xl border border-slate-800 flex items-center gap-1 shadow-md">
          <button
            type="button"
            onClick={() => setActiveMode('encrypt')}
            className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMode === 'encrypt'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{t.fileModule.titleEncrypt}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('decrypt')}
            className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeMode === 'decrypt'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Unlock className="w-4 h-4" />
            <span>{t.fileModule.titleDecrypt}</span>
          </button>
        </div>
      </div>

      {/* ----------------- FILE ENCRYPT MODE ----------------- */}
      {activeMode === 'encrypt' && (
        <div className="bg-[#12182b] border border-slate-800 rounded-2xl p-6 shadow-xl max-w-3xl mx-auto space-y-5">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">{t.fileModule.titleEncrypt}</h3>
                <p className="text-xs text-slate-400">{t.fileModule.supportedTypes}</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-amber-400/90 bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-500/20">
              Binary → AES-256-GCM+REP500
            </span>
          </div>

          {/* Drag & Drop File Zone */}
          <div
            onClick={() => encFileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) {
                setEncSelectedFile(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-slate-700/80 hover:border-amber-500/60 rounded-2xl p-8 text-center bg-[#090d16]/70 hover:bg-[#090d16] transition-all cursor-pointer group flex flex-col items-center justify-center gap-3"
          >
            <input
              ref={encFileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setEncSelectedFile(e.target.files[0]);
                }
              }}
            />

            {encSelectedFile ? (
              <div className="flex items-center gap-3 bg-slate-800/80 p-3.5 rounded-xl border border-amber-500/40 text-start w-full max-w-md">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                    {encSelectedFile.name}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{formatBytes(encSelectedFile.size)}</span>
                    <span>•</span>
                    <span className="truncate">{encSelectedFile.type || 'Binary file'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEncSelectedFile(null);
                    setEncResultUrl(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {t.fileModule.dragDropEnc}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t.fileModule.maxSizeNotice}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Secret Key Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="file-enc-key" className="font-semibold text-slate-300 flex items-center gap-1.5">
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
                id="file-enc-key"
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

          {/* Progress Bar if loading */}
          {encLoading && (
            <div className="space-y-2 p-4 rounded-xl bg-slate-900/80 border border-slate-800 animate-pulse">
              <div className="flex justify-between text-xs text-amber-300 font-mono">
                <span>{encProgressMsg || t.common.working}</span>
                <span>{encProgressPct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${encProgressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Error notice */}
          {encError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{encError}</span>
            </div>
          )}

          {/* Encrypt File CTA Button */}
          <button
            type="button"
            onClick={handleEncryptFile}
            disabled={encLoading || !encSelectedFile}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>{t.fileModule.encryptAndDownload}</span>
          </button>

          {/* Result Card */}
          {encResultUrl && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-200">
                    {lang === 'ar' ? 'تم تشفير الملف وتحميله تلقائياً!' : 'File encrypted and downloaded!'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {encResultUrl.filename} ({formatBytes(encResultUrl.size)})
                  </div>
                </div>
              </div>
              <a
                href={encResultUrl.url}
                download={encResultUrl.filename}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.common.download}</span>
              </a>
            </div>
          )}

        </div>
      )}

      {/* ----------------- FILE DECRYPT MODE ----------------- */}
      {activeMode === 'decrypt' && (
        <div className="bg-[#12182b] border border-slate-800 rounded-2xl p-6 shadow-xl max-w-3xl mx-auto space-y-5">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">{t.fileModule.titleDecrypt}</h3>
                <p className="text-xs text-slate-400">{t.fileModule.dragDropDec}</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-cyan-400/90 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-500/20">
              REP500 → Original File
            </span>
          </div>

          {/* Drag & Drop Encrypted File Zone */}
          <div
            onClick={() => decFileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) {
                setDecSelectedFile(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-slate-700/80 hover:border-cyan-500/60 rounded-2xl p-8 text-center bg-[#090d16]/70 hover:bg-[#090d16] transition-all cursor-pointer group flex flex-col items-center justify-center gap-3"
          >
            <input
              ref={decFileInputRef}
              type="file"
              accept=".rep500,.txt,.b64"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setDecSelectedFile(e.target.files[0]);
                }
              }}
            />

            {decSelectedFile ? (
              <div className="flex items-center gap-3 bg-slate-800/80 p-3.5 rounded-xl border border-cyan-500/40 text-start w-full max-w-md">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                    {decSelectedFile.name}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{formatBytes(decSelectedFile.size)}</span>
                    <span>•</span>
                    <span>Encrypted Payload</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDecSelectedFile(null);
                    setDecResult(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <File className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {t.fileModule.dragDropDec}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    .rep500, .txt, or Base64 envelope
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Secret Key Input for Decryption */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="file-dec-key" className="font-semibold text-slate-300 flex items-center gap-1.5">
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
                id="file-dec-key"
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
                >
                  {showDecKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Decrypt loading indicator */}
          {decLoading && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2 animate-pulse">
              <p className="text-xs text-cyan-300 font-mono">{decProgressMsg || t.common.working}</p>
            </div>
          )}

          {/* Decrypt Error notice */}
          {decError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{decError}</span>
            </div>
          )}

          {/* Decrypt File CTA Button */}
          <button
            type="button"
            onClick={handleDecryptFile}
            disabled={decLoading || !decSelectedFile}
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/40 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Unlock className="w-4 h-4 stroke-[2.5]" />
            <span>{t.fileModule.decryptAndDownload}</span>
          </button>

          {/* Decryption Result Card + Preview */}
          {decResult && (
            <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-emerald-200">
                      {lang === 'ar' ? 'تم فك تشفير واستعادة الملف بنجاح!' : 'File decrypted and restored successfully!'}
                    </div>
                    <div className="text-xs text-slate-300 font-mono mt-0.5">
                      {decResult.filename} • {formatBytes(decResult.size)} • {decResult.mime}
                    </div>
                  </div>
                </div>
                <a
                  href={decResult.url}
                  download={decResult.filename}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.common.download}</span>
                </a>
              </div>

              {/* Image Preview if applicable */}
              {decResult.isImage && decResult.previewUrl && (
                <div className="mt-3 p-2 rounded-lg bg-black/50 border border-slate-800 flex justify-center">
                  <img
                    src={decResult.previewUrl}
                    alt={decResult.filename}
                    className="max-h-64 rounded object-contain"
                  />
                </div>
              )}

              {/* Text Preview if applicable */}
              {decResult.isText && decResult.textContent && (
                <div className="mt-3 p-3 rounded-lg bg-black/60 border border-slate-800 text-xs font-mono text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {decResult.textContent}
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
