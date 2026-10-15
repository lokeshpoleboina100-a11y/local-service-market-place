import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Phone,
  MessageSquare,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Radio,
  ExternalLink,
  ChevronRight,
  Loader2,
  Play,
  Check,
  Bike,
  Car,
  Footprints,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import VerifiedBadge from '@/components/VerifiedBadge';
import InteractiveMap from '@/components/InteractiveMap';
import {
  type TravelMode,
  buildGoogleMapsNavUrl,
  estimateTravelTimeMinutes,
  haversineDistanceKm,
} from '@/lib/geoUtils';

export type JourneyStatus =
  | 'assigned'
  | 'on_the_way'
  | 'arrived'
  | 'work_started'
  | 'completed'
  | 'cancelled';

export interface LocationTrackingData {
  job_id: string;
  worker_id?: string;
  customer_id?: string;
  customer_lat: number;
  customer_lng: number;
  customer_address: string;
  worker_lat?: number;
  worker_lng?: number;
  status: JourneyStatus;
  is_sharing_location: boolean;
  eta_minutes?: number | null;
  distance_km?: number | null;
  updated_at: string;
}

interface WorkerNavigationMapProps {
  jobId: string;
  mode: 'worker' | 'customer';
  currentUserId: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customerLat?: number;
  customerLng?: number;
  workerName?: string;
  workerPhone?: string;
  workerAvatar?: string;
  workerRating?: number;
  workerVerified?: boolean;
  onStatusChange?: (newStatus: JourneyStatus) => void;
  onChatClick?: () => void;
}

const JOURNEY_STEPS: { key: JourneyStatus; label: string; desc: string }[] = [
  { key: 'assigned', label: 'Assigned', desc: 'Worker confirmed' },
  { key: 'on_the_way', label: 'On the Way', desc: 'Travelling to location' },
  { key: 'arrived', label: 'Arrived', desc: 'Reached doorstep' },
  { key: 'work_started', label: 'Work Started', desc: 'Service in progress' },
  { key: 'completed', label: 'Completed', desc: 'Job finished' },
];

