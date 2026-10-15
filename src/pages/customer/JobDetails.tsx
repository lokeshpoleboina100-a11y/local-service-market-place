import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, MessageSquare, CheckCircle, MapPin, Loader2, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import Milestones from '@/components/Milestones';
import AIWorkerRecommendations from '@/components/AIWorkerRecommendations';
import AIBidRanking from '@/components/AIBidRanking';
import JobStatusControl from '@/components/JobStatusControl';
import VerifiedBadge from '@/components/VerifiedBadge';
import AiExplanationCard from '@/components/AiExplanationCard';
import WorkerNavigationMap from '@/components/WorkerNavigationMap';
import DirectWorkerRecommendations, { type CandidateWorker } from '@/components/DirectWorkerRecommendations';
import JobImageGallery from '@/components/JobImageGallery';
import type { AiExplanation } from '@/components/AIJobAssistant';

type DbJob = Tables<'jobs'>;

interface BidWithProfile {
  id: string;
  amount: number;
  message: string | null;
  estimated_time: string | null;
  status: string;
  worker_id: string;
  created_at: string;
  worker_name: string;
  worker_rating: number | null;
  worker_reviews: number | null;
  worker_verified: boolean;
}

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<DbJob | null>(null);
  const [bids, setBids] = useState<BidWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowBidding, setAllowBidding] = useState<boolean>(true);
  const [acceptedWorker, setAcceptedWorker] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      let finalJob: any = null;
      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id!)
        .single();
      
      if (jobData) {
        finalJob = jobData;
      } else {
        // Fallback to local demo store
        const demoJobs = JSON.parse(localStorage.getItem('nearwork_demo_jobs') || '[]');
        const found = demoJobs.find((j: any) => j.id === id);
        if (found) {
          finalJob = found;
        } else {
          // Check backend API fallback
          try {
            const res = await fetch(`/api/jobs/${id}/details`);
            const json = await res.json();
            if (json?.data) finalJob = json.data;
          } catch {}
        }
      }
      setJob(finalJob);

      // Fetch customer bidding preference
      fetch(`/api/jobs/${id}/bidding-settings`)
        .then((res) => res.json())
        .then((json) => {
          if (json?.data?.allow_bidding !== undefined) {
            setAllowBidding(json.data.allow_bidding);
          }
        })
        .catch(() => {});

      // Fetch accepted worker profile if assigned
      if (jobData?.accepted_worker_id) {
        const { data: wProfile } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone, rating, avatar_url, is_verified')
          .eq('user_id', jobData.accepted_worker_id)
          .single();
        if (wProfile) setAcceptedWorker(wProfile);
      }

      let allBids: BidWithProfile[] = [];
      const isNonUuid = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id!);

      if (!isNonUuid) {
        const { data: bidsData } = await supabase
          .from('bids')
          .select('*')
          .eq('job_id', id!)
          .order('created_at', { ascending: true });

        if (bidsData && bidsData.length > 0) {
          const workerIds = bidsData.map((b) => b.worker_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, rating, total_reviews, is_verified')
            .in('user_id', workerIds);

          const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
          allBids = bidsData.map((b) => {
            const p = profileMap.get(b.worker_id);
            return {
              ...b,
              worker_name: p?.full_name || 'Worker',
              worker_rating: p?.rating ?? 0,
              worker_reviews: p?.total_reviews ?? 0,
              worker_verified: p?.is_verified ?? false,
            };
          });
        }
      }

      // Merge with demo bids
      const demoBids: any[] = JSON.parse(localStorage.getItem('nearwork_demo_bids') || '[]');
      const matchingDemoBids = demoBids.filter((b) => b.job_id === id);
      allBids = [...allBids, ...matchingDemoBids];

      setBids(allBids);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleDirectAssign = async (worker: CandidateWorker) => {
    if (!job) return;
    try {
      const isJobUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id!);
      if (isJobUuid) {
        await supabase
          .from('jobs')
          .update({ accepted_worker_id: worker.id, status: 'in_progress' })
          .eq('id', id!)
          .then(() => {}, () => {});
      }

      // Update in demo store if present
      const demoJobs = JSON.parse(localStorage.getItem('nearwork_demo_jobs') || '[]');
      const jIdx = demoJobs.findIndex((j: any) => j.id === id);
      if (jIdx !== -1) {
        demoJobs[jIdx].accepted_worker_id = worker.id;
        demoJobs[jIdx].status = 'in_progress';
        localStorage.setItem('nearwork_demo_jobs', JSON.stringify(demoJobs));
      }

      // Initialize location tracking with assigned worker
      await fetch(`/api/jobs/${id}/location/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: job.customer_id,
          customer_lat: job.latitude || 13.0827,
          customer_lng: job.longitude || 80.2707,
          customer_address: job.location_name || 'Customer location',
          worker_id: worker.id,
        }),
      }).catch(() => {});

      setAcceptedWorker({
        user_id: worker.id,
        full_name: worker.name,
        phone: '+91 98765 43210',
        rating: worker.rating,
        avatar_url: worker.avatar,
        is_verified: worker.is_verified,
      });

      setJob({
        ...job,
        accepted_worker_id: worker.id,
        status: 'in_progress',
      });

      toast({
        title: 'Worker Selected & Assigned!',
        description: `${worker.name} has been assigned to your job.`,
      });
    } catch (err: any) {
      toast({
        title: 'Failed to assign worker',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleEnableBidding = async () => {
    if (!job) return;
    try {
      await fetch(`/api/jobs/${job.id}/bidding-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: job.customer_id,
          allow_bidding: true,
        }),
      });
      setAllowBidding(true);
      toast({
        title: 'Bidding Enabled',
        description: 'Local workers can now submit competitive bids for this job.',
      });
    } catch {
      toast({ title: 'Failed to enable bidding', variant: 'destructive' });
    }
  };

  const handleAccept = async (bid: BidWithProfile) => {
    const isJobUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id!);
    const isBidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bid.id);

    if (isJobUuid) {
      await supabase
        .from('jobs')
        .update({ accepted_worker_id: bid.worker_id, status: 'in_progress' })
        .eq('id', id!)
        .then(() => {}, () => {});
    }
    if (isBidUuid) {
      await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', bid.id)
        .then(() => {}, () => {});
    }

    // Update in demo stores if present
    const demoJobs = JSON.parse(localStorage.getItem('nearwork_demo_jobs') || '[]');
    const jIdx = demoJobs.findIndex((j: any) => j.id === id);
    if (jIdx !== -1) {
      demoJobs[jIdx].accepted_worker_id = bid.worker_id;
      demoJobs[jIdx].status = 'in_progress';
      localStorage.setItem('nearwork_demo_jobs', JSON.stringify(demoJobs));
    }

    const demoBids = JSON.parse(localStorage.getItem('nearwork_demo_bids') || '[]');
    const bIdx = demoBids.findIndex((b: any) => b.id === bid.id);
    if (bIdx !== -1) {
      demoBids[bIdx].status = 'accepted';
      localStorage.setItem('nearwork_demo_bids', JSON.stringify(demoBids));
    }

    toast({ title: 'Worker accepted!', description: `${bid.worker_name} will start soon.` });
    navigate('/customer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Job Details" showBack />
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!job) return <div className="p-8 text-center">Job not found</div>;

  const budget = job.budget_max || job.budget_min || 0;
  const categoryKey = job.category as keyof typeof CATEGORY_ICONS;

  return (
    <div className="min-h-screen bg-background pb-8">
      <AppHeader title="Job Details" showBack />

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{CATEGORY_ICONS[categoryKey]}</span>
            <Badge variant="secondary">{CATEGORY_LABELS[categoryKey]}</Badge>
            {job.is_instant && <Badge className="bg-accent text-accent-foreground">⚡ Instant</Badge>}
          </div>
          <h2 className="text-xl font-extrabold mb-1">{job.title}</h2>
          <p className="text-sm text-muted-foreground mb-3">{job.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-primary">₹{budget.toLocaleString('en-IN')}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.location_name || 'Unknown'}
            </span>
          </div>
        </Card>

        {/* Customer Uploaded Problem Photos Gallery */}
        <JobImageGallery images={job.images} categoryTitle={job.title} />

        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">JOB STATUS</p>
          <JobStatusControl
            jobId={job.id}
            status={job.status as any}
            onChange={(s) => setJob({ ...job, status: s as any })}
          />
        </Card>

        {(job as any).ai_explanation && (
          <AiExplanationCard explanation={(job as any).ai_explanation as AiExplanation} />
        )}



        {/* Dedicated Live Worker Journey & Tracking Summary */}
        {(job.status === 'in_progress' || job.status === 'completed' || Boolean(job.accepted_worker_id)) && (
          <Card className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Assigned: {acceptedWorker?.full_name || 'Service Professional'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Live GPS route & Rapido-style arrival estimation active
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 shrink-0 shadow-xs"
                onClick={() => navigate(`/job-tracking/${job.id}`)}
              >
                Track Live Map
              </Button>
            </div>
          </Card>
        )}

        {/* When Bidding is OFF: Direct Worker Recommendations */}
        {job.status === 'open' && !allowBidding && (
          <DirectWorkerRecommendations
            jobId={job.id}
            category={job.category}
            jobLat={job.latitude || 13.0827}
            jobLng={job.longitude || 80.2707}
            budget={budget}
            onAssignWorker={handleDirectAssign}
            onEnableBidding={handleEnableBidding}
          />
        )}

        {/* When Bidding is ON: Standard Competitive Bidding */}
        {job.status === 'open' && allowBidding && (
          <>
            <AIWorkerRecommendations jobId={job.id} onChat={() => navigate(`/customer/chat/${job.id}`)} />

            {bids.length > 1 && (
              <AIBidRanking
                jobId={job.id}
                canAccept={job.status === 'open'}
                onAccept={(rb) => {
                  const match = bids.find((b) => b.id === rb.bid_id);
                  if (match) handleAccept(match);
                }}
              />
            )}

            <h3 className="font-bold text-base">{bids.length} Bids</h3>

            {bids.length === 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">No bids yet. Workers will bid soon!</p>
            )}

            {bids.map((bid, i) => (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {bid.worker_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-bold truncate">{bid.worker_name}</h4>
                          {bid.worker_verified && <VerifiedBadge showLabel={false} />}
                        </div>
                        <span className="text-lg font-extrabold text-primary">₹{bid.amount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        <span className="font-semibold">{bid.worker_rating}</span>
                        <span>({bid.worker_reviews} reviews)</span>
                        {bid.estimated_time && <span>• {bid.estimated_time}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{bid.message}</p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          className="rounded-xl font-bold gap-1.5"
                          onClick={() => handleAccept(bid)}
                        >
                          <CheckCircle className="h-4 w-4" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl font-bold gap-1.5"
                          onClick={() => navigate(`/customer/chat/${job.id}`)}
                        >
                          <MessageSquare className="h-4 w-4" /> Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </>
        )}

        {(job.status === 'in_progress' || job.status === 'completed') && job.accepted_worker_id && (
          <>
            <Milestones
              jobId={job.id}
              customerId={job.customer_id}
              workerId={job.accepted_worker_id}
              escrowBalance={(job as any).escrow_balance ?? 0}
              onEscrowChange={(b) => setJob({ ...job, escrow_balance: b } as any)}
            />
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl font-bold text-base gap-2"
              onClick={() => navigate(`/customer/payment/${job.id}`)}
            >
              <IndianRupee className="h-5 w-5" /> One-time payment
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
