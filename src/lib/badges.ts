import { routeById, standardRoute } from '@/data/routes';

import { climberStats } from './stats';
import type { Ascent, Peak } from './types';

export type BadgeTone = 'green' | 'blue' | 'gold' | 'rust' | 'slate';

export type Badge = {
  id: string;
  name: string;
  /** What you did to earn it, in plain words. */
  how: string;
  tone: BadgeTone;
  /** Short mark drawn on the badge: a number or a couple of letters. */
  mark: string;
  have: number;
  need: number;
  done: boolean;
};

const EVEREST = 29032;

/**
 * Every badge and how close you are. Progress is the point: a badge you're 2 peaks away from
 * is a reason to plan the next weekend.
 */
export function badgesFor(list: Ascent[], peaks: Peak[], peakById: Map<string, Peak>): Badge[] {
  const s = climberStats(list, peaks, peakById);
  const done = new Set(list.map((a) => a.peakId));
  const cls = (a: Ascent) => (routeById(a.routeId) ?? standardRoute(a.peakId))?.cls ?? 0;
  const perPeak = new Map<string, number>();
  for (const a of list) perPeak.set(a.peakId, (perPeak.get(a.peakId) ?? 0) + 1);
  const repeat = Math.max(0, ...perPeak.values());
  const byDay = new Map<string, Set<string>>();
  for (const a of list) if (a.date) byDay.set(a.date, new Set([...(byDay.get(a.date) ?? []), a.peakId]));
  const bestDay = Math.max(0, ...[...byDay.values()].map((x) => x.size));
  const decal = ['co-mount-democrat', 'co-mount-cameron', 'co-mount-lincoln', 'co-mount-bross'];
  const decalDay = Math.max(0, ...[...byDay.values()].map((x) => decal.filter((p) => x.has(p)).length));

  const b = (id: string, name: string, how: string, tone: BadgeTone, mark: string, have: number, need: number): Badge => ({
    id,
    name,
    how,
    tone,
    mark,
    have: Math.min(have, need),
    need,
    done: have >= need,
  });

  const out: Badge[] = [
    b('first', 'First fourteener', 'Stand on top of any 14er.', 'green', '1', s.peaks, 1),
    b('five', 'Five down', 'Climb 5 different 14ers.', 'green', '5', s.peaks, 5),
    b('ten', 'Double digits', 'Climb 10 different 14ers.', 'green', '10', s.peaks, 10),
    b('quarter', 'Over the hump', 'Climb 29 different 14ers, half the list.', 'green', '29', s.peaks, 29),
    b('all', 'Finisher', 'Climb all 58 Colorado 14ers.', 'gold', '58', s.peaks, 58),
    b('highest', 'Top of Colorado', 'Climb Mount Elbert, the highest point in the state.', 'gold', 'EL', done.has('co-mount-elbert') ? 1 : 0, 1),
    b('everest', 'One Everest', 'Climb 29,032 feet in total.', 'slate', 'EV', Math.round(s.feet), EVEREST),
    b('hundred-k', '100,000 feet', 'Climb 100,000 feet in total.', 'slate', '100K', Math.round(s.feet), 100000),
    b('miles', 'Century', 'Hike 100 miles on 14er routes.', 'slate', '100', Math.round(s.miles), 100),
    b('winter-1', 'Cold start', 'Climb a 14er in calendar winter.', 'blue', 'W', s.winter, 1),
    b('winter-5', 'Winter regular', 'Climb five 14ers in calendar winter.', 'blue', 'W5', s.winter, 5),
    b('class3', 'Hands on rock', 'Climb a class 3 route.', 'rust', 'C3', list.some((a) => cls(a) >= 3) ? 1 : 0, 1),
    b('class4', 'Exposed', 'Climb a class 4 route.', 'rust', 'C4', list.some((a) => cls(a) >= 4) ? 1 : 0, 1),
    b('decalibron', 'Decalibron', 'Democrat, Cameron, Lincoln and Bross in one day.', 'rust', 'DC', decalDay, 4),
    b('big-day', 'Big day', 'Three 14ers in one day.', 'rust', '3', bestDay, 3),
    b('regular', 'Regular', 'Climb the same peak three times.', 'green', '3x', repeat, 3),
  ];

  for (const range of [...new Set(peaks.map((p) => p.range))].sort()) {
    const inRange = peaks.filter((p) => p.range === range);
    if (inRange.length < 2) continue;
    out.push(b(`range-${range}`, `${range} complete`, `Climb every 14er in the ${range} Range.`, 'gold', range.slice(0, 2).toUpperCase(), inRange.filter((p) => done.has(p.id)).length, inRange.length));
  }
  return out;
}

