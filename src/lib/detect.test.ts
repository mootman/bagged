import { describe, expect, it } from 'vitest';

import { CO_14ERS } from '@/data/co14ers';

import { detectSummits, distanceM, localDay, PHOTO_OPTIONS, TRACK_OPTIONS } from './detect';
import { parseGpx } from './gpx';

const peak = (name: string) => CO_14ERS.find((p) => p.name === name)!;
const AUG_12 = new Date(2023, 7, 12, 9, 30).getTime();
const AUG_12_LATER = new Date(2023, 7, 12, 10, 5).getTime();
const JUL_4 = new Date(2024, 6, 4, 8, 0).getTime();

/** Offset a point roughly `meters` north of a peak. */
const north = (p: { lat: number; lon: number }, meters: number) => ({
  lat: p.lat + meters / 111_320,
  lon: p.lon,
});

describe('peak data', () => {
  it('has the traditional 58 with unique ids', () => {
    expect(CO_14ERS).toHaveLength(58);
    expect(new Set(CO_14ERS.map((p) => p.id)).size).toBe(58);
    expect(CO_14ERS.filter((p) => p.ranked)).toHaveLength(53);
  });

  it('every peak is inside Colorado and above 14,000 ft', () => {
    for (const p of CO_14ERS) {
      expect(p.lat).toBeGreaterThan(37);
      expect(p.lat).toBeLessThan(41);
      expect(p.lon).toBeGreaterThan(-109.06);
      expect(p.lon).toBeLessThan(-102.04);
      expect(p.elevationFt).toBeGreaterThanOrEqual(14000);
    }
  });
});

describe('distanceM', () => {
  it('is about 111 km per degree of latitude', () => {
    expect(distanceM(39, -106, 40, -106)).toBeGreaterThan(111_000);
    expect(distanceM(39, -106, 40, -106)).toBeLessThan(111_400);
  });
});

describe('detectSummits from photos', () => {
  it('finds a summit photo and groups photos from the same day', () => {
    const q = peak('Quandary Peak');
    const out = detectSummits(
      [
        { ...north(q, 10), time: AUG_12, sourceId: 'a' },
        { ...north(q, 30), time: AUG_12_LATER, sourceId: 'b' },
      ],
      CO_14ERS,
      PHOTO_OPTIONS,
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ peakId: q.id, date: '2023-08-12', pointCount: 2, confidence: 'high' });
    expect(out[0].sourceIds).toEqual(['a', 'b']);
  });

  it('ignores photos at the trailhead', () => {
    const q = peak('Quandary Peak');
    expect(detectSummits([{ ...north(q, 2000), time: AUG_12 }], CO_14ERS, PHOTO_OPTIONS)).toEqual([]);
  });

  it('marks photos a bit off the top as medium confidence', () => {
    const q = peak('Quandary Peak');
    const [c] = detectSummits([{ ...north(q, 100), time: AUG_12 }], CO_14ERS, PHOTO_OPTIONS);
    expect(c.confidence).toBe('medium');
  });

  it('credits a point only to the closest peak', () => {
    const grays = peak('Grays Peak');
    const out = detectSummits([{ ...north(grays, 5), time: AUG_12 }], CO_14ERS, PHOTO_OPTIONS);
    expect(out.map((c) => c.peakId)).toEqual([grays.id]);
  });

  it('separates repeat climbs on different days, newest first', () => {
    const b = peak('Mount Bierstadt');
    const out = detectSummits(
      [
        { ...north(b, 5), time: AUG_12 },
        { ...north(b, 5), time: JUL_4 },
      ],
      CO_14ERS,
      PHOTO_OPTIONS,
    );
    expect(out.map((c) => c.date)).toEqual(['2024-07-04', '2023-08-12']);
  });

  it('skips 0,0 placeholder locations', () => {
    expect(detectSummits([{ lat: 0, lon: 0, time: AUG_12 }], CO_14ERS, PHOTO_OPTIONS)).toEqual([]);
  });

  it('uses a wider radius for unverified peaks but never calls them high confidence', () => {
    const c = peak('Conundrum Peak');
    const [hit] = detectSummits([{ ...north(c, 250), time: AUG_12 }], CO_14ERS, PHOTO_OPTIONS);
    expect(hit.peakId).toBe(c.id);
    expect(hit.confidence).toBe('medium');
  });
});

describe('GPX', () => {
  const l = peak('Mount Lincoln');
  const d = peak('Mount Democrat');
  const t0 = Date.UTC(2023, 6, 15, 14, 0);
  const pt = (p: { lat: number; lon: number }, mins: number) =>
    `<trkpt lat="${p.lat}" lon="${p.lon}"><ele>4300</ele><time>${new Date(t0 + mins * 60_000).toISOString()}</time></trkpt>`;

  const gpx = `<?xml version="1.0"?>
  <gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
    <trk><name>Decalibron</name><trkseg>
      ${pt(north(d, 2000), 0)}
      ${pt(north(d, 8), 90)}
      ${pt(north(l, 12), 150)}
      ${pt(north(l, 3000), 200)}
    </trkseg></trk>
  </gpx>`;

  it('parses track points with time', () => {
    const pts = parseGpx(gpx);
    expect(pts).toHaveLength(4);
    expect(pts[0].time).toBe(t0);
  });

  it('finds every summit on a multi-peak loop', () => {
    const ids = detectSummits(parseGpx(gpx), CO_14ERS, TRACK_OPTIONS).map((c) => c.peakId);
    expect(ids.sort()).toEqual([d.id, l.id].sort());
  });

  it('rejects non-GPX input', () => {
    expect(() => parseGpx('<kml></kml>')).toThrow();
  });
});

describe('localDay', () => {
  it('formats a local date', () => {
    expect(localDay(AUG_12)).toBe('2023-08-12');
  });
});
