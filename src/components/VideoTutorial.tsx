import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Sparkles,
  Key,
  FileText,
  FileUp,
  ShieldCheck,
  Search,
  Grid,
  CheckCircle2,
  Lock,
  Unlock,
  Layers,
  HelpCircle,
  Video,
  Download,
  AlertCircle,
  Loader2,
  Film,
} from 'lucide-react';
import { AppLanguage } from '../types';
import { translations } from '../lib/i18n';

interface VideoTutorialProps {
  lang: AppLanguage;
  onNavigateTab?: (tab: 'text' | 'file' | 'inspector' | 'matrix') => void;
}

interface StepScene {
  id: number;
  timeSec: number;
  durationSec: number;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  narrationAr: string;
  narrationEn: string;
  activeFeature: 'intro' | 'key' | 'text-enc' | 'text-dec' | 'file-enc' | 'inspector' | 'matrix';
  mockInput?: string;
  mockKey?: string;
  mockOutput?: string;
}

const SCENES: StepScene[] = [
  {
    id: 1,
    timeSec: 0,
    durationSec: 8,
    titleAr: 'مقدمة: ما هو نظام REP500 وتشفير AES-256-GCM؟',
    titleEn: 'Intro: What is REP500 & AES-256-GCM Architecture?',
    subtitleAr: 'نظام تشفير متطور يجمع بين الأمان العسكري (AES-256) ومصفوفة تشويش إحصائي مكونة من 128,000 كود.',
    subtitleEn: 'Advanced cryptography combining AES-256-GCM authenticated encryption with 128,000 statistical decoy codes.',
    narrationAr: 'أهلاً بك في منصة Cipher Lab REP500. هذه المنصة توفر تشفيراً حقيقياً داخل متصفحك بنسبة 100% دون إرسال بياناتك لأي خادم.',
    narrationEn: 'Welcome to Cipher Lab REP500. This platform delivers 100% client-side zero-knowledge encryption using browser SubtleCrypto.',
    activeFeature: 'intro',
  },
  {
    id: 2,
    timeSec: 8,
    durationSec: 9,
    titleAr: 'الخطوة 1: توليد المفتاح السري وإدارة الأمان',
    titleEn: 'Step 1: Master Secret Key & High-Entropy Generation',
    subtitleAr: 'اضغط على أيقونة المفتاح بالأعلى لاختيار أو توليد مفتاح عشوائي فائق الإنتروبيا (256-bit).',
    subtitleEn: 'Generate high-entropy 256-bit hexadecimal keys or passphrase combinations via the built-in generator.',
    narrationAr: 'الخطوة الأولى تبدأ بإدخال المفتاح السري أو الضغط على "مولد المفاتيح" لإنشاء مفتاح عشوائي لا يمكن تخمينه.',
    narrationEn: 'Step one: Enter a secure passphrase or open the Key Generator to produce a mathematically unbreakable 256-bit key.',
    activeFeature: 'key',
    mockKey: 'Secr3t_K3y_REP500_#2026!x9q',
  },
  {
    id: 3,
    timeSec: 17,
    durationSec: 10,
    titleAr: 'الخطوة 2: تشفير النصوص والمحادثات الحساسة',
    titleEn: 'Step 2: Text Encryption & Base64 Envelope',
    subtitleAr: 'اكتب رسالتك، حدد المفتاح السري، واضغط زر "تشفير". سيتم توليد مظروف رقمي مشفر.',
    subtitleEn: 'Type your message, provide your key, and click Encrypt. An authentic REP500 Base64 envelope is generated.',
    narrationAr: 'في تبويب تشفير النصوص، اكتب أي رسالة واضغط تشفير، ليتم تحويلها لمظروف رقمي آمن يمكنك نسخه ومشاركته بأمان.',
    narrationEn: 'In Text Encryption tab, input your text and click Encrypt. It wraps into a tamper-proof Base64 cryptogram ready to share.',
    activeFeature: 'text-enc',
    mockInput: 'معلومات سرية جداً - تقرير الحسابات 2026',
    mockKey: 'Secr3t_K3y_REP500_#2026!x9q',
    mockOutput: '{"v":1,"salt":"A9b/xL3k...","iv":"9Qz18vP...","ct":"REP500-98172349182..."}',
  },
  {
    id: 4,
    timeSec: 27,
    durationSec: 9,
    titleAr: 'الخطوة 3: فك تشفير النصوص بسهولة',
    titleEn: 'Step 3: Text Decryption & Integrity Verification',
    subtitleAr: 'المستلم يلصق المظروف ويدخل نفس المفتاح السري في خانة فك التشفير لاستعادة النص الأصلي.',
    subtitleEn: 'The recipient pastes the envelope, enters the matching secret key, and decrypts to reveal the exact plaintext.',
    narrationAr: 'لفك التشفير، يلصق المستلم المظروف ويدخل نفس المفتاح السري، ليتم التحقق من صحة التشفير واسترجاع النص فوراً.',
    narrationEn: 'To decrypt, simply paste the envelope and input the identical key. AES-GCM tag verification guarantees authenticity.',
    activeFeature: 'text-dec',
    mockInput: '{"v":1,"salt":"A9b/xL3k...","iv":"9Qz18vP...","ct":"REP500-98172349182..."}',
    mockKey: 'Secr3t_K3y_REP500_#2026!x9q',
    mockOutput: 'معلومات سرية جداً - تقرير الحسابات 2026',
  },
  {
    id: 5,
    timeSec: 36,
    durationSec: 10,
    titleAr: 'الخطوة 4: تشفير الملفات والمستندات (.rep500)',
    titleEn: 'Step 4: Encrypting Files, PDFs & Images (.rep500)',
    subtitleAr: 'اسحب أي ملف (PDF، صور، مستندات)، ليتم تشفيره بالكامل وتنزيله بصيغة محصنة .rep500.',
    subtitleEn: 'Drag & drop any file (PDF, image, archive). It downloads as a secure .rep500 container with preserved MIME types.',
    narrationAr: 'يمكنك أيضاً سحب وإفلات أي ملف مثل الصور والـ PDF لتشفيره بضغطة واحدة وتنزيله بصيغة .rep500 الآمنة.',
    narrationEn: 'Encrypt any confidential document, image, or archive. Decrypting later restores the exact file name and MIME type.',
    activeFeature: 'file-enc',
    mockInput: 'Financial_Report_Confidential.pdf (3.4 MB)',
    mockKey: 'Secr3t_K3y_REP500_#2026!x9q',
    mockOutput: 'Financial_Report_Confidential.pdf.rep500',
  },
  {
    id: 6,
    timeSec: 46,
    durationSec: 9,
    titleAr: 'الخطوة 5: فاحص المظروف ومصفوفة الأكواد العشوائية',
    titleEn: 'Step 5: Envelope Inspector & Matrix Explorer',
    subtitleAr: 'تحليل مكونات التشفير (Salt, IV, Ciphertext) واستعراض مصفوفة الـ 128,000 كود الفريدة.',
    subtitleEn: 'Deep-dive into salt bytes, initialization vectors, and inspect the 128,000 unique 11-digit random representations.',
    narrationAr: 'يوفر النظام أدوات تدقيق متقدمة لفحص المظروف التشفيري واستكشاف مصفوفة الأكواد ومعدل الإنتروبيا.',
    narrationEn: 'Use Envelope Inspector and REP500 Matrix tools to inspect cryptographic parameters and statistical entropy distributions.',
    activeFeature: 'inspector',
  },
];

