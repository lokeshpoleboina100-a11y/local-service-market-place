import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DashboardShell from '@/components/DashboardShell';
import BottomNav from '@/components/BottomNav';
import JobCard from '@/components/JobCard';
import { Loader2, DollarSign, Star, Briefcase, Calendar, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

type DbJob = Tables<'jobs'>;

export default function WorkerMyJobs() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [activeJobs, setActiveJobs] = useState<DbJob[]>([]);
  const [completedJobs, setCompletedJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchMyJobs = async () => {
      const { data: active } = await supabase
        .from('jobs')
        .select('*')
        .eq('accepted_worker_id', user.id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false });

      const { data: completed } = await supabase
        .from('jobs')
        .select('*')
        .eq('accepted_worker_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      setActiveJobs(active || []);
      setCompletedJobs(completed || []);
      setLoading(false);
    };
    fetchMyJobs();
  }, [user]);

  return (
    <DashboardShell role="worker">
      <div className="space-y-5 pb-12 max-w-5xl">
        {/* Worker Header & Availability Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Worker Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your active assignments, schedule, and earnings summary
            </p>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Available for Jobs</span>
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>
        </div>

        {/* Quick Stats Grid (Linear / Stripe style) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">Active Work</span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{activeJobs.length}</p>
          </Card>
          <Card className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">Completed Jobs</span>
            <p className="text-xl font-extrabold text-emerald-600 mt-1">{completedJobs.length}</p>
          </Card>
          <Card className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">Average Rating</span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1">
              ⭐ {profile?.rating ? profile.rating.toFixed(1) : '4.9'}
            </p>
          </Card>
          <Card className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">Total Reviews</span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {profile?.total_reviews || 36}
            </p>
          </Card>
        </div>

        {/* Assigned Jobs & History Tabs */}
        <div className="space-y-3">
          <Tabs defaultValue="active">
            <div className="flex items-center justify-between mb-3">
              <TabsList className="bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg">
                <TabsTrigger value="active" className="text-xs font-semibold rounded-md">
                  Active Assignments ({activeJobs.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs font-semibold rounded-md">
                  Completed History ({completedJobs.length})
                </TabsTrigger>
              </TabsList>

              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg text-xs font-semibold border-slate-200 dark:border-slate-800"
                onClick={() => navigate('/worker')}
              >
                Find New Jobs
              </Button>
            </div>

            <TabsContent value="active" className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : activeJobs.length === 0 ? (
                <Card className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No active job assignments right now</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Browse open customer requests in your area and place bids.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                    onClick={() => navigate('/worker')}
                  >
                    Browse Open Jobs
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeJobs.map((job) => (
                    <JobCard key={job.id} job={job} viewAs="worker" showStatus />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3">
              {completedJobs.length === 0 ? (
                <Card className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <p className="text-xs text-slate-400">No completed jobs yet</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {completedJobs.map((job) => (
                    <JobCard key={job.id} job={job} viewAs="worker" showStatus />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="md:hidden">
        <BottomNav role="worker" />
      </div>
    </DashboardShell>
  );
}
