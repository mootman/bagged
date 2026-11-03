import { describe, expect, it } from 'vitest';

import { CO_14ERS } from '@/data/co14ers';

import { badgesFor, LISTS, newlyEarned, upNext } from './badges';
import type { Ascent } from './types';

const peakById = new Map(CO_14ERS.map((p) => [p.id, p]));
const a = (peakId: string, date: string | null, extra: Partial<Ascent> = {}): Ascent => ({
  id: `${peakId}-${date}`, userId: 'me', peakId, date, withIds: [], guests: [], note: '', source: 'manual', createdAt: 0, kudos: [], comments: [], ...extra,
});

describe('badges', () => {
  it('earns the Decalibron only with all four on one day', () => {
    const day = ['co-mount-democrat', 'co-mount-cameron', 'co-mount-lincoln', 'co-mount-bross'].map((p) => a(p, '2025-07-12'));
    const got = badgesFor(day, CO_14ERS, peakById).find((b) => b.id === 'decalibron');
    expect(got?.done).toBe(true);
    const split = badgesFor([a('co-mount-democrat', '2025-07-12'), a('co-mount-cameron', '2025-07-13')], CO_14ERS, peakById).find((b) => b.id === 'decalibron');
    expect(split?.done).toBe(false);
  });

  it('reports newly earned badges', () => {
    const before = badgesFor([], CO_14ERS, peakById);
    const after = badgesFor([a('co-mount-elbert', '2025-01-05', { winter: true })], CO_14ERS, peakById);
    expect(newlyEarned(before, after).map((b) => b.id).sort()).toEqual(['first', 'highest', 'winter-1']);
  });

  it('every list points at real peaks', () => {
    for (const l of LISTS) for (const p of l.peaks) expect(peakById.has(p)).toBe(true);
  });

  it('never suggests a peak you have done', () => {
    const list = [a('co-quandary-peak', null)];
    expect(upNext(list, CO_14ERS, []).some((n) => n.peak.id === 'co-quandary-peak')).toBe(false);
  });
});
