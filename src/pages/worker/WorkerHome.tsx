import { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  SlidersHorizontal,
  Loader2,
  Search,
  Crosshair,
  Navigation,
  Compass,
} from 'lucide-react';
import { motion } from 'framer-motion';
import DashboardShell from '@/components/DashboardShell';
import BottomNav from '@/components/BottomNav';
import JobCard from '@/components/JobCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORY_GROUPS, getGroup, type DbJobCategory } from '@/lib/serviceCatalog';
import { haversineDistanceKm } from '@/lib/geoUtils';
import type { Tables } from '@/integrations/supabase/types';

type DbJob = Tables<'jobs'>;

const RADIUS_OPTIONS = [
  { label: 'All Distances', value: null },
  { label: 'Within 5 km', value: 5 },
  { label: 'Within 10 km', value: 10 },
  { label: 'Within 20 km', value: 20 },
  { label: 'Within 50 km', value: 50 },
];

export default function WorkerHome() {
  const { profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<DbJobCategory | null>(null);
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState<'nearby' | 'recent'>('nearby');
  const [radiusFilter, setRadiusFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Live GPS tracking for worker coordinates
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const fetchLiveLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLiveCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsActive(true);
        setGpsLoading(false);
      },
      () => {
        setGpsActive(false);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  useEffect(() => {
    fetchLiveLocation();
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      const demoJobs: DbJob[] = JSON.parse(localStorage.getItem('nearwork_demo_jobs') || '[]');
      const openDemoJobs = demoJobs.filter((j: any) => j.status === 'open');

      const allJobs = [...(openDemoJobs || []), ...(data || [])];
      const uniqueJobs = Array.from(new Map(allJobs.map((item) => [item.id, item])).values());
      setJobs(uniqueJobs);
      setLoading(false);
    };
    fetchJobs();
  }, []);

  // Worker coordinates preference: live browser GPS > profile coordinates > default Chennai center
  const workerLat = liveCoords?.lat ?? profile?.latitude ?? 13.0827;
  const workerLng = liveCoords?.lng ?? profile?.longitude ?? 80.2707;

  const filteredJobs = useMemo(() => {
    let list = jobs.map((job) => {
      const distanceKm =
        job.latitude != null && job.longitude != null
          ? haversineDistanceKm(workerLat, workerLng, job.latitude, job.longitude)
          : null;
      return { job, distanceKm };
    });

    // Category filter
    if (selectedCategory) {
      list = list.filter(({ job }) => getGroup(job.category)?.id === selectedCategory);
    }

    // Radius filter
    if (radiusFilter !== null) {
      list = list.filter(({ distanceKm }) => distanceKm != null && distanceKm <= radiusFilter);
    }

    // Keyword search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        ({ job }) =>
          job.title.toLowerCase().includes(q) ||
          job.description.toLowerCase().includes(q) ||
          (job.location_name && job.location_name.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      if (sortMode === 'nearby') {
        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        return a.distanceKm - b.distanceKm;
      }
      return new Date(b.job.created_at).getTime() - new Date(a.job.created_at).getTime();
    });
  }, [jobs, selectedCategory, radiusFilter, sortMode, searchQuery, workerLat, workerLng]);

  return (
    <DashboardShell role="worker">
      <div className="space-y-4 pb-12 max-w-5xl">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Find Jobs Nearby
              </h1>
              {gpsActive ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live GPS
                </span>
              ) : (
                <button
                  type="button"
                  onClick={fetchLiveLocation}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200"
                  title="Enable browser GPS for real-time distances"
                >
                  <Crosshair className="h-2.5 w-2.5" />
                  {gpsLoading ? 'Detecting...' : 'Use Current GPS'}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse customer repair requests with photos, exact distances & turn-by-turn navigation
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={sortMode === 'nearby' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortMode('nearby')}
              className={`h-8 rounded-lg text-xs font-semibold ${
                sortMode === 'nearby' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
              }`}
            >
              Nearest First
            </Button>
            <Button
              variant={sortMode === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortMode('recent')}
              className={`h-8 rounded-lg text-xs font-semibold ${
                sortMode === 'recent' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
              }`}
            >
              Most Recent
            </Button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl">
          <Search className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search open requests by keyword (e.g. fridge, switchboard, faucet, locality)..."
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        {/* Radius Filter Pills (5km, 10km, 20km, 50km, All) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Radius:
          </span>
          {RADIUS_OPTIONS.map((opt) => {
            const isSelected = radiusFilter === opt.value;
            return (
              <Badge
                key={opt.label}
                variant={isSelected ? 'default' : 'outline'}
                className={`cursor-pointer shrink-0 h-7 px-2.5 text-xs font-semibold rounded-lg transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => setRadiusFilter(opt.value)}
              >
                {opt.label}
              </Badge>
            );
          })}
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <Badge
            variant={selectedCategory === null ? 'default' : 'outline'}
            className={`cursor-pointer shrink-0 h-8 px-3 text-xs font-semibold rounded-lg ${
              selectedCategory === null
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'border-slate-200 text-slate-600'
            }`}
            onClick={() => setSelectedCategory(null)}
          >
            All Categories ({jobs.length})
          </Badge>
          {CATEGORY_GROUPS.map((group) => (
            <Badge
              key={group.id}
              variant={selectedCategory === group.id ? 'default' : 'outline'}
              className={`cursor-pointer shrink-0 h-8 px-3 text-xs font-semibold rounded-lg ${
                selectedCategory === group.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'border-slate-200 text-slate-600'
              }`}
              onClick={() => setSelectedCategory(group.id === selectedCategory ? null : group.id)}
            >
              {group.name}
            </Badge>
          ))}
        </div>

        {/* Jobs Feed with Customer Uploaded Repair Images & Live Distances */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No open jobs found in this distance or category
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Try increasing your radius filter or selecting all categories.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={() => {
                setRadiusFilter(null);
                setSelectedCategory(null);
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredJobs.map(({ job, distanceKm }) => (
              <JobCard key={job.id} job={job} viewAs="worker" distanceKm={distanceKm} />
            ))}
          </div>
        )}
      </div>

      <div className="md:hidden">
        <BottomNav role="worker" />
      </div>
    </DashboardShell>
  );
}
