import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Send, Zap, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import AppHeader from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import Milestones from '@/components/Milestones';
import AIProposalGenerator from '@/components/AIProposalGenerator';
import WorkerNavigationMap from '@/components/WorkerNavigationMap';
import JobImageGallery from '@/components/JobImageGallery';
import WorkerRouteNavigationCard from '@/components/WorkerRouteNavigationCard';

type DbJob = Tables<'jobs'>;

export default function WorkerJobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [job, setJob] = useState<DbJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowBidding, setAllowBidding] = useState(true);
  const [showBidForm, setShowBidForm] = useState(() => searchParams.get('action') === 'bid');
  const [bidAmount, setBidAmount] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'bid') {
      setShowBidForm(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchJob = async () => {
      let finalJob: any = null;
      const { data } = await supabase.from('jobs').select('*').eq('id', id!).single();
      if (data) {
        finalJob = data;
      } else {
        const demoJobs = JSON.parse(localStorage.getItem('nearwork_demo_jobs') || '[]');
        const found = demoJobs.find((j: any) => j.id === id);
        if (found) {
          finalJob = found;
        } else {
          try {
            const res = await fetch(`/api/jobs/${id}/details`);
            const json = await res.json();
            if (json?.data) finalJob = json.data;
          } catch {}
        }
      }
      setJob(finalJob);

      // Check if bidding is enabled for this job
      fetch(`/api/jobs/${id}/bidding-settings`)
        .then((res) => res.json())
        .then((json) => {
          if (json?.data?.allow_bidding !== undefined) {
            setAllowBidding(json.data.allow_bidding);
          }
        })
        .catch(() => {});

      setLoading(false);
    };
    fetchJob();
  }, [id]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !job) return;

    // Backend validation: check if bidding is allowed
    try {
      const checkRes = await fetch(`/api/jobs/${job.id}/can-bid`, {
        method: 'POST',
      });
      if (!checkRes.ok) {
        const checkJson = await checkRes.json();
        throw new Error(checkJson.detail || 'Bidding is disabled for this job by the customer.');
      }
    } catch (checkErr: any) {
      toast({
        title: 'Bidding Disabled',
        description: checkErr.message,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const bidPayload = {
        job_id: job.id,
        worker_id: user.id,
        amount: parseInt(bidAmount),
        estimated_time: timeEstimate,
        message,
      };

      const isNonUuid = !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(job.id);

      if (!isNonUuid) {
        const { error } = await supabase.from('bids').insert(bidPayload);
        if (error) {
          // If Supabase RLS blocks client insert in demo mode, fall back to local demo storage
          saveDemoBid(bidPayload);
        }
      } else {
        // Non-UUID job id (e.g. legacy demo-job-* prefix)
        saveDemoBid(bidPayload);
      }

      toast({ title: 'Bid submitted!', description: 'The customer will review your bid.' });
      navigate('/worker');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDemoBid = (bidPayload: any) => {
    const demoBids = JSON.parse(localStorage.getItem('nearwork_demo_bids') || '[]');
    const newBid = {
      ...bidPayload,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      status: 'pending',
      worker_name: user?.user_metadata?.full_name || 'Service Pro',
      worker_rating: 4.9,
      worker_reviews: 28,
      worker_verified: true,
    };
    demoBids.push(newBid);
    localStorage.setItem('nearwork_demo_bids', JSON.stringify(demoBids));
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
            {job.is_instant && (
              <Badge className="bg-accent text-accent-foreground gap-1">
                <Zap className="h-3 w-3" /> Instant
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-extrabold mb-1">{job.title}</h2>
          <p className="text-sm text-muted-foreground mb-3">{job.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-primary">₹{budget.toLocaleString('en-IN')}</span>
            <Badge variant="outline" className="text-xs">{job.is_negotiable ? 'negotiable' : 'fixed'}</Badge>
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {job.location_name || 'Unknown'}
          </div>
        </Card>

        {/* Customer Uploaded Problem Photos Gallery for Worker Diagnosis */}
        <JobImageGallery images={job.images} categoryTitle={job.title} />

        {/* Google Maps Customer Location & Worker Navigation Card */}
        <WorkerRouteNavigationCard
          customerLat={job.latitude || 13.0827}
          customerLng={job.longitude || 80.2707}
          customerAddress={job.location_name || 'Customer service location'}
          isAssignedToMe={job.accepted_worker_id === user?.id}
          jobId={job.id}
          onOpenLiveTracking={() => navigate(`/job-tracking/${job.id}`)}
          defaultWorkerLat={user?.user_metadata?.latitude}
          defaultWorkerLng={user?.user_metadata?.longitude}
        />

        {job.accepted_worker_id === user?.id && (job.status === 'in_progress' || job.status === 'completed') && (
          <Milestones
            jobId={job.id}
            customerId={job.customer_id}
            workerId={job.accepted_worker_id}
            escrowBalance={(job as any).escrow_balance ?? 0}
          />
        )}

        {/* Bidding Section for unassigned worker */}
        {job.accepted_worker_id !== user?.id && job.status === 'open' && (
          <>
            {!allowBidding ? (
              <Card className="p-5 border-amber-500/30 bg-amber-500/5 space-y-2 text-center rounded-2xl">
                <Sparkles className="h-7 w-7 text-amber-500 mx-auto animate-pulse" />
                <h4 className="font-extrabold text-sm text-foreground">
                  Direct Selection Only — Bidding Disabled
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  The customer disabled open bidding for this job. NearWork evaluates qualified worker profiles automatically based on skills, proximity, verified badges, and ratings.
                </p>
                <Badge variant="secondary" className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  Customer will assign directly via AI Recommendations
                </Badge>
              </Card>
            ) : !showBidForm ? (
              <div className="space-y-3">
                {job.is_instant && (
                  <Button
                    size="lg"
                    className="w-full h-14 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 gap-2"
                    onClick={async () => {
                      if (!user) return;
                      await supabase.from('jobs').update({ accepted_worker_id: user.id, status: 'in_progress' }).eq('id', job.id);
                      toast({ title: 'Job accepted!', description: 'Contact the customer to start.' });
                      navigate('/worker');
                    }}
                  >
                    <Zap className="h-5 w-5" /> Accept Instantly
                  </Button>
                )}
                <Button
                  size="lg"
                  variant={job.is_instant ? 'outline' : 'default'}
                  className="w-full h-14 text-base font-bold rounded-2xl"
                  onClick={() => setShowBidForm(true)}
                >
                  Place a Bid
                </Button>
              </div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
                onSubmit={handleBid}
              >
                <Card className="p-4 space-y-4">
                  <h3 className="font-bold">Your Bid</h3>
                  <div className="space-y-2">
                    <Label className="font-bold">Your Price (₹)</Label>
                    <Input type="number" placeholder={String(budget)} className="h-12 rounded-xl" required value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Time Estimate</Label>
                    <Input placeholder="e.g. 2 hours" className="h-12 rounded-xl" required value={timeEstimate} onChange={(e) => setTimeEstimate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold">Message to Customer</Label>
                    <Textarea placeholder="Why should they choose you?" className="rounded-xl" required value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
                  </div>
                </Card>
                <AIProposalGenerator job={job} onUseProposal={(t) => setMessage(t)} />
                <Button type="submit" size="lg" className="w-full h-14 text-base font-bold rounded-2xl gap-2" disabled={isSubmitting}>
                  <Send className="h-5 w-5" /> {isSubmitting ? 'Submitting...' : 'Submit Bid'}
                </Button>
              </motion.form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
