import { describe, expect, it } from 'vitest';

import { CO_14ERS } from '@/data/co14ers';

import { buildDemo } from './seed';

describe('demo crew', () => {
  const peakIds = new Set(CO_14ERS.map((p) => p.id));
  const d = buildDemo(new Date(2026, 10, 2, 12).getTime());
  const userIds = new Set([...d.users.map((u) => u.id), 'me']);

  it('only references real peaks and users', () => {
    for (const a of d.ascents) {
      expect(peakIds.has(a.peakId), a.peakId).toBe(true);
      expect(userIds.has(a.userId)).toBe(true);
      for (const w of a.withIds) expect(userIds.has(w)).toBe(true);
      for (const k of a.kudos) expect(userIds.has(k)).toBe(true);
    }
    for (const p of d.plans) {
      expect(peakIds.has(p.peakId), p.peakId).toBe(true);
      for (const m of p.memberIds) expect(userIds.has(m)).toBe(true);
      expect(p.memberIds.length).toBeLessThanOrEqual(p.size);
    }
    for (const [u, list] of Object.entries(d.wants)) {
      expect(userIds.has(u)).toBe(true);
      for (const p of list) expect(peakIds.has(p), p).toBe(true);
    }
    for (const u of d.users) for (const f of u.favorites) expect(peakIds.has(f), f).toBe(true);
  });

  it('group climbs are mirrored for every climber', () => {
    const quandary = d.ascents.filter((a) => a.peakId === 'co-quandary-peak' && a.beta?.wind === 'Howling');
    expect(quandary.map((a) => a.userId).sort()).toEqual(['u_jess', 'u_marcus']);
    expect(quandary.find((a) => a.userId === 'u_jess')?.withIds).toEqual(['u_marcus']);
  });

  it('weekend plans land on a Saturday and Sunday after today', () => {
    const gt = d.plans.find((p) => p.id === 'p_gt')!;
    const [y, m, day] = gt.date.split('-').map(Number);
    expect(new Date(y, m - 1, day).getDay()).toBe(6);
    expect(gt.date > '2026-11-02').toBe(true);
  });
});
