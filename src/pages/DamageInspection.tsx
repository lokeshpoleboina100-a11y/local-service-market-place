import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Download,
  RotateCw,
  Clock,
  Layers,
  Eye,
  FileText,
  Sliders,
  ChevronRight,
  Shield,
  Trash2,
  Cpu,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/AppHeader';

interface InspectionResult {
  id: string;
  timestamp: string;
  product_category: string;
  category_confidence?: number;
  damage_type: string;
  severity: 'Low' | 'Medium' | 'High';
  confidence: number;
  damage_location: string;
  recommended_action: string;
  bbox: { x: number; y: number; width: number; height: number };
  damage_ratio?: number;
  original_image: string;
  visualization_image: string;
  heatmap_image: string;
  verified_by_model: string;
  details?: {
    resolution?: string;
    model_architecture?: string;
    inference_device?: string;
  };
}

const SAMPLE_IMAGES = [
  {
    name: 'Broken Phone Screen',
    category: 'Mobile Phone',
    desc: 'Impact shatter & crack branches',
    url: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Cracked Laptop Display',
    category: 'Laptop',
    desc: 'Hinge fracture & panel damage',
    url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Damaged Parcel Box',
    category: 'Parcel / Packaging',
    desc: 'Corner crush & shipping tears',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
  },
];

