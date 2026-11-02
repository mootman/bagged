import { heightmap } from './terrain';

/**
 * "Unknown Pleasures" ridgeline plot of a peak's real terrain, seen from the south.
 * Each line is one east-west slice of the elevation model; back slices sit higher on
 * the canvas and are hidden by the ones in front, which reads as depth.
 */
export type Ridgelines = {
  /** Back to front. `fill` occludes lines behind it, `line` is the stroke. */
  lines: { fill: string; line: string; t: number }[];
  /** Where the summit lands on the canvas. */
  summit: { x: number; y: number };
  width: number;
  height: number;
};

export function ridgelines(
  peakId: string,
  { width = 200, height = 300, count = 30, top = 0.3, bottom = 0.94, amplitude = 0.36, points = 72, crop = 0.12 } = {},
): Ridgelines | null {
  const hm = heightmap(peakId);
  if (!hm) return null;
  const { h, grid, min, max } = hm;
  const relief = Math.max(1, max - min);

  const y0 = height * top;
  const y1 = height * bottom;
  const amp = height * amplitude;
  const c0 = Math.floor(grid * crop);
  const c1 = grid - 1 - c0;

  const lines: Ridgelines['lines'] = [];
  let summit = { x: width / 2, y: y0 };
  let summitScore = -Infinity;

  for (let k = 0; k < count; k++) {
    const t = k / (count - 1); // 0 = back (north), 1 = front (south)
    const row = Math.round(c0 + (c1 - c0) * t);
    const base = y0 + (y1 - y0) * t;
    // Slight perspective: back lines are a bit narrower and flatter.
    const squeeze = 0.86 + 0.14 * t;
    const a = amp * (0.82 + 0.18 * t);

    const pts: string[] = [];
    for (let p = 0; p < points; p++) {
      const u = p / (points - 1);
      const col = c0 + (c1 - c0) * u;
      const ci = Math.floor(col);
      const f = col - ci;
      const v0 = h[row * grid + ci];
      const v1 = h[row * grid + Math.min(grid - 1, ci + 1)];
      const elev = v0 + (v1 - v0) * f;
      // Ease the relief so ridges pop and valleys stay calm.
      const n = Math.pow((elev - min) / relief, 1.6);
      const x = width / 2 + (u - 0.5) * width * squeeze;
      const y = base - n * a;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      if (n * a - t * 2 > summitScore && Math.abs(u - 0.5) < 0.2) {
        summitScore = n * a - t * 2;
        summit = { x, y };
      }
    }
    const line = `M${pts.join(' L')}`;
    const fill = `${line} L${(width / 2 + width * squeeze * 0.5).toFixed(1)},${height} L${(width / 2 - width * squeeze * 0.5).toFixed(1)},${height} Z`;
    lines.push({ fill, line, t });
  }
  return { lines, summit, width, height };
}
