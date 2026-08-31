import React, { useState, useEffect } from 'react';
import {
  Grid,
  Search,
  Key,
  Sparkles,
  RefreshCw,
  Info,
  CheckCircle,
  Hash,
  Binary,
} from 'lucide-react';
import { AppLanguage } from '../types';
import { translations } from '../lib/i18n';
import {
  deriveKeys,
  buildRepresentationTable,
  utf8ToBytes,
  REPS_PER_BYTE,
  BYTE_VALUES,
  TOTAL_SLOTS,
} from '../lib/cipher';

interface RepTableVisualizerProps {
  lang: AppLanguage;
  sharedKey: string;
}

export const RepTableVisualizer: React.FC<RepTableVisualizerProps> = ({
  lang,
  sharedKey,
}) => {
  const t = translations[lang];

  const [testPassword, setTestPassword] = useState<string>(sharedKey || 'secret_key_demo');
  const [selectedByte, setSelectedByte] = useState<number>(65); // Default 'A' = 65
  const [inputChar, setInputChar] = useState<string>('A');
  const [codesForByte, setCodesForByte] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchCodeInput, setSearchCodeInput] = useState<string>('');
  const [searchResult, setSearchResult] = useState<{
    found: boolean;
    byte?: number;
    char?: string;
  } | null>(null);

  // Sync with sharedKey if changed
  useEffect(() => {
    if (sharedKey) {
      setTestPassword(sharedKey);
    }
  }, [sharedKey]);

  // Recompute representation table when password or selectedByte changes
  useEffect(() => {
    let isCancelled = false;

    async function loadTable() {
      if (!testPassword) return;
      setLoading(true);
      try {
        // Use a fixed salt for deterministic visualization preview
        const previewSalt = utf8ToBytes('rep500_preview_salt_demo');
        const { tableKeyBits } = await deriveKeys(testPassword, previewSalt, 10000);
        const table = await buildRepresentationTable(tableKeyBits);

        if (!isCancelled) {
          const codes = table.encodeTable[selectedByte] || [];
          setCodesForByte(codes);
        }
      } catch (e) {
        console.error('Failed to build preview table', e);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadTable();
    return () => {
      isCancelled = true;
    };
  }, [testPassword, selectedByte]);

  // Handle Char input change
  const handleCharChange = (val: string) => {
    setInputChar(val);
    if (val.length > 0) {
      const code = val.charCodeAt(0);
      if (code >= 0 && code <= 255) {
        setSelectedByte(code);
      }
    }
  };

  // Handle Reverse Lookup Test
  const handleSearchCode = async () => {
    if (!searchCodeInput.trim() || !testPassword) return;
    const num = Number(searchCodeInput.trim());
    if (isNaN(num)) {
      setSearchResult({ found: false });
      return;
    }

    try {
      const previewSalt = utf8ToBytes('rep500_preview_salt_demo');
      const { tableKeyBits } = await deriveKeys(testPassword, previewSalt, 10000);
      const table = await buildRepresentationTable(tableKeyBits);

      const byteValue = table.decodeMap.get(num);
      if (byteValue !== undefined) {
        const char = byteValue >= 32 && byteValue <= 126 ? String.fromCharCode(byteValue) : 'Non-printable';
        setSearchResult({ found: true, byte: byteValue, char });
      } else {
        setSearchResult({ found: false });
      }
    } catch {
      setSearchResult({ found: false });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Overview Banner */}
      <div className="bg-[#12182b] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">{t.matrixModule.title}</h3>
            <p className="text-xs text-slate-400">{t.matrixModule.desc}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
            <div className="text-base font-bold font-mono text-amber-400">256</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Byte Values (0x00 - 0xFF)</div>
          </div>
          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
            <div className="text-base font-bold font-mono text-cyan-400">500</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Codes Per Byte</div>
          </div>
          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
            <div className="text-base font-bold font-mono text-emerald-400">128,000</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Total Unique Codes</div>
          </div>
          <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
            <div className="text-base font-bold font-mono text-purple-400">11 Digits</div>
            <div className="text-[11px] text-slate-400 mt-0.5">10,000,000,000+</div>
          </div>
        </div>

        {/* Key & Byte Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'ar' ? 'مفتاح اشتقاق المصفوفة (Key):' : 'Key used to derive permutation table:'}</span>
            </label>
            <input
              type="text"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="Enter key to permute..."
              className="w-full bg-[#090d16] border border-slate-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {t.matrixModule.testByte}:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={1}
                value={inputChar}
                onChange={(e) => handleCharChange(e.target.value)}
                placeholder="A"
                className="w-16 bg-[#090d16] border border-slate-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs font-mono text-center font-bold text-amber-400 focus:outline-none"
              />
              <input
                type="number"
                min={0}
                max={255}
                value={selectedByte}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (num >= 0 && num <= 255) {
                    setSelectedByte(num);
                    setInputChar(String.fromCharCode(num));
                  }
                }}
                className="flex-1 bg-[#090d16] border border-slate-800 focus:border-amber-500/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
              />
            </div>
          </div>

        </div>

      </div>

      {/* 500 Representations Display */}
      <div className="bg-[#12182b] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">
              {t.matrixModule.repSlotsForByte}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
              Byte {selectedByte} (0x{selectedByte.toString(16).padStart(2, '0').toUpperCase()} / '{inputChar}')
            </span>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {codesForByte.length} / 500 codes
          </span>
        </div>

        {/* Matrix Grid of 500 11-digit numbers */}
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-amber-300 animate-pulse">
            Generating HMAC-DRBG 128,000 slot table...
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto p-4 rounded-xl bg-[#090d16] border border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 font-mono text-[11px]">
            {codesForByte.map((code, idx) => (
              <div
                key={idx}
                className="p-1.5 rounded bg-slate-900/90 border border-slate-800/80 text-amber-200/80 hover:border-amber-500/50 hover:text-amber-300 transition-colors flex items-center justify-between"
              >
                <span className="text-slate-600 text-[10px]">#{idx + 1}</span>
                <span className="font-semibold">{code}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reverse Lookup Test Tool */}
      <div className="bg-[#12182b] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400" />
          <span>{lang === 'ar' ? 'اختبار فك الشفرة العكسي (Code Reverse Lookup)' : 'Reverse Lookup Test'}</span>
        </h4>
        <p className="text-xs text-slate-400">
          {lang === 'ar'
            ? 'أدخل أي كود مكون من 11 رقماً للتحقق من البايت الأصلي الذي يمثله في هذا الجدول:'
            : 'Enter any 11-digit code to find the exact byte value it translates back to:'}
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchCodeInput}
            onChange={(e) => setSearchCodeInput(e.target.value)}
            placeholder="e.g. 10000045231"
            className="flex-1 bg-[#090d16] border border-slate-800 focus:border-cyan-500/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSearchCode}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            {lang === 'ar' ? 'بحث' : 'Lookup'}
          </button>
        </div>

        {searchResult && (
          <div className="mt-2">
            {searchResult.found ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center justify-between">
                <span>Decodes to: Byte <strong>{searchResult.byte}</strong> (0x{searchResult.byte?.toString(16).padStart(2, '0').toUpperCase()})</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 font-bold">Char: '{searchResult.char}'</span>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono">
                Code not found in valid range or not mapped with this key.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