export default function WorkerNavigationMap({
  jobId,
  mode,
  currentUserId,
  customerName = 'Customer',
  customerPhone = '+91 98765 00000',
  customerAddress = 'Customer service location',
  customerLat = 13.0827,
  customerLng = 80.2707,
  workerName = 'Assigned Worker',
  workerPhone = '+91 98765 43210',
  workerAvatar,
  workerRating = 4.8,
  workerVerified = true,
  onStatusChange,
  onChatClick,
}: WorkerNavigationMapProps) {
  const { toast } = useToast();
  const [tracking, setTracking] = useState<LocationTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  // Poll tracking session every 4 seconds
  const fetchTrackingData = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/location?caller_id=${currentUserId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setTracking(json.data);
          setIsSharing(json.data.is_sharing_location);
        }
      } else if (res.status === 404 && mode === 'worker') {
        // Initialize tracking session if not existing yet
        const initRes = await fetch(`/api/jobs/${jobId}/location/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: 'customer',
            customer_lat: customerLat,
            customer_lng: customerLng,
            customer_address: customerAddress,
            worker_id: currentUserId,
          }),
        });
        if (initRes.ok) {
          const initJson = await initRes.json();
          setTracking(initJson.data);
        }
      }
    } catch (err) {
      // Quiet fail on network hiccup
    } finally {
      setLoading(false);
    }
  }, [jobId, currentUserId, customerLat, customerLng, customerAddress, mode]);

  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 4000);
    return () => clearInterval(interval);
  }, [fetchTrackingData]);

  // Clean up GPS watcher on unmount or completion
  useEffect(() => {
    if (tracking?.status === 'completed' || tracking?.status === 'cancelled') {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsSharing(false);
    }
  }, [tracking?.status, watchId]);

  // Worker: Start real live GPS tracking
  const toggleLocationSharing = useCallback((enable: boolean) => {
    if (!enable) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsSharing(false);
      fetch(`/api/jobs/${jobId}/location/stop-tracking?worker_id=${currentUserId}`, {
        method: 'POST',
      });
      toast({ title: 'Live Location Paused', description: 'Your GPS is no longer broadcasting.' });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation Not Supported',
        description: 'Your browser or device does not support GPS tracking.',
        variant: 'destructive',
      });
      return;
    }

    setLocationPermissionDenied(false);

    // Initial position fetch
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          await fetch(`/api/jobs/${jobId}/location/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              worker_id: currentUserId,
              worker_lat: latitude,
              worker_lng: longitude,
              is_sharing: true,
            }),
          });
          setIsSharing(true);
          toast({
            title: 'Live Location Sharing Active',
            description: 'Customer can view your real arrival route and ETA.',
          });
        } catch {
          toast({ title: 'Failed to share location', variant: 'destructive' });
        }
      },
      (err) => {
        setLocationPermissionDenied(true);
        toast({
          title: 'Location Permission Required',
          description: 'Please allow GPS location access in your browser settings.',
          variant: 'destructive',
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Continuous watch
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await fetch(`/api/jobs/${jobId}/location/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            worker_id: currentUserId,
            worker_lat: latitude,
            worker_lng: longitude,
            is_sharing: true,
          }),
        }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
    setWatchId(id);
  }, [jobId, currentUserId, watchId, toast]);

  // Update Status
  const handleAdvanceStatus = async (newStatus: JourneyStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/location/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worker_id: currentUserId,
          status: newStatus,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setTracking(json.data);
        onStatusChange?.(newStatus);
        const labels: Record<JourneyStatus, string> = {
          assigned: 'Worker Assigned',
          on_the_way: "Status updated to 'On the Way'",
          arrived: "Status updated to 'Arrived at Customer'",
          work_started: "Status updated to 'Work Started'",
          completed: "Status updated to 'Completed'",
          cancelled: 'Job Cancelled',
        };
        toast({ title: labels[newStatus] });
      }
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const [travelMode, setTravelMode] = useState<TravelMode>('two-wheeler');

  // Open Google Maps turn-by-turn navigation with full origin & destination
  const handleOpenGoogleMaps = () => {
    const cLat = tracking?.customer_lat || customerLat;
    const cLng = tracking?.customer_lng || customerLng;
    const wLat = tracking?.worker_lat;
    const wLng = tracking?.worker_lng;
    const url = buildGoogleMapsNavUrl({
      workerLat: wLat,
      workerLng: wLng,
      customerLat: cLat,
      customerLng: cLng,
      mode: travelMode,
    });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentStatus = tracking?.status || 'assigned';
  const currentStepIndex = JOURNEY_STEPS.findIndex((s) => s.key === currentStatus);
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0;

  const activeCustomerLat = tracking?.customer_lat || customerLat;
  const activeCustomerLng = tracking?.customer_lng || customerLng;
  const activeWorkerLat = tracking?.worker_lat;
  const activeWorkerLng = tracking?.worker_lng;

  // Real remaining distance and ETA
  const liveDistanceKm =
    activeWorkerLat && activeWorkerLng && activeCustomerLat && activeCustomerLng
      ? haversineDistanceKm(activeWorkerLat, activeWorkerLng, activeCustomerLat, activeCustomerLng)
      : tracking?.distance_km;

  const liveEtaMinutes =
    liveDistanceKm != null
      ? estimateTravelTimeMinutes(liveDistanceKm, travelMode)
      : tracking?.eta_minutes;

  return (
    <Card className="p-4 space-y-4 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden relative">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
            <Navigation className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Live Worker Journey & Navigation
              {isSharing && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live GPS
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500">
              {mode === 'worker' ? 'Turn-by-turn navigation & route updates' : 'Real-time worker travel updates'}
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider text-blue-600 border-blue-200">
          {JOURNEY_STEPS[activeStep]?.label}
        </Badge>
      </div>

      {/* Progress Stepper */}
      <div className="py-2">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-800 -z-0" />
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-blue-600 transition-all duration-500 -z-0"
            style={{ width: `${(activeStep / (JOURNEY_STEPS.length - 1)) * 100}%` }}
          />
          {JOURNEY_STEPS.map((step, idx) => {
            const isCompleted = idx < activeStep;
            const isCurrent = idx === activeStep;
            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50 scale-110'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <span
                  className={`text-[10px] mt-1.5 font-medium text-center hidden sm:block ${
                    isCurrent ? 'text-blue-600 font-bold' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-center font-semibold text-blue-600 mt-2">
          {JOURNEY_STEPS[activeStep]?.label}: {JOURNEY_STEPS[activeStep]?.desc}
        </p>
      </div>

      {/* Travel Mode Selector Tabs */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Travel Mode:
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTravelMode('two-wheeler')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              travelMode === 'two-wheeler'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bike className="h-3.5 w-3.5" />
            Two-Wheeler
          </button>
          <button
            type="button"
            onClick={() => setTravelMode('driving')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              travelMode === 'driving'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            Driving
          </button>
          <button
            type="button"
            onClick={() => setTravelMode('walking')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              travelMode === 'walking'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Footprints className="h-3.5 w-3.5" />
            Walking
          </button>
        </div>
      </div>

      {/* Interactive Map Visual */}
      <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <InteractiveMap
          mode="route"
          customerLat={activeCustomerLat}
          customerLng={activeCustomerLng}
          customerAddress={customerAddress}
          workerLat={activeWorkerLat}
          workerLng={activeWorkerLng}
          workerName={workerName}
          height={260}
          className="border-0 rounded-none"
        />

        {/* Floating live distance overlay */}
        <div className="absolute top-2 left-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 shadow-md flex items-center gap-2 z-[400]">
          <Radio className={`h-3.5 w-3.5 ${isSharing ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider leading-none">
              {isSharing ? 'Live ETA' : 'Estimated Travel'}
            </p>
            <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              {liveEtaMinutes ? `~${liveEtaMinutes} mins` : '15–20 mins'}
              {liveDistanceKm != null && (
                <span className="text-slate-400 font-normal ml-1">
                  ({liveDistanceKm} km)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Destination Pin marker chip */}
        <div className="absolute bottom-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 shadow-md text-[11px] font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1 z-[400]">
          <MapPin className="h-3 w-3 text-red-500 fill-red-500" />
          <span className="truncate max-w-[150px]">{customerAddress}</span>
        </div>
      </div>

      {/* Customer Address Details */}
      <div className="flex items-start gap-2.5 text-xs">
        <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 dark:text-slate-100">Service Address</p>
          <p className="text-slate-500 truncate">{customerAddress}</p>
        </div>
      </div>

      {/* ── WORKER VIEW ACTIONS ── */}
      {mode === 'worker' && (
        <div className="space-y-3 pt-1">
          {/* Main Navigation CTA */}
          <Button
            size="lg"
            className="w-full h-13 text-sm font-bold rounded-xl gap-2 shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleOpenGoogleMaps}
          >
            <Navigation className="h-5 w-5" />
            Navigate to Customer (Google Maps)
            <ExternalLink className="h-4 w-4 ml-auto opacity-70" />
          </Button>

          {/* Live Location Sharing Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Compass className="h-4 w-4 text-primary" />
                Share Live GPS Location
              </p>
              <p className="text-[11px] text-muted-foreground">
                Broadcasts your arrival location in real-time to the customer.
              </p>
            </div>
            <Switch
              checked={isSharing}
              onCheckedChange={toggleLocationSharing}
              disabled={currentStatus === 'completed' || currentStatus === 'cancelled'}
            />
          </div>

          {locationPermissionDenied && (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Location access was denied. Please allow location permissions in your browser.</span>
            </div>
          )}

          {/* Status Progression Controls */}
          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Update Job Journey
            </p>
            <div className="grid grid-cols-2 gap-2">
              {currentStatus === 'assigned' && (
                <Button
                  variant="default"
                  className="w-full rounded-xl col-span-2 h-11 font-bold gap-1.5"
                  disabled={updatingStatus}
                  onClick={() => handleAdvanceStatus('on_the_way')}
                >
                  <Navigation className="h-4 w-4" />
                  Mark "On the Way"
                </Button>
              )}

              {currentStatus === 'on_the_way' && (
                <Button
                  variant="default"
                  className="w-full rounded-xl col-span-2 h-11 font-bold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={updatingStatus}
                  onClick={() => handleAdvanceStatus('arrived')}
                >
                  <MapPin className="h-4 w-4" />
                  Mark "Arrived at Doorstep"
                </Button>
              )}

              {currentStatus === 'arrived' && (
                <Button
                  variant="default"
                  className="w-full rounded-xl col-span-2 h-11 font-bold gap-1.5"
                  disabled={updatingStatus}
                  onClick={() => handleAdvanceStatus('work_started')}
                >
                  <Play className="h-4 w-4" />
                  Start Work
                </Button>
              )}

              {currentStatus === 'work_started' && (
                <Button
                  variant="default"
                  className="w-full rounded-xl col-span-2 h-11 font-bold gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                  disabled={updatingStatus}
                  onClick={() => handleAdvanceStatus('completed')}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Work Completed
                </Button>
              )}

              {currentStatus === 'completed' && (
                <div className="col-span-2 text-center py-2 text-green-600 font-bold text-sm flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-5 w-5" />
                  Job successfully completed!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOMER VIEW DETAILS ── */}
      {mode === 'customer' && (
        <div className="space-y-3 pt-1">
          {/* Worker Profile Card */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border border-primary/20">
                <AvatarImage src={workerAvatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {workerName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm flex items-center gap-1.5">
                  {workerName}
                  {workerVerified && <VerifiedBadge showLabel={false} />}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  ⭐ {workerRating} • Assigned Professional
                </p>
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-9 p-0 rounded-xl"
                onClick={() => window.open(`tel:${workerPhone}`)}
                title="Call worker"
              >
                <Phone className="h-4 w-4 text-primary" />
              </Button>
              <Button
                size="sm"
                className="h-9 px-3 rounded-xl gap-1 text-xs font-bold"
                onClick={onChatClick}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </Button>
            </div>
          </div>

          {/* Real Live Tracking status banner */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span>Real Live Tracking Enabled</span>
            </div>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              {isSharing
                ? 'Your worker is actively sharing their real GPS location. The estimated arrival time updates live as they travel.'
                : 'Worker location sharing activates when the worker marks "On the Way" and enables GPS broadcasting.'}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
