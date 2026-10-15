import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardShell from '@/components/DashboardShell';
import WorkerNavigationMap from '@/components/WorkerNavigationMap';
import JobImageGallery from '@/components/JobImageGallery';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, MapPin, Phone, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type DbJob = Tables<'jobs'>;

export default function JobTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<DbJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [workerProfile, setWorkerProfile] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      let finalJob: any = null;
      const { data } = await supabase.from('jobs').select('*').eq('id', id).single();
      if (data) {
        finalJob = data;
      } else {
        const demoJobs = JSON.parse(localStorage.getItem('nearwork_demo_jobs') || '[]');
        const found = demoJobs.find((j: any) => j.id === id);
        if (found) finalJob = found;
      }
      setJob(finalJob);

      if (finalJob?.accepted_worker_id) {
        const { data: wData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', finalJob.accepted_worker_id)
          .single();
        if (wData) setWorkerProfile(wData);
      }
      setLoading(false);
    };
    fetchJob();
  }, [id]);

  const isWorker = user?.id === job?.accepted_worker_id;

  if (loading) {
    return (
      <DashboardShell role={isWorker ? 'worker' : 'customer'}>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardShell>
    );
  }

  if (!job) {
    return (
      <DashboardShell role="customer">
        <div className="p-8 text-center">
          <p className="text-sm font-semibold">Job not found</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role={isWorker ? 'worker' : 'customer'}>
      <div className="space-y-4 pb-12 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Live Worker Tracking</h1>
            <p className="text-xs text-slate-500">Real-time status, route & arrival estimation</p>
          </div>
        </div>

        {/* Dedicated Map & Status Timeline Component */}
        <WorkerNavigationMap
          jobId={job.id}
          mode={isWorker ? 'worker' : 'customer'}
          currentUserId={user?.id || ''}
          customerName="Customer"
          customerAddress={job.location_name || 'Customer Location'}
          customerLat={job.latitude || 13.0827}
          customerLng={job.longitude || 80.2707}
          workerName={workerProfile?.full_name || 'Assigned Technician'}
          workerPhone={workerProfile?.phone || '+91 98765 43210'}
          workerAvatar={workerProfile?.avatar_url}
          workerRating={workerProfile?.rating ?? 4.9}
          workerVerified={workerProfile?.is_verified ?? true}
          onChatClick={() => navigate(`/customer/chat/${job.id}`)}
        />

        {/* Uploaded Customer Photos */}
        {job.images && job.images.length > 0 && (
          <div className="mt-4">
            <JobImageGallery images={job.images} categoryTitle={job.title} />
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
