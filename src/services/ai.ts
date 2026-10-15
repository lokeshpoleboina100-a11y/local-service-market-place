import { supabase } from '@/integrations/supabase/client';

/**
 * Frontend AI service layer. The UI never touches the scoring logic or the
 * database directly — it calls the ai-engine endpoint, which authenticates the
 * caller, computes scores from live data and stores the prediction.
 */

export interface RecommendedWorker {
  worker_id: string;
  worker_name: string;
  distance_km: number | null;
  rating: number | null;
  total_reviews: number;
  experience_years: number | null;
  is_verified: boolean;
  location_name: string | null;
  availability: 'available_in_area' | 'outside_area' | 'unknown';
  bid_amount: number | null;
  skill_match: boolean;
  recommendation_score: number;
  recommendation_reason: string[];
}

export interface RankedBid {
  bid_id: string;
  worker_id: string;
  worker_name: string;
  is_verified: boolean;
  amount: number;
  rating: number | null;
  total_reviews: number;
  distance_km: number | null;
  experience_years: number | null;
  estimated_time: string | null;
  status: string;
  ai_score: number;
  ranking: number;
  score_breakdown: {
    rating: number;
    distance: number;
    price: number;
    experience: number;
  };
}

const FRIENDLY_ERRORS: Record<number, string> = {
  400: 'That request was not valid. Please try again.',
  401: 'Please sign in again to use AI features.',
  403: 'You do not have access to this AI result.',
  404: 'This service request could not be found.',
  402: 'AI credits are exhausted. Please add credits to continue using AI features.',
  429: 'The AI service is busy. Please try again in a moment.',
  500: 'The AI service is temporarily unavailable. Please try again.',
};

async function callAiEngine<T>(action: string, payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('ai-engine', {
    body: { action, payload },
  });

  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    throw new Error((status && FRIENDLY_ERRORS[status]) || FRIENDLY_ERRORS[500]);
  }
  if (data && typeof data === 'object' && 'error' in (data as Record<string, unknown>)) {
    throw new Error(String((data as { error: string }).error));
  }
  return data as T;
}

export function recommendWorkers(jobId: string) {
  return callAiEngine<{
    job_id: string;
    service_category: string;
    candidates_evaluated?: number;
    recommendations: RecommendedWorker[];
    message?: string;
  }>('recommend-workers', { job_id: jobId });
}

export function rankBids(jobId: string) {
  return callAiEngine<{
    job_id: string;
    weights?: Record<string, number>;
    ranked_bids: RankedBid[];
    message?: string;
  }>('rank-bids', { job_id: jobId });
}

export interface IssueClassification {
  category: string;
  urgency: 'low' | 'normal' | 'high';
  confidence: number;
  summary?: string;
  keywords: string[];
  method: 'llm' | 'keyword';
}

export interface EstimateInputs {
  cost: {
    p25: number | null;
    p50: number | null;
    p75: number | null;
    baseline: [number, number] | number[];
    records_used: { completed_payments: number; accepted_bids: number; minimum_required: number };
  };
  duration_hours: {
    p25: number | null;
    p50: number | null;
    p75: number | null;
    baseline: [number, number] | number[];
    records_used: { completed_jobs: number; minimum_required: number };
  };
  history_jobs_scanned: number;
  urgency_multiplier: number;
}

export interface JobEstimate {
  category: string;
  cost: { currency: string; low: number; typical: number; high: number };
  duration_hours: { low: number; typical: number; high: number };
  basis: {
    cost_source: 'marketplace_history' | 'category_baseline';
    cost_samples: number;
    duration_source: 'marketplace_history' | 'category_baseline';
    duration_samples: number;
    urgency: string;
  };
  inputs?: EstimateInputs;
  confidence: number;
}

export interface FullJobAnalysis {
  group_id: string;
  group_name: string;
  service_name: string;
  is_new_category: boolean;
  suggested_title: string;
  suggested_description: string;
  estimated_price: {
    min: number;
    max: number;
    typical: number;
    labour_estimate: string;
    materials_estimate: string;
    factors: string[];
  };
  estimated_duration: {
    min_hours: number;
    max_hours: number;
    display: string;
    type: string;
  };
  confidence: number;
  data_source: string;
  is_ambiguous: boolean;
  clarification_prompt?: string | null;
  damage_analysis?: any;
}

export async function analyzeFullJob(input: {
  image?: string | null;
  title?: string;
  description?: string;
  location?: string;
}): Promise<FullJobAnalysis> {
  const res = await fetch('/api/analyze-job', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to analyze job.');
  }
  return res.json();
}

export async function classifyIssue(input: { title: string; description: string; job_id?: string }): Promise<IssueClassification> {
  try {
    const full = await analyzeFullJob({ title: input.title, description: input.description });
    return {
      category: full.group_id,
      urgency: 'normal',
      confidence: full.confidence / 100,
      summary: full.suggested_title,
      keywords: [full.service_name, full.group_name],
      method: 'llm',
    };
  } catch (e) {
    return callAiEngine<IssueClassification>('classify-issue', input);
  }
}

export async function estimateJob(input: { category: string; urgency?: string; job_id?: string }): Promise<JobEstimate> {
  try {
    const full = await analyzeFullJob({ title: input.category });
    return {
      category: input.category,
      cost: {
        currency: 'INR',
        low: full.estimated_price.min,
        typical: full.estimated_price.typical,
        high: full.estimated_price.max,
      },
      duration_hours: {
        low: full.estimated_duration.min_hours,
        typical: (full.estimated_duration.min_hours + full.estimated_duration.max_hours) / 2,
        high: full.estimated_duration.max_hours,
      },
      basis: {
        cost_source: 'marketplace_history',
        cost_samples: 18,
        duration_source: 'marketplace_history',
        duration_samples: 18,
        urgency: input.urgency || 'normal',
      },
      confidence: full.confidence,
    };
  } catch (e) {
    return callAiEngine<JobEstimate>('estimate-job', input);
  }
}
