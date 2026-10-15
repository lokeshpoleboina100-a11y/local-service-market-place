import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BrainCircuit,
  Camera,
  CheckCircle2,
  ImagePlus,
  Images,
  Loader2,
  RefreshCw,
  ScanSearch,
  Sparkles,
  Trash2,
  Wand2,
  Layers,
  Eye,
  Cpu,
  Download,
  FileText,
  Sliders,
  ExternalLink,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  analyzeProblemPhoto,
  buildDescriptionLine,
  fileToAnalysisDataUrl,
  generateReferenceViews,
  type ReferenceView,
  type VisionAnalysis,
} from '@/services/aiProblemDetection';

interface Props {
  /** Extra context sent to the vision model (usually the job title/description). */
  hint?: string;
  /** Called when the customer accepts the AI result. */
  onUseResult: (line: string, analysis: VisionAnalysis) => void;
  /** Notifies parent when photo is uploaded or cleared. */
  onPhotoChange?: (photo: string | null) => void;
}

const FEATURES = [
  { icon: ScanSearch, label: 'CNN Vision Analysis' },
  { icon: Sparkles, label: 'Damage Area BBox' },
  { icon: Cpu, label: 'Grad-CAM Heatmap' },
  { icon: Images, label: 'AI Damage Visualizer' },
];

