/**
 * Hyperlocal Geolocation & Navigation Utilities for NearWork
 */

export type TravelMode = 'two-wheeler' | 'driving' | 'walking';

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === 0 || lon1 === 0 || lat2 === 0 || lon2 === 0) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Estimates realistic travel time in minutes based on distance and travel mode.
 * Calibrated for realistic urban traffic conditions.
 */
export function estimateTravelTimeMinutes(
  distanceKm: number,
  mode: TravelMode = 'two-wheeler'
): number {
  if (distanceKm <= 0) return 1;

  switch (mode) {
    case 'two-wheeler': {
      // Average 30-35 km/h in city traffic, + 2 mins buffer for signals/traffic
      const minutes = (distanceKm / 30) * 60 + 2;
      return Math.max(2, Math.round(minutes));
    }
    case 'driving': {
      // Average 22-25 km/h in city traffic with turns and delays, + 4 mins buffer
      const minutes = (distanceKm / 24) * 60 + 4;
      return Math.max(3, Math.round(minutes));
    }
    case 'walking': {
      // Average 4.5 km/h
      const minutes = (distanceKm / 4.5) * 60;
      return Math.max(1, Math.round(minutes));
    }
  }
}

/**
 * Builds the standard official Google Maps Navigation URL.
 * Automatically supports Driving, Two-Wheeler, and Walking modes.
 * Launches native Google Maps app on mobile or turn-by-turn navigation in browser.
 */
export function buildGoogleMapsNavUrl({
  workerLat,
  workerLng,
  customerLat,
  customerLng,
  mode = 'two-wheeler',
}: {
  workerLat?: number | null;
  workerLng?: number | null;
  customerLat: number;
  customerLng: number;
  mode?: TravelMode;
}): string {
  const hasOrigin =
    workerLat != null &&
    workerLng != null &&
    workerLat !== 0 &&
    workerLng !== 0;

  // Google Maps navigation mode mapping
  // Note: 'two-wheeler' is supported on Google Maps app in India. 'driving' as fallback.
  const gMode =
    mode === 'two-wheeler'
      ? 'two-wheeler'
      : mode === 'walking'
      ? 'walking'
      : 'driving';

  if (hasOrigin) {
    return `https://www.google.com/maps/dir/?api=1&origin=${workerLat},${workerLng}&destination=${customerLat},${customerLng}&travelmode=${gMode}&dir_action=navigate`;
  }

  // Fallback if origin coordinates are unavailable: navigate directly to destination
  return `https://www.google.com/maps/dir/?api=1&destination=${customerLat},${customerLng}&travelmode=${gMode}&dir_action=navigate`;
}

/**
 * Privacy Protection: Mask exact house/flat/door number before a job is accepted or assigned.
 * E.g., "Flat 402, Sri Sai Towers, Road No 36, Jubilee Hills, Hyderabad" -> "Jubilee Hills, Hyderabad"
 */
export function maskAddressForBrowsing(fullAddress: string): string {
  if (!fullAddress || fullAddress.trim() === '') return 'Customer Location';

  const parts = fullAddress.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 2) return fullAddress;

  // If there are multiple parts (door no, apartment, street, area, city),
  // return only the area, locality and city/state
  const generalParts = parts.slice(Math.max(1, parts.length - 3));
  return generalParts.join(', ');
}
