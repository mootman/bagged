import { describe, expect, it } from 'vitest';

import { CO_14ERS } from '@/data/co14ers';

import { peakArt } from './peak-art';

describe('peakArt', () => {
  it('is stable for the same peak', () => {
    expect(peakArt('co-longs-peak')).toEqual(peakArt('co-longs-peak'));
  });

  it('gives every 14er valid, distinct art', () => {
    const paths = new Set<string>();
    for (const p of CO_14ERS) {
      const art = peakArt(p.id);
      expect(art.layers).toHaveLength(3);
      for (const l of art.layers) expect(l.d).toMatch(/^M0,300 L[\d.,\s L-]+ Z$/);
      paths.add(art.layers[1].d);
    }
    expect(paths.size).toBe(CO_14ERS.length);
  });
});
