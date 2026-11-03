import { OTHER_ROUTE_ID, routeById, standardRoute } from '@/data/routes';

import type { Ascent, Peak } from './types';

const EVEREST_FT = 29032;

export type ClimberStats = {
  ascents: number;
  peaks: number;
  feet: number;
  miles: number;
  winter: number;
  everests: number;
  highest?: Peak;
  rangesDone: string[];
  hardest: number;
  favoriteMonth?: string;
  bestYear?: { year: string; count: number };
  mostClimbed?: { peak: Peak; count: number };
  partners: number;
  avgRating: number | null;
  firstYear?: string;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Miles and gain for one ascent: its route, your own numbers, or the standard route. */
export function effort(a: Ascent) {
  if (a.routeId === OTHER_ROUTE_ID) return { miles: a.customMiles ?? 0, feet: a.customGainFt ?? 0, cls: 0, key: a.id };
  const r = routeById(a.routeId) ?? standardRoute(a.peakId);
  if (!r) return { miles: 0, feet: 0, cls: 0, key: a.id };
  // A combo route walked once counts once, however many of its summits you log that day.
  const key = r.peaks && a.date ? `${r.id}|${a.date}` : a.id;
  return { miles: r.miles, feet: r.gainFt, cls: r.cls, key };
}

/** Everything people like to brag about, from one climber's ascents. */
export function climberStats(list: Ascent[], peaks: Peak[], peakById: Map<string, Peak>): ClimberStats {
  const counted = new Set<string>();
  let feet = 0;
  let miles = 0;
  let hardest = 0;
  const perPeak = new Map<string, number>();
  const perYear = new Map<string, number>();
  const perMonth = new Map<number, number>();
  for (const a of list) {
    const e = effort(a);
    if (!counted.has(e.key)) {
      counted.add(e.key);
      feet += e.feet;
      miles += e.miles;
    }
    hardest = Math.max(hardest, e.cls);
    perPeak.set(a.peakId, (perPeak.get(a.peakId) ?? 0) + 1);
    if (a.date) {
      const y = a.date.slice(0, 4);
      perYear.set(y, (perYear.get(y) ?? 0) + 1);
      const m = Number(a.date.slice(5, 7)) - 1;
      perMonth.set(m, (perMonth.get(m) ?? 0) + 1);
    }
  }
  const done = new Set(perPeak.keys());
  const ranges = [...new Set(peaks.map((p) => p.range))];
  const rangesDone = ranges.filter((r) => peaks.filter((p) => p.range === r).every((p) => done.has(p.id)));
  const top = [...perPeak.entries()].sort((a, b) => b[1] - a[1])[0];
  const year = [...perYear.entries()].sort((a, b) => b[1] - a[1])[0];
  const month = [...perMonth.entries()].sort((a, b) => b[1] - a[1])[0];
  const rated = list.filter((a) => a.rating);
  const highest = [...done].map((id) => peakById.get(id)).filter((p): p is Peak => !!p).sort((a, b) => b.elevationFt - a.elevationFt)[0];
  return {
    ascents: list.length,
    peaks: done.size,
    feet,
    miles: Math.round(miles * 10) / 10,
    winter: list.filter((a) => a.winter).length,
    everests: feet / EVEREST_FT,
    highest,
    rangesDone,
    hardest,
    favoriteMonth: month ? MONTHS[month[0]] : undefined,
    bestYear: year ? { year: year[0], count: year[1] } : undefined,
    mostClimbed: top && top[1] > 1 ? { peak: peakById.get(top[0])!, count: top[1] } : undefined,
    partners: new Set(list.flatMap((a) => a.withIds)).size,
    avgRating: rated.length ? rated.reduce((n, a) => n + (a.rating ?? 0), 0) / rated.length : null,
    firstYear: [...perYear.keys()].sort()[0],
  };
}
