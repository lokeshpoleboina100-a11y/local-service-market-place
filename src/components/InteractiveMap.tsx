import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Locate, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    L?: any;
  }
}

export interface InteractiveMapProps {
  mode: 'route' | 'picker';
  // Customer destination
  customerLat: number;
  customerLng: number;
  customerAddress?: string;
  // Worker live coordinates (for route mode)
  workerLat?: number | null;
  workerLng?: number | null;
  workerName?: string;
  // Picker callbacks
  onLocationChange?: (lat: number, lng: number) => void;
  draggable?: boolean;
  height?: string | number;
  className?: string;
  interactive?: boolean;
}

export default function InteractiveMap({
  mode = 'route',
  customerLat,
  customerLng,
  customerAddress = 'Service Location',
  workerLat,
  workerLng,
  workerName = 'You (Worker)',
  onLocationChange,
  draggable = false,
  height = 280,
  className = '',
  interactive = true,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const workerMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState<boolean>(() => typeof window !== 'undefined' && !!window.L);

  // Poll / wait for Leaflet script if loading from index.html CDN
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    const interval = setInterval(() => {
      if (window.L) {
        setLeafletLoaded(true);
        clearInterval(interval);
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Initialize and update Leaflet map
  useEffect(() => {
    if (!leafletLoaded || !containerRef.current || !window.L) return;

    const L = window.L;

    // Center point
    const hasWorker = workerLat != null && workerLng != null && workerLat !== 0 && workerLng !== 0;
    const centerLat = customerLat || (hasWorker ? workerLat! : 13.0827);
    const centerLng = customerLng || (hasWorker ? workerLng! : 80.2707);

    // If map not created yet, create it
    if (!mapInstanceRef.current) {
      const map = L.map(containerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
      });

      // OpenStreetMap high-contrast clean tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Click on map to place pin if in picker mode
      if (mode === 'picker') {
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          if (customerMarkerRef.current) {
            customerMarkerRef.current.setLatLng([lat, lng]);
          }
          onLocationChange?.(lat, lng);
        });
      }
    }

    const map = mapInstanceRef.current;

    // ── 1. CUSTOMER DESTINATION MARKER (Red Pin) ──
    const customerIcon = L.divIcon({
      className: 'custom-customer-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="width: 32px; height: 32px; border-radius: 9999px; background-color: #EF4444; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(239,68,68,0.45); display: flex; align-items: center; justify-content: center; color: white;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #EF4444; margin-top: -2px;"></div>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
    });

    if (customerLat && customerLng) {
      if (!customerMarkerRef.current) {
        const marker = L.marker([customerLat, customerLng], {
          icon: customerIcon,
          draggable: mode === 'picker' && draggable,
        }).addTo(map);

        if (mode === 'picker' && draggable) {
          marker.on('dragend', (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            onLocationChange?.(lat, lng);
          });
        }

        marker.bindPopup(`<b>Destination</b><br/>${customerAddress}`);
        customerMarkerRef.current = marker;
      } else {
        customerMarkerRef.current.setLatLng([customerLat, customerLng]);
        customerMarkerRef.current.getPopup()?.setContent(`<b>Destination</b><br/>${customerAddress}`);
      }
    }

    // ── 2. WORKER LIVE GPS MARKER (Royal Blue Pulsing Pin) ──
    if (mode === 'route' && hasWorker) {
      const workerIcon = L.divIcon({
        className: 'custom-worker-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transform: translate(-50%, -50%);">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; background-color: rgba(37, 99, 235, 0.28); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 22px; height: 22px; border-radius: 9999px; background-color: #2563EB; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 8px rgba(37,99,235,0.45); display: flex; align-items: center; justify-content: center; color: white;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      if (!workerMarkerRef.current) {
        const marker = L.marker([workerLat!, workerLng!], { icon: workerIcon }).addTo(map);
        marker.bindPopup(`<b>${workerName}</b><br/>Live GPS Position`);
        workerMarkerRef.current = marker;
      } else {
        workerMarkerRef.current.setLatLng([workerLat!, workerLng!]);
      }

      // ── 3. ROUTE POLYLINE ──
      const latlngs = [
        [workerLat!, workerLng!],
        [customerLat, customerLng],
      ];

      if (!routeLineRef.current) {
        const polyline = L.polyline(latlngs, {
          color: '#2563EB',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8',
          lineCap: 'round',
        }).addTo(map);
        routeLineRef.current = polyline;
      } else {
        routeLineRef.current.setLatLngs(latlngs);
      }

      // Auto-fit bounds so both worker and customer are clearly visible
      try {
        const bounds = L.latLngBounds([
          [workerLat!, workerLng!],
          [customerLat, customerLng],
        ]);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16,
          animate: true,
        });
      } catch {}
    } else if (customerLat && customerLng) {
      map.setView([customerLat, customerLng], 15);
    }
  }, [
    leafletLoaded,
    customerLat,
    customerLng,
    customerAddress,
    workerLat,
    workerLng,
    workerName,
    mode,
    draggable,
    interactive,
    onLocationChange,
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        customerMarkerRef.current = null;
        workerMarkerRef.current = null;
        routeLineRef.current = null;
      }
    };
  }, []);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleCenterWorker = () => {
    if (workerLat && workerLng && mapInstanceRef.current) {
      mapInstanceRef.current.setView([workerLat, workerLng], 16, { animate: true });
    }
  };

  const handleCenterCustomer = () => {
    if (customerLat && customerLng && mapInstanceRef.current) {
      mapInstanceRef.current.setView([customerLat, customerLng], 16, { animate: true });
    }
  };

  const handleFitAll = () => {
    if (mapInstanceRef.current && window.L && customerLat && customerLng) {
      if (workerLat && workerLng) {
        const bounds = window.L.latLngBounds([
          [workerLat, workerLng],
          [customerLat, customerLng],
        ]);
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
      } else {
        mapInstanceRef.current.setView([customerLat, customerLng], 15, { animate: true });
      }
    }
  };

  // Fallback if Leaflet CDN is not available yet
  if (!leafletLoaded) {
    const hasWorker = workerLat != null && workerLng != null && workerLat !== 0;
    const lat = customerLat || 13.0827;
    const lng = customerLng || 80.2707;
    const bboxMinLng = lng - 0.015;
    const bboxMinLat = lat - 0.015;
    const bboxMaxLng = lng + 0.015;
    const bboxMaxLat = lat + 0.015;

    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 ${className}`}
        style={{ height }}
      >
        <iframe
          title="Interactive Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bboxMinLng}%2C${bboxMinLat}%2C${bboxMaxLng}%2C${bboxMaxLat}&layer=mapnik&marker=${lat}%2C${lng}`}
          className="w-full h-full opacity-95"
        />
        <div className="absolute top-2 left-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 shadow-sm flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-red-500" />
          <span>{customerAddress}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 ${className}`}
      style={{ height }}
    >
      {/* Map container DOM element */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Map Interactive Overlay Controls */}
      <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-[400]">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-lg bg-white/95 dark:bg-slate-900/95 shadow-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200"
          onClick={handleZoomIn}
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-lg bg-white/95 dark:bg-slate-900/95 shadow-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200"
          onClick={handleZoomOut}
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="h-8 w-8 rounded-lg bg-white/95 dark:bg-slate-900/95 shadow-sm border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200"
          onClick={handleFitAll}
          title="Fit view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Recenter shortcuts for route mode */}
      {mode === 'route' && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-[400]">
          {workerLat && workerLng && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-7 text-[10px] font-semibold rounded-lg bg-white/95 dark:bg-slate-900/95 shadow-xs border border-slate-200 dark:border-slate-800 text-blue-600 gap-1 px-2"
              onClick={handleCenterWorker}
            >
              <Navigation className="h-3 w-3" />
              My Location
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 text-[10px] font-semibold rounded-lg bg-white/95 dark:bg-slate-900/95 shadow-xs border border-slate-200 dark:border-slate-800 text-red-600 gap-1 px-2"
            onClick={handleCenterCustomer}
          >
            <MapPin className="h-3 w-3" />
            Customer Pin
          </Button>
        </div>
      )}

      {/* Picker guidance banner */}
      {mode === 'picker' && (
        <div className="absolute bottom-2 left-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 shadow-sm flex items-center justify-between z-[400]">
          <span className="flex items-center gap-1.5">
            <Locate className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            Drag red marker or click anywhere to pinpoint doorstep
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {customerLat.toFixed(4)}, {customerLng.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
}
