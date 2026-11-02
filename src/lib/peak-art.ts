/**
 * Generative "poster" art for a peak: layered ridgelines under a sky, unique per peak and
 * stable across launches. Plays the role movie posters play in Letterboxd until the user
 * has their own summit photo.
 */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sky top, sky bottom, far ridge, mid ridge, near ridge. */
const PALETTES = [
  { name: 'alpenglow', c: ['#1E2A4A', '#F28C6B', '#8E6A8F', '#4B3F63', '#1C1A2B'], stars: true },
  { name: 'blue hour', c: ['#0B1626', '#3E6A8A', '#4F7895', '#2C4A63', '#121D29'], stars: true },
  { name: 'dusk', c: ['#2B1B3A', '#E9A06A', '#B07A72', '#6A4A5E', '#241824'], stars: false },
  { name: 'bluebird', c: ['#13324A', '#9CC9E0', '#7EA5BD', '#4E7189', '#1C3343'], stars: false },
  { name: 'storm', c: ['#171C21', '#6F7A82', '#59636B', '#3A4249', '#181C20'], stars: false },
  { name: 'sunrise', c: ['#30213A', '#F4B860', '#C57B57', '#7A4B4F', '#281A21'], stars: false },
] as const;

export const ART_W = 200;
export const ART_H = 300;

type Pt = [number, number];

/** A jagged ridge across the full width that rises to a sharp high point at (peakX, peakY). */
function ridge(r: () => number, baseY: number, peakX: number, peakY: number, rough: number): Pt[] {
  const pts: Pt[] = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * ART_W;
    if (Math.abs(x - peakX) < ART_W / steps / 2) continue; // leave room for the summit point
    const falloff = Math.min(1, (Math.abs(x - peakX) / ART_W) * 2.4);
    const y = peakY + (baseY - peakY) * falloff + (r() - 0.5) * rough * falloff;
    pts.push([x, y]);
  }
  pts.push([peakX, peakY]);
  return pts.sort((a, b) => a[0] - b[0]);
}

const toPath = (pts: Pt[]) =>
  `M0,${ART_H} L` + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L') + ` L${ART_W},${ART_H} Z`;

export type PeakArt = {
  sky: [string, string];
  layers: { d: string; fill: string }[];
  snow: string | null;
  stars: { x: number; y: number; r: number }[];
};

export function peakArt(id: string): PeakArt {
  const seed = hash(id);
  const r = rng(seed);
  const pal = PALETTES[seed % PALETTES.length];
  const [skyTop, skyBottom, far, mid, near] = pal.c;

  const peakX = 55 + r() * 90;
  const peakY = 92 + r() * 26;

  const farPts = ridge(r, 180, r() * ART_W, 128 + r() * 20, 26);
  const midPts = ridge(r, 220, peakX, peakY, 30);
  const nearPts = ridge(r, 262, (peakX + 90 + r() * 40) % ART_W, 214 + r() * 16, 16);

  // Snowcap on most peaks: a small jagged cap hugging the summit.
  const s = 14 + r() * 6;
  const snow =
    seed % 4 === 0
      ? null
      : `M${peakX},${peakY} L${peakX - s},${peakY + s * 1.4} L${peakX - s * 0.4},${peakY + s} L${peakX + s * 0.1},${peakY + s * 1.5} L${peakX + s * 0.6},${peakY + s * 1.05} L${peakX + s},${peakY + s * 1.3} Z`;

  const stars = pal.stars ? Array.from({ length: 16 }, () => ({ x: r() * ART_W, y: r() * 100, r: 0.4 + r() * 0.9 })) : [];

  return {
    sky: [skyTop, skyBottom],
    layers: [
      { d: toPath(farPts), fill: far },
      { d: toPath(midPts), fill: mid },
      { d: toPath(nearPts), fill: near },
    ],
    snow,
    stars,
  };
}
