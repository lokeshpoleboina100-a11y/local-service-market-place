import { useEffect, useState } from 'react';
import {
  Sparkles,
  Loader2,
  Wand2,
  IndianRupee,
  Clock,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertCircle,
  FileText,
  Tag,
  DollarSign,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { analyzeFullJob, type FullJobAnalysis } from '@/services/ai';
import { CATEGORY_ICONS, CATEGORY_LABELS, JobCategory } from '@/lib/types';

interface Props {
  title: string;
  description: string;
  image?: string | null;
  /** Called when the customer accepts the AI-detected category. */
  onApplyCategory: (category: string, service?: string) => void;
  /** Called when customer accepts the suggested title. */
  onApplyTitle?: (title: string) => void;
  /** Called when customer accepts the suggested description. */
  onApplyDescription?: (desc: string) => void;
  /** Called when the customer accepts the suggested typical price. */
  onApplyBudget?: (amount: number) => void;
  /** Called when customer clicks "Use All Suggestions". */
  onApplyAll?: (data: {
    category: string;
    service: string;
    title: string;
    description: string;
    budget: number;
  }) => void;
  /** Fires whenever the explanation changes. */
  onExplanationChange?: (explanation: any) => void;
}

const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function AIJobAssistant({
  title,
  description,
  image,
  onApplyCategory,
  onApplyTitle,
  onApplyDescription,
  onApplyBudget,
  onApplyAll,
  onExplanationChange,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<FullJobAnalysis | null>(null);
  const [appliedAll, setAppliedAll] = useState(false);

  const text = `${title} ${description}`.trim();

  // Re-run analysis when image changes or explicitly requested
  const analyse = async () => {
    if (!image && text.length < 3) {
      toast({
        title: 'Provide a photo or description',
        description: 'Upload a problem photo or type a few words so AI can analyze the job.',
      });
      return;
    }

    setLoading(true);
    setAppliedAll(false);
    try {
      const result = await analyzeFullJob({
        image: image || null,
        title: title || undefined,
        description: description || undefined,
      });

      setAnalysis(result);
      onExplanationChange?.({
        version: 2,
        generated_at: new Date().toISOString(),
        analysis: result,
      });

      if (result.is_ambiguous) {
        toast({
          title: 'Clarification Needed',
          description: result.clarification_prompt || 'Please provide more details about the problem.',
        });
      } else {
        toast({
          title: '✅ AI Analysis Ready',
          description: `Detected: ${result.service_name} (${result.group_name}) — Est: ${money(result.estimated_price.min)} to ${money(result.estimated_price.max)}`,
        });
      }
    } catch (e: any) {
      toast({
        title: 'AI Analysis Failed',
        description: e.message || 'Could not analyze job.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAll = () => {
    if (!analysis) return;
    onApplyCategory(analysis.group_id, analysis.service_name);
    if (onApplyTitle) onApplyTitle(analysis.suggested_title);
    if (onApplyDescription) onApplyDescription(analysis.suggested_description);
    if (onApplyBudget) onApplyBudget(analysis.estimated_price.typical);

    if (onApplyAll) {
      onApplyAll({
        category: analysis.group_id,
        service: analysis.service_name,
        title: analysis.suggested_title,
        description: analysis.suggested_description,
        budget: analysis.estimated_price.typical,
      });
    }

    setAppliedAll(true);
    toast({
      title: '✨ Suggestions Applied',
      description: 'Category, title, description, and estimated budget filled into your job form.',
    });
  };

  return (
    <Card className="p-4 space-y-4 border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.04] via-card to-card rounded-2xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-sm flex items-center gap-2 text-foreground">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            AI Job Analysis & Price Estimator
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auto-detects service category, generates title/description & estimates price & time.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={analyse}
          disabled={loading}
          className="rounded-xl gap-1.5 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
          {analysis ? 'Re-analyse' : 'Analyse Job'}
        </Button>
      </div>

      {/* Ambiguity Alert */}
      {analysis && analysis.is_ambiguous && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Unable to identify the service clearly</p>
            <p className="mt-0.5 text-muted-foreground">
              {analysis.clarification_prompt || 'Please add more details or upload a clearer photograph.'}
            </p>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !analysis.is_ambiguous && (
        <div className="space-y-3.5 pt-1">
          {/* Category & Service Detection */}
          <div className="bg-background/80 rounded-xl p-3 border border-border/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Tag className="h-3 w-3 text-indigo-600" /> Detected Service Category
              </span>
              <Badge className="bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/20 text-xs font-bold">
                {Math.round(analysis.confidence)}% Confidence
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                  <span>{CATEGORY_ICONS[analysis.group_id as JobCategory] || '🛠️'}</span>
                  <span>{analysis.service_name}</span>
                  <span className="text-xs text-muted-foreground font-normal">({analysis.group_name})</span>
                </p>
                {analysis.is_new_category && (
                  <span className="text-[10px] text-amber-600 font-semibold">Flexible custom category</span>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs rounded-lg font-semibold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={() => onApplyCategory(analysis.group_id, analysis.service_name)}
              >
                Use Category
              </Button>
            </div>
          </div>

          {/* Pricing & Time Estimation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Price Box */}
            <div className="bg-background/80 rounded-xl p-3 border border-border/70 space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <IndianRupee className="h-3 w-3 text-emerald-600" /> Estimated Price Range
              </span>
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-extrabold text-emerald-600">
                  {money(analysis.estimated_price.min)} – {money(analysis.estimated_price.max)}
                </p>
                {onApplyBudget && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50"
                    onClick={() => onApplyBudget(analysis.estimated_price.typical)}
                  >
                    Set {money(analysis.estimated_price.typical)}
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Labour: <span className="font-semibold text-foreground">{analysis.estimated_price.labour_estimate}</span> | Parts: <span className="font-semibold text-foreground">{analysis.estimated_price.materials_estimate}</span>
              </p>
            </div>

            {/* Duration Box */}
            <div className="bg-background/80 rounded-xl p-3 border border-border/70 space-y-1.5">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Clock className="h-3 w-3 text-indigo-600" /> Estimated Duration
              </span>
              <p className="text-lg font-extrabold text-foreground">
                {analysis.estimated_duration.display}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Type: <span className="font-semibold text-foreground">{analysis.estimated_duration.type === 'working_hours' ? 'On-site working hours' : 'Calendar working days'}</span>
              </p>
            </div>
          </div>

          {/* Price Factors */}
          {analysis.estimated_price.factors?.length > 0 && (
            <div className="text-[11px] text-muted-foreground bg-muted/40 rounded-lg p-2.5 space-y-1">
              <span className="font-bold text-foreground">Factors affecting price:</span>
              <ul className="list-disc list-inside space-y-0.5">
                {analysis.estimated_price.factors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Generated Title Preview */}
          <div className="bg-background/80 rounded-xl p-3 border border-border/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <FileText className="h-3 w-3 text-indigo-600" /> Suggested Job Title
              </span>
              {onApplyTitle && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 px-1.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50"
                  onClick={() => onApplyTitle(analysis.suggested_title)}
                >
                  Use Title
                </Button>
              )}
            </div>
            <p className="text-xs font-bold text-foreground">
              {analysis.suggested_title}
            </p>
          </div>

          {/* Generated Description Preview */}
          <div className="bg-background/80 rounded-xl p-3 border border-border/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <FileText className="h-3 w-3 text-indigo-600" /> Suggested Description
              </span>
              {onApplyDescription && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 px-1.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50"
                  onClick={() => onApplyDescription(analysis.suggested_description)}
                >
                  Use Description
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-3">
              {analysis.suggested_description}
            </p>
          </div>

          {/* Master "Apply All" Action */}
          <Button
            type="button"
            className="w-full h-11 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md shadow-indigo-600/20"
            onClick={handleApplyAll}
          >
            {appliedAll ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Suggestions Applied to Form
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Use All AI Suggestions in Post
              </>
            )}
          </Button>

          {/* Data Source Disclosure */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{analysis.data_source}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
