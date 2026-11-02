import type { GeoPoint, Peak, SummitCandidate } from './types';

const EARTH_RADIUS_M = 6_371_000;

export function distanceM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export type DetectOptions = {
  /** Max distance from the summit point that counts. */
  radiusM: number;
  /** Distance under which a match is high confidence. */
  highConfidenceM: number;
  /** Extra radius for peaks whose coordinates are unverified. */
  approxPaddingM: number;
};

/** Photos are often taken a few steps off the true summit, so they get a wider radius. */
export const PHOTO_OPTIONS: DetectOptions = { radiusM: 120, highConfidenceM: 50, approxPaddingM: 200 };
/** Recorded tracks pass close to the top if you actually summited. */
export const TRACK_OPTIONS: DetectOptions = { radiusM: 50, highConfidenceM: 25, approxPaddingM: 200 };

/** Local calendar day for a timestamp. */
export function localDay(time: number) {
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Grid index over peaks so each point only checks nearby peaks.
 * Cells are ~0.02 degrees (~2 km), larger than any search radius.
 */
const CELL_DEG = 0.02;
const cellKey = (lat: number, lon: number) =>
  `${Math.floor(lat / CELL_DEG)}:${Math.floor(lon / CELL_DEG)}`;

export function buildPeakIndex(peaks: Peak[]) {
  const grid = new Map<string, Peak[]>();
  for (const p of peaks) {
    const k = cellKey(p.lat, p.lon);
    const bucket = grid.get(k);
    if (bucket) bucket.push(p);
    else grid.set(k, [p]);
  }
  return {
    nearby(lat: number, lon: number): Peak[] {
      const r = Math.floor(lat / CELL_DEG);
      const c = Math.floor(lon / CELL_DEG);
      const out: Peak[] = [];
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const b = grid.get(`${r + dr}:${c + dc}`);
          if (b) out.push(...b);
        }
      return out;
    },
  };
}

/**
 * Match located points (photos or track points) to summits.
 * Returns one candidate per peak per day, sorted newest first.
 * Each point counts toward its closest peak only, so a photo between
 * Grays and Torreys is not credited to both.
 */
export function detectSummits(
  points: GeoPoint[],
  peaks: Peak[],
  opts: DetectOptions,
  index = buildPeakIndex(peaks),
): SummitCandidate[] {
  const byKey = new Map<string, SummitCandidate>();

  for (const pt of points) {
    if (!Number.isFinite(pt.lat) || !Number.isFinite(pt.lon)) continue;
    if (pt.lat === 0 && pt.lon === 0) continue; // common "no location" placeholder

    let best: { peak: Peak; d: number } | null = null;
    for (const peak of index.nearby(pt.lat, pt.lon)) {
      const limit = opts.radiusM + (peak.approx ? opts.approxPaddingM : 0);
      const d = distanceM(pt.lat, pt.lon, peak.lat, peak.lon);
      if (d <= limit && (!best || d < best.d)) best = { peak, d };
    }
    if (!best) continue;

    const date = pt.time != null ? localDay(pt.time) : null;
    const key = `${best.peak.id}|${date ?? 'undated'}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.pointCount++;
      existing.bestDistanceM = Math.min(existing.bestDistanceM, best.d);
      if (pt.sourceId && !existing.sourceIds.includes(pt.sourceId)) existing.sourceIds.push(pt.sourceId);
    } else {
      byKey.set(key, {
        peakId: best.peak.id,
        date,
        bestDistanceM: best.d,
        pointCount: 1,
        sourceIds: pt.sourceId ? [pt.sourceId] : [],
        confidence: 'medium',
      });
    }
  }

  const peakById = new Map(peaks.map((p) => [p.id, p]));
  const out = [...byKey.values()].map((c) => {
    const approx = peakById.get(c.peakId)?.approx;
    const high = !approx && c.bestDistanceM <= opts.highConfidenceM;
    return { ...c, bestDistanceM: Math.round(c.bestDistanceM), confidence: high ? 'high' : 'medium' } as SummitCandidate;
  });

  return out.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}
