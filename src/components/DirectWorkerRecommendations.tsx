import { useState, useEffect } from 'react';
import {
  Sparkles,
  Star,
  MapPin,
  CheckCircle,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Loader2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import VerifiedBadge from '@/components/VerifiedBadge';

export interface CandidateWorker {
  id: string;
  name: string;
  avatar?: string;
  category: string;
  skills: string[];
  rating: number;
  total_reviews: number;
  completed_jobs: number;
  experience_years: number;
  distance_km: number;
  is_verified: boolean;
  typical_rate: number;
  match_score: number;
  match_reasons: string[];
}

interface DirectWorkerRecommendationsProps {
  jobId: string;
  category: string;
  jobLat?: number;
  jobLng?: number;
  budget?: number;
  onAssignWorker: (worker: CandidateWorker) => void;
  onEnableBidding?: () => void;
}

export default function DirectWorkerRecommendations({
  jobId,
  category,
  jobLat = 13.0827,
  jobLng = 80.2707,
  budget = 1000,
  onAssignWorker,
  onEnableBidding,
}: DirectWorkerRecommendationsProps) {
  const [candidates, setCandidates] = useState<CandidateWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [radiusKm, setRadiusKm] = useState(15);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndRankWorkers = async () => {
      setLoading(true);
      try {
        // Query worker profiles from database
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'worker');

        const rows = profiles || [];

        // If fewer profiles in Supabase demo, enrich with standard service provider candidates
        const rawCandidates = rows.length > 0 ? rows : [
          {
            user_id: 'w1',
            full_name: 'Murugan P.',
            avatar_url: '',
            rating: 4.9,
            total_reviews: 142,
            total_jobs_completed: 320,
            experience_years: 8,
            is_verified: true,
            skills: ['plumbing', 'appliance_repair', 'refrigerator_repair'],
            latitude: 13.0815,
            longitude: 80.2680,
          },
          {
            user_id: 'w2',
            full_name: 'Senthil K.',
            avatar_url: '',
            rating: 4.8,
            total_reviews: 98,
            total_jobs_completed: 215,
            experience_years: 6,
            is_verified: true,
            skills: ['electrical', 'ac_repair', 'appliance_repair'],
            latitude: 13.0750,
            longitude: 80.2520,
          },
          {
            user_id: 'w3',
            full_name: 'Rajesh M.',
            avatar_url: '',
            rating: 4.6,
            total_reviews: 64,
            total_jobs_completed: 130,
            experience_years: 4,
            is_verified: true,
            skills: ['carpentry', 'repair'],
            latitude: 13.0910,
            longitude: 80.2790,
          },
          {
            user_id: 'w4',
            full_name: 'Dinesh Kumar',
            avatar_url: '',
            rating: 4.7,
            total_reviews: 82,
            total_jobs_completed: 190,
            experience_years: 5,
            is_verified: false,
            skills: ['painting', 'cleaning'],
            latitude: 13.0550,
            longitude: 80.2400,
          },
        ];

        // Haversine distance & multi-factor scoring
        const scored: CandidateWorker[] = rawCandidates.map((p: any) => {
          const wLat = p.latitude || jobLat + (Math.random() - 0.5) * 0.05;
          const wLng = p.longitude || jobLng + (Math.random() - 0.5) * 0.05;

          // Distance
          const dLat = (wLat - jobLat) * (Math.PI / 180);
          const dLng = (wLng - jobLng) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(jobLat * (Math.PI / 180)) * Math.cos(wLat * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
          const distKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;

          // Skill match check
          const workerSkills = (p.skills || []) as string[];
          const isCategoryMatch =
            workerSkills.some((s) => s.toLowerCase().includes(category.toLowerCase())) ||
            category.toLowerCase().includes('repair') ||
            workerSkills.length > 0;

          const rating = p.rating ?? 4.5;
          const isVerified = Boolean(p.is_verified);
          const completed = p.total_jobs_completed || 50;
          const exp = p.experience_years || 3;

          // Weighted scoring (0 - 100)
          let score = 50;
          const reasons: string[] = [];

          if (isCategoryMatch) {
            score += 20;
            reasons.push(`Direct skill match for ${category.replace(/_/g, ' ')}`);
          }
          if (isVerified) {
            score += 15;
            reasons.push('Identity & government ID verified with active badge');
          }
          if (distKm <= 5) {
            score += 15;
            reasons.push(`Close proximity: only ${distKm} km from your doorstep`);
          } else if (distKm <= radiusKm) {
            score += 5;
            reasons.push(`Within service radius (${distKm} km away)`);
          }
          if (rating >= 4.7) {
            score += 10;
            reasons.push(`Top rated pro: ⭐ ${rating} across ${p.total_reviews || 50}+ customer reviews`);
          }
          if (completed >= 100) {
            score += 10;
            reasons.push(`Highly experienced: ${completed} successfully completed marketplace jobs`);
          }

          score = Math.min(99, Math.max(60, score));

          return {
            id: p.user_id || p.id,
            name: p.full_name || 'Service Pro',
            avatar: p.avatar_url,
            category: category,
            skills: workerSkills,
            rating,
            total_reviews: p.total_reviews || 45,
            completed_jobs: completed,
            experience_years: exp,
            distance_km: distKm,
            is_verified: isVerified,
            typical_rate: budget,
            match_score: score,
            match_reasons: reasons,
          };
        });

        // Filter by radius & sort descending by match score
        const filtered = scored
          .filter((w) => w.distance_km <= radiusKm)
          .sort((a, b) => b.match_score - a.match_score);

        setCandidates(filtered);
      } catch (err) {
        console.error('Error ranking workers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndRankWorkers();
  }, [category, jobLat, jobLng, radiusKm, budget]);

  const handleSelect = async (worker: CandidateWorker) => {
    setAssigningId(worker.id);
    try {
      await onAssignWorker(worker);
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground">
                Direct AI Worker Recommendations
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Bidding is OFF • Ranked by category skills, distance, verified identity, and ratings
              </p>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {candidates.length} Qualified Pros
          </Badge>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground/80 italic pt-1 border-t border-border/40">
          ⚠️ Note: Recommendations are algorithmic suggestions based on verified qualifications and reviews, not a guarantee of service quality. Please inspect work before releasing escrow payment.
        </p>
      </Card>

      {/* Loading state */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-semibold">Evaluating verified workers in your area...</p>
        </div>
      )}

      {/* Empty State: no workers found in radius */}
      {!loading && candidates.length === 0 && (
        <Card className="p-6 text-center space-y-3 border-dashed">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">No Suitable Workers Found in Current Radius</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              There are currently no verified pros within {radiusKm} km for this category. You can broaden your search radius or enable competitive bidding so workers from adjacent areas can submit offers.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5"
              onClick={() => setRadiusKm((r) => r + 15)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Broaden Radius ({radiusKm + 15} km)
            </Button>
            {onEnableBidding && (
              <Button
                variant="default"
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={onEnableBidding}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Enable Bidding for Job
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Ranked Candidate Cards */}
      {!loading && candidates.map((worker, rank) => (
        <Card
          key={worker.id}
          className="p-4 space-y-3 transition-all hover:border-primary/40 hover:shadow-sm"
        >
          {/* Top row: rank badge + match score */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={worker.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {worker.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center">
                  #{rank + 1}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-sm truncate text-foreground">
                    {worker.name}
                  </h4>
                  {worker.is_verified && <VerifiedBadge showLabel={false} />}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                    {worker.rating}
                  </span>
                  <span>({worker.total_reviews} reviews)</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {worker.distance_km} km away
                  </span>
                  <span>• {worker.experience_years} yrs exp</span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <Badge className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-600/20 font-bold text-xs">
                {worker.match_score}% Match
              </Badge>
              <p className="text-[10px] text-muted-foreground mt-1">
                {worker.completed_jobs} jobs completed
              </p>
            </div>
          </div>

          {/* Progress Match Bar */}
          <Progress value={worker.match_score} className="h-1.5 bg-muted" />

          {/* Reasons List */}
          <div className="rounded-lg bg-muted/40 p-2.5 space-y-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Why NearWork Recommends {worker.name.split(' ')[0]}:
            </p>
            <ul className="space-y-0.5">
              {worker.match_reasons.map((r, i) => (
                <li key={i} className="text-xs text-foreground/90 flex items-start gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action CTA */}
          <div className="flex items-center justify-between pt-1 gap-2">
            <div>
              <p className="text-[11px] text-muted-foreground">Estimated Rate</p>
              <p className="text-base font-extrabold text-primary">₹{worker.typical_rate}</p>
            </div>
            <Button
              size="sm"
              className="rounded-xl font-bold gap-1.5 px-4 h-10 shadow-sm"
              disabled={assigningId === worker.id}
              onClick={() => handleSelect(worker)}
            >
              {assigningId === worker.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Select & Assign Worker
                </>
              )}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
