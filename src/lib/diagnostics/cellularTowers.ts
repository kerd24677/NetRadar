import { CellularTower, TowerDistanceResult } from "@/types/fieldMap";

/**
 * Calculates straight-line distance between two GPS coordinates using the Haversine formula.
 * Returns distance in meters.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Finds and ranks cellular towers by straight-line distance from user GPS position.
 */
export function findNearestTowers(
  userLat: number,
  userLng: number,
  towers: CellularTower[],
  limit: number = 5
): TowerDistanceResult[] {
  const results: TowerDistanceResult[] = towers.map((tower) => {
    const distMeters = calculateHaversineDistance(userLat, userLng, tower.lat, tower.lng);
    return {
      tower,
      distanceMeters: distMeters,
      distanceKm: Math.round((distMeters / 1000) * 100) / 100,
    };
  });

  return results.sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, limit);
}

/**
 * Sample verified public cellular base station dataset (OpenCelliD format)
 * used for demonstration when no external API key is configured.
 */
export const SAMPLE_PUBLIC_TOWERS: CellularTower[] = [
  {
    id: "tower_sample_1",
    lat: 41.0082,
    lng: 28.9784,
    radio: "LTE",
    mcc: 286,
    mnc: 1,
    lac: 34100,
    cellId: 104521,
    rangeMeters: 1200,
    operator: "Public GSM/LTE Base",
    source: "OpenCelliD Open Database",
  },
  {
    id: "tower_sample_2",
    lat: 41.015,
    lng: 28.985,
    radio: "NR",
    mcc: 286,
    mnc: 2,
    lac: 34100,
    cellId: 108932,
    rangeMeters: 800,
    operator: "Public 5G Base",
    source: "OpenCelliD Open Database",
  },
  {
    id: "tower_sample_3",
    lat: 41.025,
    lng: 28.972,
    radio: "LTE",
    mcc: 286,
    mnc: 3,
    lac: 34100,
    cellId: 112044,
    rangeMeters: 1500,
    operator: "Public Macro Cell",
    source: "OpenCelliD Open Database",
  },
];