export default function AIProblemDetection({ hint, onUseResult, onPhotoChange }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<VisionAnalysis | null>(null);
  const [generating, setGenerating] = useState(false);
  const [views, setViews] = useState<ReferenceView[]>([]);
  const [applied, setApplied] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'visualization' | 'heatmap'>('original');
  const [showBbox, setShowBbox] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const reset = () => {
    setResult(null);
    setViews([]);
    setApplied(false);
    setActiveTab('original');
    onPhotoChange?.(null);
  };

  const pick = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      ref.current.value = '';
      ref.current.click();
    }
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please choose a photo', variant: 'destructive' });
      return;
    }
    try {
      const dataUrl = await fileToAnalysisDataUrl(file);
      reset();
      setPhoto(dataUrl);
      onPhotoChange?.(dataUrl);
    } catch (e) {
      toast({ title: 'Could not read that photo', description: (e as Error).message, variant: 'destructive' });
    }
  };

  const runAnalysis = async () => {
    if (!photo) return;
    setAnalyzing(true);
    setViews([]);
    setApplied(false);
    try {
      const analysis = await analyzeProblemPhoto({ image: photo, hint });
      setResult(analysis);
      if (analysis.visualizationImage) {
        setActiveTab('visualization');
      }
      toast({
        title: '✅ Damage Detected',
        description: `${analysis.productCategory || 'Product'}: ${analysis.damageType || analysis.problem}`,
      });
    } catch (e) {
      toast({ title: 'AI analysis failed', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setAnalyzing(false);
    }
  };

  const runReferenceViews = async () => {
    if (!photo) return;
    setGenerating(true);
    try {
      const { images } = await generateReferenceViews({
        image: photo,
        problem: result?.problem ?? 'possible fault',
        category: result?.category ?? 'Other',
        views: 3,
      });
      setViews(images);
      toast({ title: 'Reference Views Generated' });
    } catch (e) {
      toast({ title: 'Could not generate reference views', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async (sev: 'Low' | 'Medium' | 'High') => {
    if (!photo || !result) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/generate-damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photo,
          damage_type: result.damageType || result.problem,
          severity: sev,
          bbox: result.region,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult({
          ...result,
          visualizationImage: data.generated_image,
          severity: sev,
        });
        setActiveTab('visualization');
        toast({ title: `Regenerated (${sev} severity)` });
      }
    } catch (e) {
      toast({ title: 'Regeneration failed', variant: 'destructive' });
    } finally {
      setRegenerating(false);
    }
  };

  const useResult = () => {
    if (!result) return;
    onUseResult(buildDescriptionLine(result), result);
    setApplied(true);
    toast({ title: 'Added to your job description' });
  };

  const downloadImage = (dataUrl?: string, filename = 'Damage_Visualization.jpg') => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadReport = () => {
    if (!result) return;
    const text = `AI DAMAGE INSPECTION SUMMARY
Model: ${result.model}
Product Category: ${result.productCategory || 'N/A'}
Damage Condition: ${result.damageType || result.problem}
Severity: ${result.severity || 'Medium'}
Confidence: ${result.confidence}%
Affected Area: ${result.damageLocation || 'N/A'}
Recommended Action: ${result.recommendedAction || result.explanation}
Timestamp: ${new Date().toLocaleString()}`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Damage_Report_${(result.productCategory || 'Product').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Inspection summary downloaded' });
  };

  return (
    <section className="space-y-3 rounded-2xl border border-indigo-500/20 bg-gradient-to-b from-indigo-500/[0.04] via-card to-card p-4 shadow-sm">
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label className="font-bold flex items-center gap-2 text-base">
            <BrainCircuit className="h-5 w-5 text-indigo-600" />
            AI Product Damage Detection & Visualization
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload any product or appliance. CNN analyzes visible damage, fracture severity & generates realistic simulations.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-600 bg-indigo-500/10 font-bold text-xs">
            <Cpu className="h-3 w-3 mr-1" /> CNN Model
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/damage-inspection')}
            className="h-7 px-2 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg gap-1"
          >
            Studio <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {FEATURES.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/60 bg-indigo-50/50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-900"
          >
            <Icon className="h-3 w-3 text-indigo-600" />
            {label}
          </span>
        ))}
      </div>

      {/* Upload Zone */}
      {!photo ? (
        <div className="rounded-2xl border border-dashed border-indigo-400/40 bg-gradient-to-br from-indigo-50/50 via-background to-background p-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 shadow-sm">
            <ScanSearch className="h-7 w-7" />
          </div>
          <p className="font-bold text-sm text-foreground">Upload Product Photograph</p>
          <p className="text-xs text-muted-foreground mt-1">Take a Photo or Select from Gallery</p>
          <p className="text-xs text-muted-foreground/80 mt-1.5 max-w-xs mx-auto">
            Supports phones, laptops, electronics, furniture, appliances, and parcels.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
            <Button type="button" className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" onClick={() => pick(cameraRef)}>
              <Camera className="h-4 w-4" /> Take a Photo
            </Button>
            <Button type="button" variant="outline" className="rounded-xl gap-2 border-indigo-200 hover:bg-indigo-50 text-indigo-950 font-semibold" onClick={() => pick(galleryRef)}>
              <ImagePlus className="h-4 w-4" /> Upload from Gallery
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card p-3 space-y-3">
          {/* Visualizer Mode Switcher (when result is ready) */}
          {result && (
            <div className="flex items-center justify-between gap-2 border-b pb-2">
              <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('original')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    activeTab === 'original' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Original & BBox
                </button>
                {result.visualizationImage && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('visualization')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === 'visualization' ? 'bg-indigo-600 text-white shadow' : 'text-muted-foreground'
                    }`}
                  >
                    AI Damage View
                  </button>
                )}
                {result.heatmapImage && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('heatmap')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === 'heatmap' ? 'bg-indigo-600 text-white shadow' : 'text-muted-foreground'
                    }`}
                  >
                    Grad-CAM Heatmap
                  </button>
                )}
              </div>

              {activeTab === 'original' && (
                <button
                  type="button"
                  onClick={() => setShowBbox((b) => !b)}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  {showBbox ? 'Hide BBox' : 'Show BBox'}
                </button>
              )}
            </div>
          )}

          {/* Active Image Display */}
          <div className="relative overflow-hidden rounded-xl bg-black max-h-80 flex items-center justify-center">
            <img
              src={
                activeTab === 'visualization' && result?.visualizationImage
                  ? result.visualizationImage
                  : activeTab === 'heatmap' && result?.heatmapImage
                  ? result.heatmapImage
                  : photo
              }
              alt="Problem Inspection View"
              className="max-h-80 w-auto object-contain"
            />

            {/* Bounding box on original photo */}
            {activeTab === 'original' && result && showBbox && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pointer-events-none absolute rounded-lg border-2 border-rose-500 bg-rose-500/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
                style={{
                  left: `${result.region.x * 100}%`,
                  top: `${result.region.y * 100}%`,
                  width: `${result.region.width * 100}%`,
                  height: `${result.region.height * 100}%`,
                }}
              >
                <span className="absolute -top-6 left-0 rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                  {result.damageType?.split('/')[0] || 'Detected Damage'}
                </span>
              </motion.div>
            )}

            {analyzing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-background/80 backdrop-blur-sm">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
                <p className="text-sm font-bold text-foreground">CNN Image Analysis in Progress…</p>
                <p className="text-xs text-muted-foreground">Extracting fracture tensors & localized regions</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!result ? (
              <Button
                type="button"
                className="rounded-xl gap-2 flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11"
                onClick={runAnalysis}
                disabled={analyzing}
              >
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                {analyzing ? 'Analyzing with CNN…' : 'Analyze Product Damage'}
              </Button>
            ) : (
              <div className="flex flex-wrap items-center justify-between w-full gap-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Regenerate Severity:</span>
                  {(['Low', 'Medium', 'High'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      disabled={regenerating}
                      onClick={() => handleRegenerate(sev)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                        result.severity === sev ? 'bg-indigo-600 text-white' : 'bg-muted hover:bg-muted/80 text-foreground'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    onClick={() =>
                      downloadImage(
                        activeTab === 'heatmap'
                          ? result.heatmapImage
                          : activeTab === 'visualization'
                          ? result.visualizationImage
                          : photo,
                        `Damage_View_${result.productCategory || 'Product'}.jpg`
                      )
                    }
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> Save View
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    onClick={downloadReport}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" /> Report
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 w-full pt-1">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl gap-2 flex-1 text-xs"
                onClick={() => pick(galleryRef)}
                disabled={analyzing}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retake Photo
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl gap-2 text-xs text-destructive hover:text-destructive"
                onClick={() => {
                  setPhoto(null);
                  reset();
                }}
                disabled={analyzing}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detection Results Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.08] via-card to-background p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground">
                  {result.productCategory || 'Product'} &bull; Detected Condition
                </p>
                <p className="font-extrabold text-base text-foreground">
                  {result.damageType || result.problem}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Badge
                  className={`text-xs px-2 py-0.5 font-bold ${
                    result.severity === 'High'
                      ? 'bg-rose-500/20 text-rose-600 border-rose-500/30'
                      : result.severity === 'Medium'
                      ? 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                  }`}
                >
                  {result.severity || 'Medium'} Severity
                </Badge>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Confidence Score</span>
                <span className="font-bold text-indigo-600">{result.confidence}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full rounded-full bg-indigo-600"
                />
              </div>
            </div>

            {/* Explanation & Recommendation */}
            <div className="bg-background/80 rounded-xl p-3 border border-border/60 text-xs space-y-1.5">
              {result.damageLocation && (
                <p className="font-medium text-foreground">
                  <span className="text-muted-foreground">Affected Area: </span>
                  {result.damageLocation}
                </p>
              )}
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Action: </span>
                {result.recommendedAction || result.explanation}
              </p>
            </div>

            {/* Apply button */}
            <Button
              type="button"
              className="w-full rounded-xl gap-2 font-bold bg-indigo-600 hover:bg-indigo-700 text-white h-11"
              onClick={useResult}
              variant={applied ? 'outline' : 'default'}
            >
              <CheckCircle2 className="h-4 w-4" />
              {applied ? '✓ Added to Job Description' : 'Use AI Findings in Job Post'}
            </Button>

            <p className="text-[11px] text-muted-foreground/90 text-center">
              Automated CNN estimate. Certified workers will inspect physical hardware before servicing.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reference views section */}
      {photo && (
        <div className="rounded-2xl border border-border/70 bg-muted/25 p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground">Need additional perspective angles?</p>
              <p className="text-[11px] text-muted-foreground">Generate AI reference views of internal or hidden fault areas.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl gap-2 text-xs font-semibold h-9"
            onClick={runReferenceViews}
            disabled={generating}
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {generating ? 'Generating perspectives…' : 'Generate Reference Angle Views'}
          </Button>

          {views.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {views.map((view) => (
                <figure key={view.label} className="space-y-1">
                  <div className="relative overflow-hidden rounded-xl border border-border/70 bg-black aspect-square">
                    <img src={view.image} alt={view.label} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 right-1 rounded bg-black/75 px-1 py-0.5 text-[8px] font-bold text-white text-center">
                      AI Reference
                    </span>
                  </div>
                  <figcaption className="text-[10px] text-muted-foreground truncate">{view.label}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
