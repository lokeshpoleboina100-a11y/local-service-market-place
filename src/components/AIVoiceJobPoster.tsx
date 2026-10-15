import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface VoiceResult {
  status: string;
  detected_language: string;
  language_name: string;
  original_transcript: string;
  job_title: string;
  job_description: string;
  category: string;
  category_name: string;
  service_name: string;
  problem_type: string;
  required_professional: string;
  is_new_category: boolean;
  estimated_price: {
    min: number;
    max: number;
    typical: number;
    labour_estimate: string;
    materials_estimate: string;
    factors: string[];
  };
  estimated_time: string;
  confidence: number;
  is_ambiguous: boolean;
  clarification_prompt?: string;
  error?: string;
}

interface ApplyPayload {
  title: string;
  description: string;
  category: string;
  service: string;
  budget: number;
}

interface Props {
  onApply: (payload: ApplyPayload) => void;
}

const LANGUAGES = [
  { code: 'auto', label: 'Auto Detect 🔍', bcp47: 'en-IN' },
  { code: 'te', label: 'తెలుగు (Telugu)', bcp47: 'te-IN' },
  { code: 'ta', label: 'தமிழ் (Tamil)', bcp47: 'ta-IN' },
  { code: 'hi', label: 'हिन्दी (Hindi)', bcp47: 'hi-IN' },
  { code: 'en', label: 'English', bcp47: 'en-IN' },
];

type RecordState = 'idle' | 'recording' | 'loading' | 'result' | 'error';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

