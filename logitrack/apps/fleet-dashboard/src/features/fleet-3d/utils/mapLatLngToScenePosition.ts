import type { ScenePosition } from '../types/fleet3d.types';

export const TURKEY_SCENE_ORIGIN = {
  latitude: 39.9334,
  longitude: 32.8597,
};

export const DEFAULT_SCENE_SCALE = 12;
export const SCENE_POSITION_LIMIT = 52;

const regionCentroids: Record<string, { latitude: number; longitude: number }> = {
  'Ankara-Cankaya': { latitude: 39.9208, longitude: 32.8541 },
  'Istanbul-Kadikoy': { latitude: 40.9903, longitude: 29.0290 },
  'Istanbul-Sisli': { latitude: 41.0600, longitude: 28.9870 },
  'Izmir-Konak': { latitude: 38.4192, longitude: 27.1287 },
  'Bursa-Nilufer': { latitude: 40.1826, longitude: 29.0665 },
};

export function mapLatLngToScenePosition(
  latitude: number,
  longitude: number,
  y = 0,
  scale = DEFAULT_SCENE_SCALE,
): ScenePosition {
  return [
    clamp((longitude - TURKEY_SCENE_ORIGIN.longitude) * scale),
    y,
    clamp(-(latitude - TURKEY_SCENE_ORIGIN.latitude) * scale),
  ];
}

export function getRegionScenePosition(region: string, y = 0): ScenePosition {
  const centroid = regionCentroids[region] ?? fallbackRegionCentroid(region);
  return mapLatLngToScenePosition(centroid.latitude, centroid.longitude, y);
}

export function getRegionCentroid(region: string) {
  return regionCentroids[region] ?? fallbackRegionCentroid(region);
}

function fallbackRegionCentroid(region: string) {
  const hash = [...region].reduce((total, character) => total + character.charCodeAt(0), 0);
  const column = hash % 6;
  const row = Math.floor(hash / 6) % 4;

  return {
    latitude: TURKEY_SCENE_ORIGIN.latitude - 1.6 + row * 0.8,
    longitude: TURKEY_SCENE_ORIGIN.longitude + 2.6 + column * 0.7,
  };
}

function clamp(value: number) {
  return Math.max(-SCENE_POSITION_LIMIT, Math.min(SCENE_POSITION_LIMIT, value));
}