/** Badges earned by `after` that `before` didn't have. For the unlock moment. */
export function newlyEarned(before: Badge[], after: Badge[]) {
  const had = new Set(before.filter((x) => x.done).map((x) => x.id));
  return after.filter((x) => x.done && !had.has(x.id));
}

/** Curated goals, Letterboxd-style lists you work through. */
export const LISTS: { id: string; name: string; blurb: string; peaks: string[] }[] = [
  {
    id: 'first',
    name: 'Best first 14ers',
    blurb: 'Short, class 1 or 2, close to Denver. Where most people start.',
    peaks: ['co-quandary-peak', 'co-mount-bierstadt', 'co-grays-peak', 'co-torreys-peak', 'co-mount-sherman', 'co-handies-peak', 'co-mount-democrat'],
  },
  {
    id: 'class3',
    name: 'Class 3 classics',
    blurb: 'Hands on rock and real exposure. Helmets on.',
    peaks: ['co-longs-peak', 'co-wetterhorn-peak', 'co-crestone-needle', 'co-maroon-peak', 'co-wilson-peak', 'co-mount-eolus', 'co-kit-carson-mountain'],
  },
  {
    id: 'winter',
    name: 'Winter-friendly',
    blurb: 'Plowed access and lower avalanche exposure on the standard routes. Check the forecast anyway.',
    peaks: ['co-quandary-peak', 'co-mount-bierstadt', 'co-mount-sherman', 'co-mount-elbert', 'co-grays-peak', 'co-torreys-peak', 'co-mount-democrat'],
  },
  {
    id: 'collegiate',
    name: 'The Collegiate Peaks',
    blurb: 'Harvard, Columbia, Yale, Princeton, Oxford and Belford, named for the schools.',
    peaks: ['co-mount-harvard', 'co-mount-columbia', 'co-mount-yale', 'co-mount-princeton', 'co-mount-oxford', 'co-mount-belford'],
  },
  {
    id: 'hardest',
    name: 'The hardest 14ers',
    blurb: 'Class 4 standard routes. The ones people save for last.',
    peaks: ['co-capitol-peak', 'co-little-bear-peak', 'co-pyramid-peak', 'co-north-maroon-peak', 'co-mount-wilson', 'co-sunlight-peak'],
  },
  {
    id: 'remote',
    name: 'Train to the trailhead',
    blurb: 'Chicago Basin: ride the Durango and Silverton railroad in, climb, ride out.',
    peaks: ['co-windom-peak', 'co-sunlight-peak', 'co-mount-eolus', 'co-north-eolus'],
  },
];

/**
 * What to climb next: unclimbed peaks one step up from what you've done, closest to where
 * you've already been. Never more than one class harder than your hardest so far.
 */
export function upNext(list: Ascent[], peaks: Peak[], want: string[]) {
  const done = new Set(list.map((a) => a.peakId));
  const hardest = Math.max(1, ...list.map((a) => (routeById(a.routeId) ?? standardRoute(a.peakId))?.cls ?? 1));
  const climbed = peaks.filter((p) => done.has(p.id));
  const near = (p: Peak) => (climbed.length ? Math.min(...climbed.map((q) => Math.hypot(p.lat - q.lat, (p.lon - q.lon) * 0.78))) : Math.hypot(p.lat - 39.74, (p.lon + 104.99) * 0.78));
  return peaks
    .filter((p) => !done.has(p.id))
    .map((p) => {
      const r = standardRoute(p.id);
      const cls = r?.cls ?? 2;
      const score = near(p) * 10 + (cls > hardest + 1 ? 100 : 0) + (cls > hardest ? 2 : 0) + (want.includes(p.id) ? -5 : 0) + (r ? r.miles / 10 : 0);
      return { peak: p, route: r, score, reason: want.includes(p.id) ? 'On your want list' : climbed.length ? `Near ${climbed.sort((a, b) => Math.hypot(a.lat - p.lat, a.lon - p.lon) - Math.hypot(b.lat - p.lat, b.lon - p.lon))[0].name}` : 'A good first one' };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
}
