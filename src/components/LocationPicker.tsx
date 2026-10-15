import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin,
  Crosshair,
  Loader2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import InteractiveMap from '@/components/InteractiveMap';
import { useTranslation } from 'react-i18next';

interface LocationPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string;
  onLocationChange?: (lat: number, lng: number, name: string) => void;
  readonly?: boolean;
}

interface GeocodeSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationPicker({
  latitude,
  longitude,
  locationName,
  onLocationChange,
  readonly = false,
}: LocationPickerProps) {
  const { t } = useTranslation();
  const [lat, setLat] = useState<number>(latitude || 13.0827);
  const [lng, setLng] = useState<number>(longitude || 80.2707);
  const [name, setName] = useState<string>(locationName || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [loadingGps, setLoadingGps] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (latitude && longitude) {
      setLat(latitude);
      setLng(longitude);
    }
    if (locationName) {
      setName(locationName);
    }
  }, [latitude, longitude, locationName]);

  // Reverse geocode given coordinates to human readable address
  const reverseGeocode = useCallback(
    async (targetLat: number, targetLng: number) => {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${targetLat}&lon=${targetLng}&format=json`
        );
        const data = await resp.json();
        let formatted = '';
        if (data.address) {
          const parts = [
            data.address.house_number,
            data.address.road || data.address.pedestrian,
            data.address.suburb || data.address.neighbourhood || data.address.city_district,
            data.address.city || data.address.town || data.address.county,
            data.address.state,
          ].filter(Boolean);
          formatted = parts.join(', ');
        }
        if (!formatted && data.display_name) {
          formatted = data.display_name.split(',').slice(0, 4).join(', ');
        }
        if (!formatted) {
          formatted = `${targetLat.toFixed(4)}, ${targetLng.toFixed(4)}`;
        }
        setName(formatted);
        onLocationChange?.(targetLat, targetLng, formatted);
      } catch {
        const fallback = `${targetLat.toFixed(4)}, ${targetLng.toFixed(4)}`;
        setName(fallback);
        onLocationChange?.(targetLat, targetLng, fallback);
      }
    },
    [onLocationChange]
  );

  // 1. Get browser device GPS location
  const getCurrentLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoadingGps(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newLat = pos.coords.latitude;
        const newLng = pos.coords.longitude;
        setLat(newLat);
        setLng(newLng);
        await reverseGeocode(newLat, newLng);
        setLoadingGps(false);
      },
      (err) => {
        setError(`Location access error: ${err.message}. You can search for your area below.`);
        setLoadingGps(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
  }, [reverseGeocode]);

  // 2. Search locality/address autocomplete via Nominatim
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            val
          )}&format=json&limit=5&countrycodes=in`
        );
        const data = await res.json();
        setSuggestions(data || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 450);
  };

  const handleSelectSuggestion = (item: GeocodeSuggestion) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);
    setLat(newLat);
    setLng(newLng);
    setName(item.display_name);
    setSearchQuery('');
    setSuggestions([]);
    onLocationChange?.(newLat, newLng, item.display_name);
  };

  // 3. User moved pin or clicked map
  const handleMapPinMove = async (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    await reverseGeocode(newLat, newLng);
  };

  return (
    <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-slate-900">
      {/* Search & Actions Bar */}
      {!readonly && (
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search area, landmark, or street name..."
                className="pl-9 pr-8 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={loadingGps}
              className="h-9 px-3 rounded-xl border-blue-200 dark:border-blue-900 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs font-semibold shrink-0 gap-1.5"
            >
              {loadingGps ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Crosshair className="h-3.5 w-3.5" />
              )}
              <span>GPS Current</span>
            </Button>
          </div>

          {/* Autocomplete Suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {suggestions.map((item) => (
                <button
                  key={item.place_id}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-start gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-700 dark:text-slate-200 line-clamp-2">
                    {item.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {searching && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pl-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Searching locations in India...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Interactive Map with draggable marker */}
      <div className="relative">
        <InteractiveMap
          mode="picker"
          customerLat={lat}
          customerLng={lng}
          customerAddress={name || 'Selected Pin Location'}
          draggable={!readonly}
          interactive={!readonly}
          onLocationChange={handleMapPinMove}
          height={240}
          className="border-0 rounded-none"
        />
      </div>

      {/* Formatted Address display & manual edit */}
      <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
            Selected Job Location
          </span>
          <span className="text-[10px] font-mono font-medium text-slate-400">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </span>
        </div>

        <Input
          value={name}
          onChange={(e) => {
            const val = e.target.value;
            setName(val);
            onLocationChange?.(lat, lng, val);
          }}
          disabled={readonly}
          placeholder="Flat / House No., Building Name, Street, Locality"
          className="h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        />
        <p className="text-[10px] text-slate-400">
          Workers will receive turn-by-turn navigation directly to these coordinates.
        </p>
      </div>
    </Card>
  );
}
