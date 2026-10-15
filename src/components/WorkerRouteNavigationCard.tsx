import React, { useState, useEffect, useCallback } from 'react';
import {
  Navigation,
  MapPin,
  ExternalLink,
  Locate,
  AlertCircle,
  Bike,
  Car,
  Footprints,
  Compass,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import InteractiveMap from '@/components/InteractiveMap';
import {
  type TravelMode,
  haversineDistanceKm,
  estimateTravelTimeMinutes,
  buildGoogleMapsNavUrl,
  maskAddressForBrowsing,
} from '@/lib/geoUtils';

interface WorkerRouteNavigationCardProps {
  customerLat: number;
  customerLng: number;
  customerAddress?: string;
  isAssignedToMe?: boolean;
  jobId?: string;
  onOpenLiveTracking?: () => void;
  defaultWorkerLat?: number;
  defaultWorkerLng?: number;
}

export default function WorkerRouteNavigationCard({
  customerLat,
  customerLng,
  customerAddress = 'Customer Service Location',
  isAssignedToMe = false,
  jobId,
  onOpenLiveTracking,
  defaultWorkerLat,
  defaultWorkerLng,
}: WorkerRouteNavigationCardProps) {
  const [workerLat, setWorkerLat] = useState<number | null>(defaultWorkerLat ?? null);
  const [workerLng, setWorkerLng] = useState<number | null>(defaultWorkerLng ?? null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsPermissionDenied, setGpsPermissionDenied] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('two-wheeler');
  const [watchId, setWatchId] = useState<number | null>(null);

  // Request high-accuracy device GPS on mount
  const requestWorkerLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsLoading(false);
      return;
    }

    setGpsLoading(true);
    setGpsPermissionDenied(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setWorkerLat(pos.coords.latitude);
        setWorkerLng(pos.coords.longitude);
        setGpsLoading(false);
      },
      (err) => {
        console.warn('Worker GPS error:', err.message);
        setGpsPermissionDenied(true);
        setGpsLoading(false);
        // Fall back to default profile coordinates if available
        if (defaultWorkerLat && defaultWorkerLng) {
          setWorkerLat(defaultWorkerLat);
          setWorkerLng(defaultWorkerLng);
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 }
    );

    // Watch position for continuous updates as the worker travels
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setWorkerLat(pos.coords.latitude);
        setWorkerLng(pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
    setWatchId(id);
  }, [defaultWorkerLat, defaultWorkerLng]);

  useEffect(() => {
    requestWorkerLocation();
    return () => {
      if (watchId !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Distance & ETA calculation
  const distanceKm =
    workerLat != null && workerLng != null && customerLat && customerLng
      ? haversineDistanceKm(workerLat, workerLng, customerLat, customerLng)
      : null;

  const etaMinutes = distanceKm != null ? estimateTravelTimeMinutes(distanceKm, travelMode) : null;

  // Open Google Maps Navigation
  const handleOpenGoogleMaps = () => {
    const url = buildGoogleMapsNavUrl({
      workerLat,
      workerLng,
      customerLat,
      customerLng,
      mode: travelMode,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const displayAddress = isAssignedToMe
    ? customerAddress
    : maskAddressForBrowsing(customerAddress);

  return (
    <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 flex items-center justify-center shrink-0">
            <Navigation className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Service Route & Navigation
              {workerLat && workerLng && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  GPS Active
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500">
              Turn-by-turn Google Maps navigation to customer location
            </p>
          </div>
        </div>

        {distanceKm != null ? (
          <div className="text-right">
            <span className="text-base font-extrabold text-blue-600 tracking-tight">
              {distanceKm} km
            </span>
            <p className="text-[10px] text-slate-400 font-medium">road distance</p>
          </div>
        ) : (
          <Badge variant="outline" className="text-[11px] text-slate-500">
            {gpsLoading ? 'Locating...' : 'Distance unavailable'}
          </Badge>
        )}
      </div>

      {/* Travel Mode Selector Tabs */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Travel Mode:
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTravelMode('two-wheeler')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              travelMode === 'two-wheeler'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <Bike className="h-3.5 w-3.5" />
            Two-Wheeler
          </button>
          <button
            type="button"
            onClick={() => setTravelMode('driving')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              travelMode === 'driving'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            Driving
          </button>
          <button
            type="button"
            onClick={() => setTravelMode('walking')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              travelMode === 'walking'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <Footprints className="h-3.5 w-3.5" />
            Walking
          </button>
        </div>
      </div>

      {/* Interactive OpenStreetMap / Leaflet Route Map */}
      <div className="relative">
        <InteractiveMap
          mode="route"
          customerLat={customerLat}
          customerLng={customerLng}
          customerAddress={displayAddress}
          workerLat={workerLat}
          workerLng={workerLng}
          workerName="Your Live Location"
          height={260}
          className="border-0 rounded-none"
        />

        {/* Floating ETA & Distance Chip */}
        {etaMinutes != null && (
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 shadow-md flex items-center gap-2.5 z-[400]">
            <div className="h-7 w-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                Est. Travel Time
              </p>
              <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 leading-none">
                ~{etaMinutes} mins
                <span className="text-slate-400 font-normal ml-1">({distanceKm} km)</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Destination Address & Details */}
      <div className="p-4 space-y-3.5">
        <div className="flex items-start gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Customer Destination
              </p>
              {isAssignedToMe ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" /> Exact Address Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                  <Lock className="h-2.5 w-2.5" /> Approx. Area
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              {displayAddress}
            </p>
            {!isAssignedToMe && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                Exact house number & landmarks will be unlocked once customer assigns the job to you.
              </p>
            )}
          </div>
        </div>

        {/* GPS Permission Warning if Denied */}
        {gpsPermissionDenied && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Location permission is off. Google Maps will open directly with destination.</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-[11px] font-semibold border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0"
              onClick={requestWorkerLocation}
            >
              <Locate className="h-3 w-3 mr-1" /> Retry GPS
            </Button>
          </div>
        )}

        {/* Main Prominent Navigation Button (Optimized for bike mount tap) */}
        <div className="space-y-2">
          <Button
            type="button"
            size="lg"
            onClick={handleOpenGoogleMaps}
            className="w-full h-13 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5"
          >
            <Navigation className="h-5 w-5 fill-white/20" />
            <span>Navigate to Customer (Google Maps)</span>
            <ExternalLink className="h-4 w-4 opacity-75 ml-1" />
          </Button>

          {/* If assigned, offer direct live tracking page link */}
          {isAssignedToMe && jobId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-9 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold gap-1.5"
              onClick={onOpenLiveTracking}
            >
              <Compass className="h-3.5 w-3.5" />
              Open Live Journey Tracking & Status Updates
              <ArrowUpRight className="h-3.5 w-3.5 ml-auto" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