export default function DamageInspection() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [result, setResult] = useState<InspectionResult | null>(null);
  const [activeView, setActiveView] = useState<'comparison' | 'visualization' | 'heatmap' | 'original'>('comparison');
  const [history, setHistory] = useState<InspectionResult[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'Low' | 'Medium' | 'High'>('High');
  const [showBbox, setShowBbox] = useState(true);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.warn('Could not load inspection history:', e);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/)) {
      toast({
        title: 'Unsupported file format',
        description: 'Please upload a JPG, JPEG, PNG, or WebP photo.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image size must be under 15MB.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSelectedImage(base64);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const loadSample = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(blob);
    } catch {
      toast({ title: 'Sample load error', description: 'Could not fetch sample image.', variant: 'destructive' });
    }
  };

  const runAnalysis = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    setProgressStep('Preprocessing image and normalizing tensor dimensions...');

    const timer1 = setTimeout(() => {
      setProgressStep('Running MobileNetV3 CNN feature classification...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgressStep('Extracting fracture gradients & localized bounding boxes...');
    }, 900);

    const timer3 = setTimeout(() => {
      setProgressStep('Synthesizing photorealistic damage visualization...');
    }, 1400);

    try {
      const res = await fetch('/api/analyze-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: selectedImage }),
      });

      if (!res.ok) {
        throw new Error('Analysis request failed on backend.');
      }

      const data: InspectionResult = await res.json();
      setResult(data);
      setSeverityFilter(data.severity);
      setActiveView('comparison');
      fetchHistory();
      toast({
        title: '✅ Inspection Complete',
        description: `Identified ${data.product_category} with ${data.damage_type}`,
      });
    } catch (err: any) {
      toast({
        title: 'Analysis Failed',
        description: err.message || 'Error executing CNN model inference.',
        variant: 'destructive',
      });
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setAnalyzing(false);
      setProgressStep('');
    }
  };

  const handleRegenerate = async (severity: 'Low' | 'Medium' | 'High') => {
    if (!result) return;
    setRegenerating(true);
    setSeverityFilter(severity);

    try {
      const res = await fetch('/api/generate-damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: result.original_image,
          damage_type: result.damage_type,
          severity: severity,
          bbox: result.bbox,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult({
          ...result,
          visualization_image: data.generated_image,
          severity: severity,
        });
        toast({ title: 'Visualization Regenerated', description: `Updated with ${severity} severity rendering.` });
      }
    } catch {
      toast({ title: 'Regeneration Error', description: 'Could not re-synthesize image.', variant: 'destructive' });
    } finally {
      setRegenerating(false);
    }
  };

  const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadReport = () => {
    if (!result) return;
    const reportText = `=====================================================
AI PRODUCT DAMAGE INSPECTION REPORT
Verified by: ${result.verified_by_model}
Timestamp: ${new Date(result.timestamp).toLocaleString()}
Inspection ID: ${result.id}
=====================================================

1. PRODUCT CLASSIFICATION:
- Identified Category: ${result.product_category}
- Category Confidence: ${result.category_confidence || 95}%

2. DAMAGE DIAGNOSTICS:
- Detected Condition: ${result.damage_type}
- Damage Severity: ${result.severity}
- Confidence Score: ${result.confidence}%
- Affected Region: ${result.damage_location}
- Normalized BBox: x=${result.bbox.x}, y=${result.bbox.y}, w=${result.bbox.width}, h=${result.bbox.height}

3. RECOMMENDED INSPECTION / REPAIR ACTION:
${result.recommended_action}

4. TECHNICAL DETAILS:
- Resolution: ${result.details?.resolution || 'N/A'}
- Model Architecture: ${result.details?.model_architecture || 'MobileNetV3 CNN + PyTorch Fracture Filters'}
- Device Acceleration: ${result.details?.inference_device || 'MPS/CPU'}

DISCLAIMER:
This automated computer-vision inspection estimate is generated by a Convolutional Neural Network (CNN) model. Physical in-person inspection by a certified technician is recommended before structural replacement.
=====================================================`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Damage_Report_${result.product_category.replace(/[^a-zA-Z0-9]/g, '_')}_${result.id.slice(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Report Downloaded', description: 'Structured inspection summary saved.' });
  };

  const deleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/history/${id}`, { method: 'DELETE' });
      setHistory((prev) => prev.filter((h) => h.id !== id));
      if (result?.id === id) setResult(null);
      toast({ title: 'Deleted', description: 'Inspection removed from history.' });
    } catch {
      toast({ title: 'Error', description: 'Could not delete record.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col font-sans">
      <AppHeader title="AI Product Damage Inspection" showBack />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {/* Hero Banner */}
        <div className="mb-8 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border-indigo-500/30 px-3 py-1 text-xs">
                  <Cpu className="w-3.5 h-3.5 mr-1" /> MobileNetV3 CNN + PyTorch Fracture Engine
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30 px-3 py-1 text-xs">
                  <Zap className="w-3.5 h-3.5 mr-1" /> MPS Hardware Accelerated
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
                AI Product Damage Detection & Visualization
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-2xl">
                Upload a photograph of any electronic device, smartphone, appliance, or parcel. Our Convolutional
                Neural Network pinpoints structural fractures, scores severity, and generates photorealistic damage
                simulations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
                onClick={() => {
                  setSelectedImage(null);
                  setResult(null);
                }}
              >
                <RotateCw className="w-4 h-4 mr-2" /> Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Upload & Sample Images */}
          <div className="lg:col-span-5 space-y-6">
            {/* Upload Zone */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
                <span>1. Upload Product Photo</span>
                {selectedImage && (
                  <span className="text-xs font-normal text-slate-400">Image Loaded</span>
                )}
              </h2>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              {!selectedImage ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[260px] ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="font-semibold text-slate-200 mb-1">Click to browse or drag & drop</p>
                  <p className="text-xs text-slate-400 mb-4">Supports JPG, PNG, WebP (up to 15MB)</p>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl">
                    Select Photograph
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black max-h-[360px] flex items-center justify-center group">
                    <img
                      src={selectedImage}
                      alt="Uploaded product"
                      className="max-h-[360px] w-auto object-contain"
                    />

                    {/* Bounding box preview if analyzed */}
                    {result && showBbox && (
                      <div
                        className="absolute border-2 border-rose-500 bg-rose-500/20 pointer-events-none rounded transition-all duration-300"
                        style={{
                          left: `${result.bbox.x * 100}%`,
                          top: `${result.bbox.y * 100}%`,
                          width: `${result.bbox.width * 100}%`,
                          height: `${result.bbox.height * 100}%`,
                        }}
                      >
                        <span className="absolute -top-6 left-0 bg-rose-600 text-[10px] font-bold text-white px-1.5 py-0.5 rounded shadow">
                          {result.damage_type.split('/')[0]}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl text-xs"
                      >
                        Change Image
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedImage(null);
                          setResult(null);
                        }}
                        className="rounded-xl text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>

                  {/* Analyze Action Button */}
                  <Button
                    size="lg"
                    disabled={analyzing}
                    onClick={runAnalysis}
                    className="w-full h-13 rounded-2xl font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 text-base transition-all"
                  >
                    {analyzing ? (
                      <>
                        <RotateCw className="w-5 h-5 animate-spin" />
                        <span>Processing Neural Network...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Analyze Product Damage</span>
                      </>
                    )}
                  </Button>

                  {/* Progress indicator */}
                  {analyzing && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-3 text-xs text-indigo-300 flex items-center gap-2.5"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                      <span>{progressStep}</span>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Sample Presets */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                Or Try Benchmark Test Photographs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_IMAGES.map((sample, idx) => (
                  <div
                    key={idx}
                    onClick={() => loadSample(sample.url)}
                    className="border border-slate-800 hover:border-indigo-500/60 bg-slate-950/50 hover:bg-indigo-950/20 rounded-2xl p-2.5 cursor-pointer transition-all duration-200 group flex flex-col"
                  >
                    <div className="h-24 w-full rounded-xl overflow-hidden mb-2 bg-slate-900">
                      <img
                        src={sample.url}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <p className="text-xs font-bold text-white truncate">{sample.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{sample.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspection History */}
            {history.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    Recent Inspections ({history.length})
                  </h3>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedImage(item.original_image);
                        setResult(item);
                        setActiveView('comparison');
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        result?.id === item.id
                          ? 'border-indigo-500 bg-indigo-950/40 text-white'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.original_image}
                          alt="thumb"
                          className="w-9 h-9 rounded-lg object-cover border border-slate-800 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-bold truncate">{item.product_category}</p>
                          <p className="text-[10px] text-slate-400 truncate">{item.damage_type}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          className={`text-[10px] px-1.5 py-0 ${
                            item.severity === 'High'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : item.severity === 'Medium'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {item.severity}
                        </Badge>
                        <button
                          onClick={(e) => deleteHistory(item.id, e)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Detection Results & Visualization Dashboard */}
          <div className="lg:col-span-7 space-y-6">
            {result ? (
              <>
                {/* Visualizer Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                  {/* View mode toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
                      {[
                        { key: 'comparison', label: 'Side-by-Side', icon: Layers },
                        { key: 'visualization', label: 'AI Damage View', icon: Eye },
                        { key: 'heatmap', label: 'Grad-CAM Heatmap', icon: Cpu },
                        { key: 'original', label: 'Original Photo', icon: ImageIcon },
                      ].map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setActiveView(t.key as any)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            activeView === t.key
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                          }`}
                        >
                          <t.icon className="w-3.5 h-3.5" />
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowBbox((b) => !b)}
                        className={`h-8 rounded-xl text-xs border-slate-700 ${
                          showBbox ? 'bg-indigo-950/50 text-indigo-300' : 'text-slate-400'
                        }`}
                      >
                        BBox Overlay: {showBbox ? 'ON' : 'OFF'}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          downloadImage(
                            activeView === 'heatmap'
                              ? result.heatmap_image
                              : activeView === 'original'
                              ? result.original_image
                              : result.visualization_image,
                            `Damage_Visualization_${result.id.slice(0, 8)}.jpg`
                          )
                        }
                        className="h-8 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" /> Download Image
                      </Button>
                    </div>
                  </div>

                  {/* Active Visualizer Area */}
                  <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/80 p-2">
                    {activeView === 'comparison' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                            Original Input Photograph
                          </span>
                          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black h-72 flex items-center justify-center">
                            <img
                              src={result.original_image}
                              alt="Original"
                              className="max-h-full max-w-full object-contain"
                            />
                            {showBbox && (
                              <div
                                className="absolute border-2 border-rose-500 bg-rose-500/20 pointer-events-none rounded"
                                style={{
                                  left: `${result.bbox.x * 100}%`,
                                  top: `${result.bbox.y * 100}%`,
                                  width: `${result.bbox.width * 100}%`,
                                  height: `${result.bbox.height * 100}%`,
                                }}
                              />
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1 px-1 flex items-center justify-between">
                            <span>AI Realistic Damage Visualization</span>
                            <span className="text-[10px] text-slate-400 font-normal">Shape & Color Preserved</span>
                          </span>
                          <div className="relative rounded-xl overflow-hidden border border-indigo-900/50 bg-black h-72 flex items-center justify-center">
                            <img
                              src={result.visualization_image}
                              alt="Damage Visualization"
                              className="max-h-full max-w-full object-contain"
                            />
                            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-slate-300">
                              Simulated Fracture Tensor
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeView === 'visualization' && (
                      <div className="h-96 relative flex items-center justify-center bg-black rounded-xl">
                        <img
                          src={result.visualization_image}
                          alt="AI Damage View"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}

                    {activeView === 'heatmap' && (
                      <div className="h-96 relative flex items-center justify-center bg-black rounded-xl">
                        <img
                          src={result.heatmap_image}
                          alt="Heatmap"
                          className="max-h-full max-w-full object-contain"
                        />
                        <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span>High Probability Structural Fracture</span>
                        </div>
                      </div>
                    )}

                    {activeView === 'original' && (
                      <div className="h-96 relative flex items-center justify-center bg-black rounded-xl">
                        <img
                          src={result.original_image}
                          alt="Original"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Regenerate Damage Controls */}
                  <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Regenerate Damage Severity:</span>
                      {(['Low', 'Medium', 'High'] as const).map((sev) => (
                        <button
                          key={sev}
                          onClick={() => handleRegenerate(sev)}
                          disabled={regenerating}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                            severityFilter === sev
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={regenerating}
                      onClick={() => handleRegenerate(severityFilter)}
                      className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30 text-xs h-7"
                    >
                      <RotateCw className={`w-3.5 h-3.5 mr-1 ${regenerating ? 'animate-spin' : ''}`} />
                      Regenerate View
                    </Button>
                  </div>
                </div>

                {/* Structured Analysis Report */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-400" />
                        AI Damage Assessment Report
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Inference by {result.verified_by_model} &bull; ID: {result.id.slice(0, 8)}
                      </p>
                    </div>

                    <Button
                      onClick={downloadReport}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold h-9"
                    >
                      <FileText className="w-4 h-4 mr-1.5" /> Download Report
                    </Button>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                        Category
                      </p>
                      <p className="text-base font-bold text-white truncate">{result.product_category}</p>
                      <span className="text-[10px] text-indigo-400">{result.category_confidence || 95}% match</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                        Damage Condition
                      </p>
                      <p className="text-base font-bold text-white truncate">{result.damage_type.split('/')[0]}</p>
                      <span className="text-[10px] text-slate-400">Classified</span>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                        Severity
                      </p>
                      <Badge
                        className={`text-xs px-2.5 py-0.5 font-bold ${
                          result.severity === 'High'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : result.severity === 'Medium'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}
                      >
                        {result.severity} Severity
                      </Badge>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5">
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                        Confidence
                      </p>
                      <p className="text-base font-bold text-emerald-400">{result.confidence}%</p>
                      <span className="text-[10px] text-slate-400">Calibrated Score</span>
                    </div>
                  </div>

                  {/* Detail Cards */}
                  <div className="space-y-3">
                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Localized Damaged Region
                        </h4>
                        <p className="text-sm text-slate-300">{result.damage_location}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Coordinate Box: [{Math.round(result.bbox.x * 100)}%, {Math.round(result.bbox.y * 100)}%,{' '}
                          {Math.round(result.bbox.width * 100)}%w &times; {Math.round(result.bbox.height * 100)}%h]
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 mt-0.5">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Suggested Inspection / Repair Action
                        </h4>
                        <p className="text-sm text-slate-300">{result.recommended_action}</p>
                      </div>
                    </div>
                  </div>

                  {/* Automated Estimate Disclaimer */}
                  <p className="mt-5 text-[11px] text-slate-500 border-t border-slate-800/60 pt-3">
                    &bull; Note: Results represent automated computer-vision estimations derived from convolutional
                    neural networks. Always confirm with certified technicians for warranty or salvage claims.
                  </p>
                </div>
              </>
            ) : (
              /* Empty Placeholder State */
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[460px] shadow-xl">
                <div className="w-20 h-20 rounded-3xl bg-indigo-950/40 border border-indigo-800/50 flex items-center justify-center text-indigo-400 mb-5 shadow-2xl">
                  <Cpu className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Image Analyzed Yet</h3>
                <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
                  Upload a photograph or pick one of the sample benchmark products to trigger the CNN detection
                  pipeline and view photorealistic damage simulations.
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Bounding Box Localization
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-400" /> Grad-CAM Heatmaps
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-purple-400" /> Damage Inpainting
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