const TOTAL_DURATION = 55; // 55 seconds complete guided walkthrough

export const VideoTutorial: React.FC<VideoTutorialProps> = ({ lang, onNavigateTab }) => {
  const t = translations[lang];

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speechSynthesisAvailable, setSpeechSynthesisAvailable] = useState<boolean>(true);
  
  // AI Video Gen state (optional Veo 3 trigger)
  const [isVeoGenerating, setIsVeoGenerating] = useState<boolean>(false);
  const [veoVideoUrl, setVeoVideoUrl] = useState<string | null>(null);
  const [veoProgressMsg, setVeoProgressMsg] = useState<string>('');
  const [veoError, setVeoError] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  // Active scene calculation
  const currentSceneIndex = SCENES.findIndex(
    (s) => currentTime >= s.timeSec && currentTime < s.timeSec + s.durationSec
  );
  const activeScene = currentSceneIndex !== -1 ? SCENES[currentSceneIndex] : SCENES[SCENES.length - 1];

  // Speech Voice Narration
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSpeechSynthesisAvailable(false);
      return;
    }

    if (isPlaying && !isMuted && activeScene) {
      window.speechSynthesis.cancel();
      const textToSpeak = lang === 'ar' ? activeScene.narrationAr : activeScene.narrationEn;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      window.speechSynthesis.cancel();
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentSceneIndex, isPlaying, isMuted, lang]);

  // Main playback timer loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= TOTAL_DURATION) {
            setIsPlaying(false);
            return TOTAL_DURATION;
          }
          return Number((prev + 0.2).toFixed(1));
        });
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleTogglePlay = () => {
    if (currentTime >= TOTAL_DURATION) {
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleNextScene = () => {
    if (currentSceneIndex < SCENES.length - 1) {
      setCurrentTime(SCENES[currentSceneIndex + 1].timeSec);
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentTime(SCENES[currentSceneIndex - 1].timeSec);
    } else {
      setCurrentTime(0);
    }
  };

  // Optional: Generate Veo 3 Video if user clicks Download / Render AI video
  const handleGenerateVeo3 = async () => {
    setIsVeoGenerating(true);
    setVeoError(null);
    setVeoProgressMsg(lang === 'ar' ? 'جاري إرسال طلب تصيير الفيديو إلى Veo 3...' : 'Initiating Veo 3 video render...');

    try {
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt:
            'High-definition 3D tutorial walkthrough of Cipher Lab REP500 application interface. Holographic UI screen showing step-by-step secret key entry, text encryption into Base64 cipher envelope, and drag-and-drop confidential PDF file encryption with glowing gold and neon blue aesthetic.',
          aspectRatio: '16:9',
          resolution: '720p',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to start Veo 3 video render');
      }

      const { operationName } = await res.json();

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch('/api/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName }),
          });
          const statusData = await statusRes.json();

          if (statusData.error) {
            clearInterval(pollInterval);
            setIsVeoGenerating(false);
            setVeoError(statusData.error);
            return;
          }

          if (statusData.done) {
            clearInterval(pollInterval);
            setVeoProgressMsg(lang === 'ar' ? 'اكتمل التوليد! جاري تحميل الفيديو...' : 'Generation completed! Fetching video...');

            const downloadRes = await fetch('/api/video-download', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ operationName }),
            });

            const blob = await downloadRes.blob();
            const url = URL.createObjectURL(blob);
            setVeoVideoUrl(url);
            setIsVeoGenerating(false);
          }
        } catch (e: any) {
          console.error(e);
        }
      }, 5000);
    } catch (err: any) {
      setIsVeoGenerating(false);
      setVeoError(err.message || 'Error creating video');
    }
  };

  const progressPercent = Math.min((currentTime / TOTAL_DURATION) * 100, 100);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-[#111728] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 end-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Video className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                {lang === 'ar' ? 'فيديو الشرح التفاعلي: كيف يعمل نظام التشفير؟' : 'Interactive Video Walkthrough: How To Use The App'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {lang === 'ar' ? 'عرض حي وتفاعلي خطوة بخطوة' : 'Live Interactive Explainer'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              {lang === 'ar'
                ? 'شاهد العرض التوضيحي المباشر لكافة وظائف المنظومة: تشفير وفك تشفير النصوص، تشفير الملفات والمستندات، وفحص المظروف التشفيري مع صوت توضيحي.'
                : 'Watch a step-by-step interactive simulated tutorial demonstrating text encryption, file protection, key generation, and cryptographic envelope inspection.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateVeo3}
              disabled={isVeoGenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isVeoGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{lang === 'ar' ? 'تصدير فيديو بـ Veo 3 AI' : 'Export with Veo 3 AI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Presentation Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Center: Interactive Video Stage (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="bg-[#090d16] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col min-h-[460px]">
            
            {/* Top Video HUD Bar */}
            <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between font-mono text-xs text-slate-300 z-20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold text-slate-100">
                  {lang === 'ar' ? 'شرح تفاعلي مباشر' : 'LIVE TUTORIAL DEMO'}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-amber-400 text-[11px]">
                  {lang === 'ar' ? `المشهد ${activeScene.id} من ${SCENES.length}` : `Scene ${activeScene.id} of ${SCENES.length}`}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-[11px]">
                  {Math.floor(currentTime)}s / {TOTAL_DURATION}s
                </span>
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
                  title={isMuted ? (lang === 'ar' ? 'تشغيل الصوت' : 'Unmute') : (lang === 'ar' ? 'كتم الصوت' : 'Mute')}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Video Visual Stage Screen */}
            <div className="flex-1 p-6 flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-b from-[#0e1424] via-[#090d16] to-[#070a12]">
              
              {/* Background Cyber Grid effect */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

              {/* Scene Dynamic Content */}
              <div className="w-full max-w-xl z-10 space-y-5 animate-in fade-in zoom-in-95 duration-300">
                
                {/* Scene Badge & Title */}
                <div className="text-center space-y-1.5">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-block font-mono">
                    {lang === 'ar' ? activeScene.titleAr : activeScene.titleEn}
                  </span>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    {lang === 'ar' ? activeScene.subtitleAr : activeScene.subtitleEn}
                  </p>
                </div>

                {/* Simulated UI Interactive Demo Card */}
                {activeScene.activeFeature === 'intro' && (
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3.5 text-center">
                    <div className="flex justify-center gap-3">
                      <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Lock className="w-8 h-8" />
                      </div>
                      <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Layers className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="space-y-1 font-mono text-xs">
                      <div className="text-amber-400 font-bold">AES-256-GCM + REP500 Matrix</div>
                      <div className="text-slate-400 text-[11px]">PBKDF2-SHA256 (300,000 iter) • 128,000 Decoy Codes • Zero-Knowledge</div>
                    </div>
                  </div>
                )}

                {activeScene.activeFeature === 'key' && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-xl space-y-3 font-mono">
                    <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5 text-amber-400">
                        <Key className="w-4 h-4" />
                        <span className="font-bold">{lang === 'ar' ? 'المفتاح السري المشترك' : 'Secret Key Entry'}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Entropy: 128 bits
                      </span>
                    </div>
                    <div className="bg-black/50 border border-slate-700 rounded-xl p-2.5 text-xs text-amber-300 flex items-center justify-between">
                      <span className="truncate">{activeScene.mockKey}</span>
                      <span className="text-[10px] text-slate-500 font-sans">{lang === 'ar' ? 'مطبق تلقائياً' : 'Auto Applied'}</span>
                    </div>
                  </div>
                )}

                {activeScene.activeFeature === 'text-enc' && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-xl space-y-3 font-mono text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[10px] block">{lang === 'ar' ? 'النص الأصلي المراد تشفيره:' : 'Plaintext to Encrypt:'}</span>
                      <div className="p-2 rounded-lg bg-black/50 border border-slate-700 text-slate-200 text-[11px]">
                        {activeScene.mockInput}
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[10px] animate-pulse">
                        ⚡ {lang === 'ar' ? 'جاري التشفير بـ AES-256 + REP500...' : 'Encrypting with AES-256 + REP500...'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-amber-400 text-[10px] block">{lang === 'ar' ? 'المظروف المشفر النهائي (Base64 Envelope):' : 'Output Base64 Envelope:'}</span>
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] truncate">
                        {activeScene.mockOutput}
                      </div>
                    </div>
                  </div>
                )}

                {activeScene.activeFeature === 'text-dec' && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-xl space-y-3 font-mono text-xs">
                    <div className="space-y-1">
                      <span className="text-cyan-400 text-[10px] block">{lang === 'ar' ? 'المظروف المشفر المستلم:' : 'Received Envelope:'}</span>
                      <div className="p-2 rounded-lg bg-black/50 border border-slate-700 text-slate-400 text-[10px] truncate">
                        {activeScene.mockInput}
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold text-[10px]">
                        🔓 {lang === 'ar' ? 'تم فك التشفير والتحقق من التوقيع بنجاح' : 'Decrypted & Integrity Verified'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-emerald-400 text-[10px] block">{lang === 'ar' ? 'النص الأصلي المسترجع:' : 'Recovered Plaintext:'}</span>
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-sans font-bold">
                        {activeScene.mockOutput}
                      </div>
                    </div>
                  </div>
                )}

                {activeScene.activeFeature === 'file-enc' && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-xl space-y-3 text-center">
                    <div className="p-3 rounded-xl border-2 border-dashed border-slate-700 bg-black/40 flex flex-col items-center justify-center space-y-1.5">
                      <FileUp className="w-6 h-6 text-amber-400 animate-bounce" />
                      <div className="text-xs font-mono font-bold text-slate-200">{activeScene.mockInput}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 font-mono text-xs text-amber-300 flex items-center justify-between">
                      <span className="text-[11px]">🔒 {activeScene.mockOutput}</span>
                      <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-bold">{lang === 'ar' ? 'جاهز للتحميل' : 'Ready'}</span>
                    </div>
                  </div>
                )}

                {activeScene.activeFeature === 'inspector' && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-2 font-mono text-xs">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="p-2 rounded-lg bg-black/50 border border-slate-800 text-slate-300">
                        <span className="text-slate-500 block">Salt (16 bytes):</span>
                        <span className="text-amber-400 truncate block">A9b/xL3kQ298z...</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/50 border border-slate-800 text-slate-300">
                        <span className="text-slate-500 block">IV (12 bytes):</span>
                        <span className="text-cyan-400 truncate block">9Qz18vP012...</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/50 border border-slate-800 text-[10px] text-slate-300">
                      <span className="text-slate-500 block">Matrix Code Distribution:</span>
                      <span className="text-emerald-400">128,000 distinct 11-digit random codes active</span>
                    </div>
                  </div>
                )}

                {/* Subtitle Teleprompter Bar */}
                <div className="p-3 rounded-xl bg-black/80 border border-slate-800/80 backdrop-blur text-center text-xs text-amber-200/90 font-sans shadow-lg">
                  {lang === 'ar' ? activeScene.narrationAr : activeScene.narrationEn}
                </div>

              </div>

            </div>

            {/* Bottom Video Controls & Timeline Bar */}
            <div className="p-4 bg-slate-900/95 border-t border-slate-800 space-y-3 z-20">
              
              {/* Seek Timeline */}
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max={TOTAL_DURATION}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div
                  className="absolute top-0 start-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg pointer-events-none"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevScene}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title={lang === 'ar' ? 'المشهد السابق' : 'Previous Scene'}
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                    title={isPlaying ? (lang === 'ar' ? 'إيقاف مؤقت' : 'Pause') : (lang === 'ar' ? 'تشغيل' : 'Play')}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ms-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleNextScene}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    title={lang === 'ar' ? 'المشهد التالي' : 'Next Scene'}
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleRestart}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title={lang === 'ar' ? 'إعادة الشرح من البداية' : 'Restart'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigateTab && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('text')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'ar' ? 'جرب التشفير الآن' : 'Try Encrypting Now'}</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Veo 3 Render Notification if ready */}
          {veoVideoUrl && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'ar' ? 'تم تجهيز ملف الفيديو عالي الدقة بـ Veo 3!' : 'Veo 3 AI Video is ready to download!'}</span>
              </div>
              <a
                href={veoVideoUrl}
                download="rep500-tutorial-video.mp4"
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تحميل MP4' : 'Download MP4'}</span>
              </a>
            </div>
          )}

          {veoError && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start justify-between gap-3 shadow-lg">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-300 block">
                    {lang === 'ar' ? 'تنبيه حصة التوليد السحابي:' : 'Cloud Render Quota Notice:'}
                  </span>
                  <p className="text-[11px] text-slate-300/90 leading-relaxed">{veoError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVeoError(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded bg-slate-800/60"
              >
                ✕
              </button>
            </div>
          )}

        </div>

        {/* Right Column: Step by Step Scene Index (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-[#111728] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400" />
              <span>{lang === 'ar' ? 'فهرس مشاهد الشرح (Scenes)' : 'Tutorial Scene Index'}</span>
            </h3>

            <div className="space-y-2">
              {SCENES.map((scene, idx) => {
                const isActive = currentSceneIndex === idx;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => handleSeek(scene.timeSec)}
                    className={`w-full text-start p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/50 text-slate-100 shadow-md shadow-amber-500/5'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {scene.id}
                    </span>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-200">
                        {lang === 'ar' ? scene.titleAr : scene.titleEn}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {scene.timeSec}s - {scene.timeSec + scene.durationSec}s
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="bg-[#111728] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 font-mono text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'ar' ? 'ملخص الاستخدام السريع:' : 'Quickstart Summary:'}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              {lang === 'ar'
                ? '1. اختر مفتاحاً سرياً ⬅️ 2. اضغط تشفير النص أو ارفع ملفاً ⬅️ 3. شارك المظروف أو ملف .rep500 ⬅️ 4. فك التشفير بنفس المفتاح.'
                : '1. Choose secret key ⬅️ 2. Encrypt text or upload file ⬅️ 3. Share envelope or .rep500 file ⬅️ 4. Decrypt with matching key.'}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
