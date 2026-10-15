import { ArrowUpRight, CalendarDays, MapPin, Users, Zap, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import SaveJobButton from '@/components/SaveJobButton';
import DeleteJobButton from '@/components/DeleteJobButton';
import { describeJobCategory } from '@/lib/serviceCatalog';
import { maskAddressForBrowsing } from '@/lib/geoUtils';
import { getServiceImage, FALLBACK_IMAGE } from '@/lib/serviceImages';
import type { Tables } from '@/integrations/supabase/types';

type DbJob = Tables<'jobs'>;

interface JobCardProps {
  job: DbJob;
  viewAs: 'customer' | 'worker';
  distanceKm?: number | null;
  showStatus?: boolean;
  allowDelete?: boolean;
  onDeleted?: (jobId: string) => void;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200' },
  in_progress: { label: 'In Progress', className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-400 border-red-200' },
};

export default function JobCard({ job, viewAs, distanceKm, showStatus, allowDelete, onDeleted }: JobCardProps) {
  const navigate = useNavigate();
  const path = viewAs === 'worker' ? `/worker/job/${job.id}` : `/customer/job/${job.id}`;
  const budget = job.budget_max || job.budget_min || 0;
  const { group, service } = describeJobCategory(job.category, job.service);
  const statusMeta = STATUS_BADGE[job.status] || { label: job.status, className: 'bg-slate-100 text-slate-700 border-slate-200' };
  const displayArea = maskAddressForBrowsing(job.location_name || '');

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-slate-900 dark:text-slate-100 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
      onClick={() => navigate(path)}
    >
      <div className="absolute right-3 top-3 z-10 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {viewAs === 'worker' && <SaveJobButton jobId={job.id} />}
        {allowDelete && <DeleteJobButton job={job} onDeleted={onDeleted} />}
      </div>

      <div className="flex items-start gap-3 mb-2.5">
        <div className="flex-1 min-w-0 pr-8">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
              {service || group}
            </span>
            {showStatus && (
              <Badge variant="outline" className={`text-[10px] font-semibold px-1.5 py-0 rounded ${statusMeta.className}`}>
                {statusMeta.label}
              </Badge>
            )}
            {distanceKm != null && (
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/50 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-blue-600" />
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m away` : `${distanceKm.toFixed(1)} km away`}
              </span>
            )}
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1">
              <Users className="h-3 w-3 text-slate-500" />
              {(job as any).bid_count ?? (job as any).bids_count ?? 0} {((job as any).bid_count ?? (job as any).bids_count ?? 0) === 1 ? 'bid' : 'bids'}
            </span>
          </div>

          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 transition-colors">
            {job.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {job.description}
          </p>

          {job.location_name && (
            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-500 font-medium">
              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate">{displayArea}</span>
            </div>
          )}
        </div>
      </div>

      {/* Job Photo: Customer uploaded OR service illustrative fallback */}
      {job.images && job.images.length > 0 ? (
        // Customer actually uploaded a problem photo — show it prominently
        <div className="relative mb-3 rounded-lg overflow-hidden aspect-[16/7] bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800">
          <img
            src={job.images[0]}
            alt={job.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-between p-2 text-white">
            <span className="text-[10px] font-semibold bg-black/50 backdrop-blur-xs px-1.5 py-0.5 rounded">
              Customer photo
            </span>
            {job.images.length > 1 && (
              <span className="text-[10px] font-semibold bg-blue-600/90 px-1.5 py-0.5 rounded">
                +{job.images.length - 1} more
              </span>
            )}
          </div>
        </div>
      ) : (
        // No customer photo — show a relevant service illustration so workers know what kind of work it is
        <div className="relative mb-3 rounded-lg overflow-hidden aspect-[16/7] bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800">
          <img
            src={getServiceImage(job.service, job.category)}
            alt={service || group}
            loading="lazy"
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
            <span className="text-[10px] font-semibold bg-amber-600/90 text-white px-1.5 py-0.5 rounded">
              Service photo (illustrative)
            </span>
          </div>
        </div>
      )}

      {/* Card Footer: Metadata and Pricing */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <div>
          <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            ₹{budget.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500 ml-1.5">
            {job.is_negotiable ? 'Negotiable' : 'Fixed'}
          </span>
        </div>

        {viewAs === 'worker' ? (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold px-2.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={(e) => {
                e.stopPropagation();
                navigate(path);
              }}
            >
              View Details
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 shadow-2xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`${path}?action=bid`);
              }}
            >
              Place Bid
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 shadow-2xs"
            onClick={(e) => {
              e.stopPropagation();
              navigate(path);
            }}
          >
            View Details
          </Button>
        )}
      </div>
    </Card>
  );
}