function getSpeechRecognition() {
  return (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start gap-2 px-4 py-2.5">
      <span className="text-xs text-muted-foreground w-32 flex-shrink-0 pt-0.5">{label}</span>
      <span className={`text-xs flex-1 ${bold ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>{value}</span>
    </div>
  );
}

export default function AIVoiceJobPoster({ onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [selectedLang, setSelectedLang] = useState('auto');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [showFactors, setShowFactors] = useState(false);

  const recRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalTextRef = useRef('');

  const supported = !!getSpeechRecognition();

  const startTimer = useCallback(() => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => { stopTimer(); recRef.current?.abort(); }, [stopTimer]);

  const analyzeTranscript = useCallback(async (text: string) => {
    setRecordState('loading');
    setInterimTranscript('');
    try {
      const res = await fetch('/api/voice-job-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, language: selectedLang }),
      });
      const data: VoiceResult = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error ?? 'Backend analysis failed. Please try again.');
        setRecordState('error');
      } else {
        setResult(data);
        setRecordState('result');
      }
    } catch {
      setErrorMsg('Network error: Could not reach backend. Is the server running?');
      setRecordState('error');
    }
  }, [selectedLang]);

  const startRecording = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setErrorMsg('Your browser does not support voice input. Please use Chrome or Edge.');
      setRecordState('error');
      return;
    }

    const langEntry = LANGUAGES.find((l) => l.code === selectedLang) ?? LANGUAGES[0];
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = selectedLang === 'auto' ? 'en-IN' : langEntry.bcp47;

    finalTextRef.current = '';

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTextRef.current += e.results[i][0].transcript + ' ';
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      setTranscript(finalTextRef.current.trim());
      setInterimTranscript(interim);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      stopTimer();
      if (e.error === 'not-allowed') {
        setErrorMsg('Microphone permission denied. Please allow mic access and try again.');
      } else if (e.error === 'no-speech') {
        setErrorMsg('No speech detected. Please speak clearly and try again.');
      } else {
        setErrorMsg(`Voice recognition error: ${e.error}`);
      }
      setRecordState('error');
    };

    rec.onend = () => {
      stopTimer();
      const finalText = finalTextRef.current.trim();
      if (finalText) {
        analyzeTranscript(finalText);
      } else {
        setErrorMsg('No speech detected. Please try again.');
        setRecordState('error');
      }
    };

    recRef.current = rec;
    setTranscript('');
    setInterimTranscript('');
    setResult(null);
    setErrorMsg('');
    setRecordState('recording');
    startTimer();
    rec.start();
  }, [selectedLang, startTimer, stopTimer, analyzeTranscript]);

  const stopRecording = useCallback(() => {
    stopTimer();
    recRef.current?.stop();
  }, [stopTimer]);

  const listenAgain = useCallback(() => {
    if (!result || !window.speechSynthesis) return;
    const lang = LANGUAGES.find((l) => l.code === result.detected_language);
    const utt = new SpeechSynthesisUtterance(
      `${result.job_title}. ${result.problem_type}. Estimated cost: ${result.estimated_price.typical} rupees.`
    );
    utt.lang = lang?.bcp47 ?? 'en-IN';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }, [result]);

  const applyToForm = useCallback(() => {
    if (!result) return;
    onApply({
      title: result.job_title,
      description: result.job_description,
      category: result.category,
      service: result.service_name,
      budget: result.estimated_price.typical,
    });
    setOpen(false);
    reset();
  }, [result, onApply]);

  const reset = useCallback(() => {
    setRecordState('idle');
    setTranscript('');
    setInterimTranscript('');
    setResult(null);
    setErrorMsg('');
    setElapsed(0);
    setShowFactors(false);
    finalTextRef.current = '';
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <>
      {/* Trigger Banner */}
      <button
        type="button"
        onClick={() => { setOpen(true); reset(); }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:from-indigo-700 hover:to-violet-700 transition-all duration-200 group"
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <Mic className="w-5 h-5" />
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-sm leading-tight">Speak to Post Job</p>
          <p className="text-xs text-indigo-100 leading-tight mt-0.5">తెలుగు · தமிழ் · हिन्दी · English</p>
        </div>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">AI ✦</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) { stopRecording(); setOpen(false); } }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="w-full max-w-lg bg-background rounded-t-3xl shadow-2xl max-h-[92dvh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm px-5 pt-5 pb-3 border-b border-border/50 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-base">🎙️ Voice Job Posting</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Speak in any language — AI understands</p>
                  </div>
                  <button type="button" onClick={() => { stopRecording(); setOpen(false); }} className="p-2 rounded-xl hover:bg-accent transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3">
                  <Select
                    value={selectedLang}
                    onValueChange={setSelectedLang}
                    disabled={recordState === 'recording' || recordState === 'loading'}
                  >
                    <SelectTrigger className="h-9 rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.code} value={l.code} className="text-xs">{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5">

                {/* IDLE */}
                {recordState === 'idle' && (
                  <div className="flex flex-col items-center gap-4 py-4">
                    {!supported && (
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/40 rounded-xl px-4 py-3 text-xs w-full">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        Voice input requires Chrome, Edge, or Safari. You can type below instead.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={!supported}
                      className="w-24 h-24 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
                    >
                      <Mic className="w-10 h-10" />
                    </button>
                    <p className="text-sm text-muted-foreground text-center">
                      Tap the mic and describe your problem.<br />
                      <span className="text-xs text-indigo-500">"నా మొబైల్ ఛార్జింగ్ అవ్వడం లేదు"</span>
                    </p>
                    <div className="w-full space-y-2">
                      <p className="text-xs text-muted-foreground font-medium text-center">— or type your problem —</p>
                      <textarea
                        className="w-full border border-input rounded-xl px-3 py-2 text-sm min-h-[70px] resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
                        placeholder="Type your problem in any language..."
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={() => transcript.trim() && analyzeTranscript(transcript.trim())}
                        disabled={!transcript.trim()}
                        size="sm"
                        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Analyze Text
                      </Button>
                    </div>
                  </div>
                )}

                {/* RECORDING */}
                {recordState === 'recording' && (
                  <div className="flex flex-col items-center gap-5 py-4">
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl transition-all duration-200 animate-pulse ring-4 ring-red-400/60"
                    >
                      <MicOff className="w-10 h-10" />
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-mono text-red-600 font-bold">{formatTime(elapsed)}</span>
                      <span className="text-xs text-muted-foreground">Recording... tap to stop</span>
                    </div>
                    {(transcript || interimTranscript) && (
                      <div className="w-full bg-muted/40 rounded-xl p-3 text-sm min-h-[60px]">
                        <span className="text-foreground">{transcript}</span>
                        <span className="text-muted-foreground italic">{interimTranscript}</span>
                      </div>
                    )}
                    <div className="flex items-end gap-0.5 h-8">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-indigo-500 rounded-full"
                          style={{ height: '8px' }}
                          animate={{ height: ['8px', `${12 + (i % 5) * 4}px`, '8px'] }}
                          transition={{ repeat: Infinity, duration: 0.5 + (i % 4) * 0.1, ease: 'easeInOut', delay: i * 0.02 }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* LOADING */}
                {recordState === 'loading' && (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <p className="text-sm text-muted-foreground text-center">Analysing your voice input…</p>
                    {transcript && (
                      <div className="w-full bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground italic">
                        "{transcript}"
                      </div>
                    )}
                  </div>
                )}

                {/* ERROR */}
                {recordState === 'error' && (
                  <div className="space-y-4 py-2">
                    <div className="flex gap-2 bg-red-50 dark:bg-red-950/40 text-red-700 rounded-xl p-4 text-sm">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p>{errorMsg}</p>
                    </div>
                    <Button type="button" onClick={reset} className="w-full rounded-xl" variant="outline">
                      Try Again
                    </Button>
                  </div>
                )}

                {/* RESULT */}
                {recordState === 'result' && result && (
                  <div className="space-y-4">
                    <div className="bg-muted/40 rounded-xl p-3 space-y-1">
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">You said ({result.language_name})</p>
                      <p className="text-sm italic">"{result.original_transcript}"</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{result.language_name}</Badge>
                      <Badge variant="outline" className="text-xs">{result.confidence.toFixed(0)}% confidence</Badge>
                      {result.is_new_category && <Badge className="text-xs bg-amber-500 hover:bg-amber-600">New Category</Badge>}
                    </div>
                    {result.is_ambiguous && result.clarification_prompt && (
                      <div className="flex gap-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 rounded-xl p-3 text-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>{result.clarification_prompt}</p>
                      </div>
                    )}
                    <div className="border border-border rounded-2xl divide-y divide-border/60 overflow-hidden">
                      <Row label="📋 Job Title" value={result.job_title} bold />
                      <Row label="🔧 Problem Type" value={result.problem_type} />
                      <Row label="📂 Category" value={result.category_name} />
                      <Row label="🛠 Service" value={result.service_name} />
                      <Row label="👷 Professional" value={result.required_professional} />
                      <Row label="⏱ Duration" value={result.estimated_time} />
                      <Row
                        label="💰 Est. Cost (₹)"
                        value={`₹${result.estimated_price.min.toLocaleString('en-IN')} – ₹${result.estimated_price.max.toLocaleString('en-IN')} (typical ₹${result.estimated_price.typical.toLocaleString('en-IN')})`}
                        bold
                      />
                      <Row label="👷 Labour" value={result.estimated_price.labour_estimate} />
                      <Row label="🔩 Materials" value={result.estimated_price.materials_estimate} />
                    </div>
                    {result.estimated_price.factors?.length > 0 && (
                      <div className="border border-border rounded-xl overflow-hidden">
                        <button
                          type="button"
                          className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium hover:bg-muted/40 transition-colors"
                          onClick={() => setShowFactors((v) => !v)}
                        >
                          <span>💡 Pricing Factors ({result.estimated_price.factors.length})</span>
                          {showFactors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {showFactors && (
                          <ul className="px-4 pb-3 space-y-1">
                            {result.estimated_price.factors.map((f, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-indigo-500 mt-0.5">•</span>{f}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <details className="border border-border rounded-xl overflow-hidden text-xs">
                      <summary className="px-4 py-2 cursor-pointer font-medium hover:bg-muted/40">📝 Generated Job Description</summary>
                      <p className="px-4 pb-3 text-muted-foreground whitespace-pre-line">{result.job_description}</p>
                    </details>
                    <div className="flex gap-3">
                      <Button type="button" variant="outline" size="sm" className="flex-1 rounded-xl gap-2" onClick={listenAgain}>
                        <Volume2 className="w-4 h-4" /> Listen
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="flex-1 rounded-xl" onClick={reset}>
                        <Mic className="w-4 h-4 mr-1" /> Re-record
                      </Button>
                    </div>
                    <Button
                      type="button"
                      onClick={applyToForm}
                      className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Apply to Job Form
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
