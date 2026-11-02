import { XMLParser } from 'fast-xml-parser';

import type { GeoPoint } from './types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  removeNSPrefix: true,
  isArray: (name) => ['trk', 'trkseg', 'trkpt', 'wpt', 'rte', 'rtept'].includes(name),
});

type RawPt = { lat?: string; lon?: string; time?: string };

function toPoint(p: RawPt): GeoPoint | null {
  const lat = Number(p.lat);
  const lon = Number(p.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const t = p.time ? Date.parse(String(p.time)) : NaN;
  return Number.isFinite(t) ? { lat, lon, time: t } : { lat, lon };
}

/** Pull every track point, route point and waypoint out of a GPX file. */
export function parseGpx(xml: string): GeoPoint[] {
  const doc = parser.parse(xml);
  const gpx = doc?.gpx;
  if (!gpx) throw new Error('Not a GPX file');

  const raw: RawPt[] = [];
  for (const trk of gpx.trk ?? []) for (const seg of trk.trkseg ?? []) raw.push(...(seg.trkpt ?? []));
  for (const rte of gpx.rte ?? []) raw.push(...(rte.rtept ?? []));
  raw.push(...(gpx.wpt ?? []));

  // Undated points (planned routes) inherit the first timestamp in the file, if any.
  const points = raw.map(toPoint).filter((p): p is GeoPoint => p !== null);
  const firstTime = points.find((p) => p.time != null)?.time;
  return firstTime == null ? points : points.map((p) => (p.time == null ? { ...p, time: firstTime } : p));
}
