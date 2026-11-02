import { Asset, AssetField, MediaType, Query, requestPermissionsAsync } from 'expo-media-library';

import type { GeoPoint } from './types';

export type ScanProgress = { scanned: number; located: number; done: boolean };

const PAGE = 500;
const CONCURRENCY = 8;

/** Timestamps from the library may be seconds or ms depending on the call; normalize to ms. */
const toMs = (t: number | null) => (t == null ? undefined : t < 1e12 ? t * 1000 : t);

export async function ensurePhotoPermission() {
  const res = await requestPermissionsAsync(false, ['photo']);
  return { granted: res.granted, limited: res.accessPrivileges === 'limited' };
}

/**
 * Walk the camera roll newest-first and return every photo that has a GPS location.
 * Calls onProgress as it goes. Set signal.cancelled = true to stop early.
 */
export async function scanPhotoLocations(
  onProgress: (p: ScanProgress) => void,
  signal: { cancelled: boolean } = { cancelled: false },
): Promise<GeoPoint[]> {
  const points: GeoPoint[] = [];
  let scanned = 0;

  for (let offset = 0; !signal.cancelled; offset += PAGE) {
    const page = await new Query()
      .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
      .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
      .limit(PAGE)
      .offset(offset)
      .exeForMetadata();
    if (page.length === 0) break;

    for (let i = 0; i < page.length && !signal.cancelled; i += CONCURRENCY) {
      const batch = page.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map(async (meta) => {
          try {
            const loc = await new Asset(meta.id).getLocation();
            return loc ? { lat: loc.latitude, lon: loc.longitude, time: toMs(meta.creationTime), sourceId: meta.id } : null;
          } catch {
            return null;
          }
        }),
      );
      for (const r of results) if (r) points.push(r);
      scanned += batch.length;
      onProgress({ scanned, located: points.length, done: false });
    }
    if (page.length < PAGE) break;
  }

  onProgress({ scanned, located: points.length, done: true });
  return points;
}

export async function photoUri(assetId: string) {
  try {
    return await new Asset(assetId).getUri();
  } catch {
    return null;
  }
}
