import { describe, expect, it } from 'vitest';

import { CO_14ERS } from '@/data/co14ers';

import { climberStats } from './stats';
import type { Ascent } from './types';

const peakById = new Map(CO_14ERS.map((p) => [p.id, p]));
const a = (peakId: string, date: string | null, extra: Partial<Ascent> = {}): Ascent => ({
  id: `${peakId}-${date}-${Math.random()}`,
  userId: 'me',
  peakId,
  date,
  withIds: [],
  guests: [],
  note: '',
  source: 'manual',
  createdAt: 0,
  kudos: [],
  comments: [],
  ...extra,
});

describe('climberStats', () => {
  it('uses the standard route when none was picked', () => {
    const s = climberStats([a('co-quandary-peak', '2025-07-01')], CO_14ERS, peakById);
    expect(s.feet).toBe(3450);
    expect(s.miles).toBe(6.8);
  });

  it('counts a combo route once when several of its summits are logged the same day', () => {
    const day = '2025-08-02';
    const list = ['co-mount-democrat', 'co-mount-cameron', 'co-mount-lincoln', 'co-mount-bross'].map((p) => a(p, day, { routeId: 'decalibron' }));
    const s = climberStats(list, CO_14ERS, peakById);
    expect(s.feet).toBe(3700);
    expect(s.peaks).toBe(4);
    expect(s.ascents).toBe(4);
  });

  it("uses the climber's own numbers for another route", () => {
    const s = climberStats([a('co-longs-peak', '2024-09-01', { routeId: 'other', customMiles: 9, customGainFt: 4000 })], CO_14ERS, peakById);
    expect(s.feet).toBe(4000);
    expect(s.hardest).toBe(0);
  });

  it('counts winter ascents and repeat climbs', () => {
    const s = climberStats([a('co-quandary-peak', '2025-01-10', { winter: true }), a('co-quandary-peak', null), a('co-mount-elbert', null)], CO_14ERS, peakById);
    expect(s.winter).toBe(1);
    expect(s.mostClimbed?.count).toBe(2);
    expect(s.highest?.id).toBe('co-mount-elbert');
  });
});
