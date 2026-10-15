import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Camera,
  ArrowRight,
  Loader2,
  Sparkles,
  X,
  CheckCircle2,
  Wrench,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CATEGORY_GROUPS, getGroup, type DbJobCategory } from '@/lib/serviceCatalog';

interface AISuggestion {
  category: DbJobCategory;
  service: string;
  title: string;
  description: string;
  confidence?: number;
  source: 'ai_cloud' | 'ai_local';
}

export default function CompactAIJobCreator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [problemText, setProblemText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLang, setRecordingLang] = useState<'en-IN' | 'te-IN' | 'ta-IN' | 'hi-IN'>('en-IN');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const recognitionRef = useRef<any>(null);

  // Fallback intelligent local detector when AI server is unreachable or offline
  const detectLocalService = (text: string, fileName?: string): AISuggestion => {
    const combined = `${text} ${fileName || ''}`.toLowerCase();

    if (combined.includes('screen') || combined.includes('phone') || combined.includes('mobile') || combined.includes('display')) {
      return {
        category: 'technology',
        service: 'Mobile Repair',
        title: 'Smartphone Screen Repair',
        description: 'The smartphone screen is damaged and needs inspection and repair.',
        source: 'ai_local',
      };
    }
    if (combined.includes('laptop') || combined.includes('macbook') || combined.includes('computer') || combined.includes('pc')) {
      return {
        category: 'technology',
        service: 'Laptop Repair',
        title: 'Laptop Hardware & Component Repair',
        description: 'Laptop requires diagnostic inspection and component repair.',
        source: 'ai_local',
      };
    }
    if (combined.includes('ac') || combined.includes('air conditioner') || combined.includes('cooling') || combined.includes('leakage')) {
      return {
        category: 'home_services',
        service: 'AC Repair',
        title: 'Air Conditioner Inspection & Servicing',
        description: 'The wall-mounted AC unit needs inspection, gas refilling, and leak repair.',
        source: 'ai_local',
      };
    }
    if (combined.includes('fridge') || combined.includes('refrigerator') || combined.includes('freezer') || combined.includes('compressor')) {
      return {
        category: 'home_services',
        service: 'Appliance Repair',
        title: 'Refrigerator Cooling & Compressor Repair',
        description: 'Refrigerator is not cooling properly and requires technician inspection.',
        source: 'ai_local',
      };
    }
    if (combined.includes('pipe') || combined.includes('tap') || combined.includes('faucet') || combined.includes('plumb') || combined.includes('drain')) {
      return {
        category: 'home_services',
        service: 'Plumber',
        title: 'Emergency Plumbing & Pipe Leak Fix',
        description: 'Leaking pipe or plumbing fixture requires repair and replacement.',
        source: 'ai_local',
      };
    }
    if (combined.includes('wire') || combined.includes('switch') || combined.includes('electric') || combined.includes('short') || combined.includes('mcb')) {
      return {
        category: 'home_services',
        service: 'Electrician',
        title: 'Electrical Switchboard & Wiring Repair',
        description: 'Electrical wiring and switchboard need certified technician inspection.',
        source: 'ai_local',
      };
    }
    if (combined.includes('wood') || combined.includes('door') || combined.includes('furniture') || combined.includes('carpent') || combined.includes('table')) {
      return {
        category: 'home_services',
        service: 'Carpenter',
        title: 'Carpentry & Furniture Repair',
        description: 'Wooden fixture and furniture require repair and restoration.',
        source: 'ai_local',
      };
    }
    if (combined.includes('car') || combined.includes('tyre') || combined.includes('bike') || combined.includes('puncture') || combined.includes('vehicle')) {
      return {
        category: 'automotive',
        service: 'Car Repair',
        title: 'Vehicle Diagnostic & Repair Service',
        description: 'Vehicle requires mechanical inspection and repair.',
        source: 'ai_local',
      };
    }
    if (combined.includes('brick') || combined.includes('cement') || combined.includes('mason') || combined.includes('tile') || combined.includes('marble') || combined.includes('plaster') || combined.includes('construct') || combined.includes('renovat')) {
      return {
        category: 'construction_building',
        service: 'Masonry & Brickwork',
        title: 'Construction & Masonry Service Required',
        description: 'Construction, brickwork, or plastering service needed at site.',
        source: 'ai_local',
      };
    }
    if (combined.includes('labour') || combined.includes('labor') || combined.includes('helper') || combined.includes('loading') || combined.includes('unloading') || combined.includes('coolie') || combined.includes('mazdoor') || combined.includes('shifting')) {
      return {
        category: 'daily_wage_labour',
        service: 'General Construction Labour',
        title: 'Daily Wage Helper / Labour Required',
        description: 'Manual helper required for site work, loading/unloading, or shifting.',
        source: 'ai_local',
      };
    }
    if (combined.includes('tractor') || combined.includes('farm') || combined.includes('crop') || combined.includes('harvest') || combined.includes('paddy') || combined.includes('wheat') || combined.includes('agri') || combined.includes('cattle') || combined.includes('dairy')) {
      return {
        category: 'agriculture_farming',
        service: 'Agriculture & Farm Support',
        title: 'Agricultural / Farming Service Required',
        description: 'Farmland assistance, tractor operation, or crop maintenance required.',
        source: 'ai_local',
      };
    }
    if (combined.includes('village') || combined.includes('borewell') || combined.includes('chakki') || combined.includes('flour mill') || combined.includes('biogas') || combined.includes('thresher') || combined.includes('rickshaw')) {
      return {
        category: 'rural_village_services',
        service: 'Borewell Motor & Pump Repair',
        title: 'Rural / Village Equipment Repair',
        description: 'Rural service needed for borewell pump, mill, or agricultural machinery.',
        source: 'ai_local',
      };
    }
    if (combined.includes('weld') || combined.includes('fabricat') || combined.includes('grill') || combined.includes('iron gate') || combined.includes('shutter') || combined.includes('railing') || combined.includes('metal work')) {
      return {
        category: 'welding_fabrication',
        service: 'Arc & TIG Welding',
        title: 'Welding & Metal Fabrication Work',
        description: 'Metal fabrication, welding, gate, or rolling shutter repair required.',
        source: 'ai_local',
      };
    }
    if (combined.includes('truck') || combined.includes('tata ace') || combined.includes('tempo') || combined.includes('transport') || combined.includes('goods') || combined.includes('parcel') || combined.includes('cargo')) {
      return {
        category: 'transport_delivery',
        service: 'Mini-Truck / Tata Ace Goods Transport',
        title: 'Goods Transport & Tempo Delivery',
        description: 'Transportation required for goods, materials, or furniture shifting.',
        source: 'ai_local',
      };
    }

    return {
      category: 'home_services',
      service: 'General Repair',
      title: text.trim() ? text.trim().slice(0, 50) : 'General Repair Service',
      description: text.trim() || 'Service request with photo attached for technician review.',
      source: 'ai_local',
    };
  };

  const runAnalysis = async (photoDataUrl?: string, text?: string, fileName?: string) => {
    setAnalyzing(true);
    const queryText = (text || problemText).trim();
    const queryPhoto = photoDataUrl || selectedPhoto;

    try {
      // 1. Try FastAPI backend AI multimodal analyzer
      const res = await fetch('/api/analyze-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: queryPhoto,
          title: queryText,
          description: queryText,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const detectedCat = (json.category as DbJobCategory) || 'home_services';
        const detectedSvc = json.service_name || json.service || 'Repair Service';
        const detectedTitle = json.title || (queryText ? `${detectedSvc} Required` : `${detectedSvc} Repair`);
        const detectedDesc = json.description || (queryText ? queryText : `Inspection and repair service needed for ${detectedSvc}.`);

        setAiSuggestion({
          category: detectedCat,
          service: detectedSvc,
          title: detectedTitle,
          description: detectedDesc,
          source: 'ai_cloud',
        });
        setAnalyzing(false);
        return;
      }
    } catch {
      // Backend offline or error — fallback to local heuristics gracefully
    }

    // 2. Local heuristic classifier (graceful fallback)
    const local = detectLocalService(queryText, fileName);
    setAiSuggestion(local);
    setAnalyzing(false);
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: 'Voice not supported',
        description: 'Please use Chrome, Edge, or Safari to use microphone input.',
        variant: 'destructive',
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = recordingLang;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setProblemText(transcript);
        runAnalysis(selectedPhoto || undefined, transcript);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please choose an image file.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        setSelectedPhoto(dataUrl);
        runAnalysis(dataUrl, problemText, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateJob = () => {
    // Save photo and suggestion data into sessionStorage for PostJob to consume
    if (selectedPhoto) {
      sessionStorage.setItem('nearwork_pending_job_photo', selectedPhoto);
    }
    const finalTitle = aiSuggestion?.title || problemText.trim() || 'Service Request';
    const finalDesc = aiSuggestion?.description || problemText.trim() || '';
    const finalCategory = aiSuggestion?.category || 'home_services';
    const finalService = aiSuggestion?.service || '';

    sessionStorage.setItem('nearwork_pending_job_title', finalTitle);
    sessionStorage.setItem('nearwork_pending_job_desc', finalDesc);

    const queryParams = new URLSearchParams();
    if (finalCategory) queryParams.set('category', finalCategory);
    if (finalService) queryParams.set('service', finalService);

    navigate(`/customer/post-job?${queryParams.toString()}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* Main input bar with Voice and Camera icons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={problemText}
            onChange={(e) => {
              setProblemText(e.target.value);
              if (e.target.value.length > 4) {
                runAnalysis(selectedPhoto || undefined, e.target.value);
              }
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateJob()}
            placeholder="What needs to be repaired? (e.g. Fridge not cooling, Broken mobile screen, AC leaking)"
            className="w-full h-11 pl-3.5 pr-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Multilingual Voice Button */}
            <button
              type="button"
              onClick={startVoiceInput}
              title={`Voice in ${recordingLang === 'te-IN' ? 'Telugu' : recordingLang === 'ta-IN' ? 'Tamil' : recordingLang === 'hi-IN' ? 'Hindi' : 'English'}`}
              className={`p-2 rounded-lg transition-colors ${
                isRecording
                  ? 'bg-red-50 text-red-600 animate-pulse'
                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800'
              }`}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Photo Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload problem photo (broken screen, pipe, AC unit)"
              className={`p-2 rounded-lg transition-colors ${
                selectedPhoto
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/60'
                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800'
              }`}
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Button
          onClick={handleCreateJob}
          disabled={analyzing}
          className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shrink-0 shadow-xs active:scale-[0.99] transition-all"
        >
          {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Create Job <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Selected Photo Thumbnail Pill */}
      {selectedPhoto && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-10 w-10 rounded-lg overflow-hidden border border-blue-200 dark:border-blue-800 shrink-0 bg-white">
              <img src={selectedPhoto} alt="Problem preview" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 truncate">
                <ImageIcon className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                Problem photo attached
              </p>
              <p className="text-[10px] text-slate-500">
                {analyzing ? 'AI analyzing damage patterns...' : 'Analyzed & ready for job creation'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedPhoto(null);
              setAiSuggestion(null);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors"
            title="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Editable AI Suggestion Card */}
      {aiSuggestion && (
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                AI Suggested Job Details (Editable)
              </span>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[10px] border-emerald-200">
              {aiSuggestion.service}
            </Badge>
          </div>

          <div className="space-y-1.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Title</label>
              <Input
                value={aiSuggestion.title}
                onChange={(e) => setAiSuggestion({ ...aiSuggestion, title: e.target.value })}
                className="h-8 text-xs rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Description</label>
              <Textarea
                value={aiSuggestion.description}
                onChange={(e) => setAiSuggestion({ ...aiSuggestion, description: e.target.value })}
                rows={2}
                className="text-xs rounded-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 min-h-[50px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500">
              {aiSuggestion.source === 'ai_cloud' ? 'Verified by AI model' : 'Intelligent heuristic match'}
            </span>
            <Button
              size="sm"
              onClick={handleCreateJob}
              className="h-7 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            >
              Use & Post Job <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Language switcher & Footer hints */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Voice Language:</span>
          {(
            [
              { code: 'en-IN', label: 'English' },
              { code: 'te-IN', label: 'తెలుగు' },
              { code: 'ta-IN', label: 'தமிழ்' },
              { code: 'hi-IN', label: 'हिन्दी' },
            ] as const
          ).map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setRecordingLang(lang.code)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                recordingLang === lang.code
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate('/customer/post-job')}
          className="text-blue-600 hover:underline font-semibold"
        >
          Open full form →
        </button>
      </div>
    </div>
  );
}
