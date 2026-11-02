import { TERRAIN, TERRAIN_GRID, TERRAIN_SPAN_M } from '@/data/terrain.generated';

export { TERRAIN_GRID, TERRAIN_SPAN_M };

export type Heightmap = {
  /** Meters, row-major, north to south, west to east. */
  h: Float32Array;
  min: number;
  max: number;
  grid: number;
};

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = new Uint8Array(128);
for (let i = 0; i < B64.length; i++) LOOKUP[B64.charCodeAt(i)] = i;

function decodeBase64(s: string): Uint8Array {
  const clean = s.replace(/=+$/, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = LOOKUP[clean.charCodeAt(i)];
    const b = LOOKUP[clean.charCodeAt(i + 1)];
    const c = LOOKUP[clean.charCodeAt(i + 2)];
    const d = LOOKUP[clean.charCodeAt(i + 3)];
    out[o++] = (a << 2) | (b >> 4);
    if (i + 2 < clean.length) out[o++] = ((b & 15) << 4) | (c >> 2);
    if (i + 3 < clean.length) out[o++] = ((c & 3) << 6) | d;
  }
  return out;
}

const cache = new Map<string, Heightmap | null>();

/** Real elevation around a peak's summit, or null if we don't have it. */
export function heightmap(peakId: string): Heightmap | null {
  if (cache.has(peakId)) return cache.get(peakId)!;
  const t = TERRAIN[peakId];
  if (!t) {
    cache.set(peakId, null);
    return null;
  }
  const bytes = decodeBase64(t.data);
  const n = TERRAIN_GRID * TERRAIN_GRID;
  const h = new Float32Array(n);
  for (let i = 0; i < n; i++) h[i] = bytes[i * 2] | (bytes[i * 2 + 1] << 8);
  const hm = { h, min: t.min, max: t.max, grid: TERRAIN_GRID };
  cache.set(peakId, hm);
  return hm;
}
