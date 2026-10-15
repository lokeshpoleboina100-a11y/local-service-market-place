import React from 'react';
import { Star, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export interface ConsistentWorkerProps {
  id: string;
  name: string;
  avatar?: string;
  service: string;
  rating: number;
  totalReviews: number;
  completedJobs?: number;
  experienceYears?: number;
  distanceKm?: number | null;
  isVerified: boolean;
  skills?: string[];
  onViewProfile?: () => void;
  onBookDirectly?: () => void;
}

export default function ConsistentWorkerCard({
  id,
  name,
  avatar,
  service,
  rating,
  totalReviews,
  completedJobs = 45,
  experienceYears = 3,
  distanceKm,
  isVerified,
  skills = [],
  onViewProfile,
  onBookDirectly,
}: ConsistentWorkerProps) {
  const navigate = useNavigate();

  return (
    <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-3 mb-2.5">
          <Avatar className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
            <AvatarImage src={avatar || ''} className="object-cover" />
            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-blue-600 font-bold text-xs rounded-lg">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {name}
              </h4>
              {isVerified && (
                <span title="Aadhaar ID Verified" className="text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 truncate">{service}</p>

            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-0.5 font-bold text-amber-600">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {rating.toFixed(1)}
              </span>
              <span className="text-slate-400">({totalReviews})</span>
              <span className="text-slate-400">•</span>
              <span>{completedJobs} jobs</span>
            </div>
          </div>
        </div>

        {/* Proximity / Experience */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>{experienceYears} yrs experience</span>
          {distanceKm != null ? (
            <span className="flex items-center gap-0.5 text-blue-600 font-medium">
              <MapPin className="h-3 w-3" /> {distanceKm} km away
            </span>
          ) : (
            <span className="text-emerald-600 font-medium">Available</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 rounded-lg text-xs font-semibold border-slate-200 dark:border-slate-800"
          onClick={onViewProfile || (() => navigate(`/customer/chats`))}
        >
          View Profile
        </Button>
        {onBookDirectly ? (
          <Button
            size="sm"
            className="flex-1 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            onClick={onBookDirectly}
          >
            Select
          </Button>
        ) : null}
      </div>
    </div>
  );
}
