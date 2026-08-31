import React, { useState, useEffect } from 'react';
import { Search, Copy, Check, AlertCircle, CheckCircle2, FileCode, Layers, ShieldCheck, Database } from 'lucide-react';
import { AppLanguage } from '../types';
import { translations } from '../lib/i18n';
import { inspectEnvelope, base64ToBytes, toHex } from '../lib/cipher';
import { formatBytes } from './FileEncryptor';

interface EnvelopeInspectorProps {
  lang: AppLanguage;
  initialCiphertext?: string;
}

export const EnvelopeInspector: React.FC<EnvelopeInspectorProps> = ({
  lang,
  initialCiphertext = '',
}) => {
  const t = translations[lang];
  const [inputCiphertext, setInputCiphertext] = useState<string>(initialCiphertext);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  useEffect(() => {
    if (initialCiphertext) {
      setInputCiphertext(initialCiphertext);
    }
  }, [initialCiphertext]);

  const inspection = inspectEnvelope(inputCiphertext);

  let saltHex = '';
  let ivHex = '';
  let sampleCodes: string[] = [];

  if (inspection.valid && inspection.envelope) {
    try {
      saltHex = toHex(base64ToBytes(inspection.envelope.salt));
      ivHex = toHex(base64ToBytes(inspection.envelope.iv));
    } catch {}

    const data = inspection.envelope.data || '';
    for (let i = 0; i < Math.min(data.length, 110); i += 11) {
      sampleCodes.push(data.slice(i, i + 11));
    }
  }

  const handleCopyJson = async () => {
    if (!inspection.rawJson) return;
    await navigator.clipboard.writeText(inspection.rawJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="bg-[#12182b] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">{t.inspectorModule.title}</h3>
            <p className="text-xs text-slate-400">{t.inspectorModule.desc}</p>
          </div>
        </div>

        {/* Input Textarea */}
        <div className="space-y-1.5">
          <textarea
            rows={3}
            value={inputCiphertext}
            onChange={(e) => setInputCiphertext(e.target.value)}
            placeholder={t.inspectorModule.inputPlaceholder}
            className="w-full bg-[#090d16] border border-slate-800 focus:border-cyan-500/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none transition-colors font-mono resize-y"
          />
        </div>

        {/* Validation Status Banner */}
        {inputCiphertext.trim() && (
          <div>
            {inspection.valid && inspection.envelope ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">{t.inspectorModule.validEnvelope}</span>
                </div>
                <span className="font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  {inspection.envelope.alg}
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{inspection.error || t.inspectorModule.invalidEnvelope}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Envelope Details Breakdown */}
      {inspection.valid && inspection.envelope && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Metadata & Crypto Tokens */}
          <div className="bg-[#12182b] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'ar' ? 'معاملات المظروف المشفر' : 'Envelope Cryptographic Parameters'}</span>
            </h4>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#090d16] border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">{t.inspectorModule.version}:</span>
                <span className="font-bold text-cyan-300">v{inspection.envelope.v}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#090d16] border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">{t.inspectorModule.algorithm}:</span>
                <span className="font-bold text-amber-300">{inspection.envelope.alg}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#090d16] border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">{t.common.iterations}:</span>
                <span className="font-bold text-slate-100">
                  {(inspection.envelope.iter || 600000).toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#090d16] border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>{t.inspectorModule.saltBase64} (16 bytes):</span>
                  <span className="text-slate-200">{inspection.envelope.salt}</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate select-all">
                  0x{saltHex}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#090d16] border border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>{t.inspectorModule.ivBase64} (12 bytes):</span>
                  <span className="text-slate-200">{inspection.envelope.iv}</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate select-all">
                  0x{ivHex}
                </div>
              </div>

              {inspection.envelope.type === 'file' && (
                <div className="p-2.5 rounded-lg bg-[#090d16] border border-slate-800 space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t.fileModule.originalName}:</span>
                    <span className="font-bold text-amber-300">{inspection.envelope.filename}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>{t.fileModule.mimeType}:</span>
                    <span>{inspection.envelope.mime}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* REP500 Stream Analysis */}
          <div className="bg-[#12182b] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
              <Database className="w-4 h-4 text-amber-400" />
              <span>{lang === 'ar' ? 'تحليل جدول وتمثيل REP500' : 'REP500 Stream Metrics'}</span>
            </h4>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
                <div className="text-lg font-bold font-mono text-amber-400">
                  {inspection.stats?.codesCount.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {t.inspectorModule.tokenCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
                <div className="text-lg font-bold font-mono text-cyan-400">
                  {inspection.stats ? formatBytes(inspection.stats.rawSize) : '0'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Base64 Envelope Size
                </div>
              </div>
            </div>

            {/* Sample 11-digit Codes */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold block">
                {lang === 'ar' ? 'عينة من الأكواد الـ 11 رقماً المشفرة:' : 'Sample 11-digit REP Codes from stream:'}
              </label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-[#090d16] border border-slate-800 max-h-36 overflow-y-auto font-mono text-xs text-amber-300/90">
                {sampleCodes.map((code, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px]"
                  >
                    #{idx + 1}: {code}
                  </span>
                ))}
              </div>
            </div>

            {/* Raw JSON viewer */}
            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? t.common.copied : 'Copy JSON Envelope'}</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
