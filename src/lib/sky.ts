/**
 * Time-of-day lighting for the 3D terrain. t runs 0 (dawn) to 1 (night).
 * Keyframes are interpolated so the slider feels continuous.
 */
export type SkyState = {
  sky: string;
  horizon: string;
  sun: string;
  sunIntensity: number;
  ambient: number;
  /** Sun direction: azimuth (radians, 0 = east, PI/2 = south) and elevation (radians). */
  azimuth: number;
  elevation: number;
  label: string;
};

const KEYS: (Omit<SkyState, 'label'> & { t: number; label: string })[] = [
  { t: 0, label: 'Dawn', sky: '#212B4A', horizon: '#E89A73', sun: '#FFB37A', sunIntensity: 2.8, ambient: 0.6, azimuth: 0.3, elevation: 0.2 },
  { t: 0.3, label: 'Morning', sky: '#3D6E9C', horizon: '#BFD9E8', sun: '#FFF1DE', sunIntensity: 2.8, ambient: 0.6, azimuth: 0.9, elevation: 0.65 },
  { t: 0.5, label: 'Noon', sky: '#4A86BC', horizon: '#D6E8F2', sun: '#FFFFFF', sunIntensity: 3.0, ambient: 0.75, azimuth: 1.6, elevation: 1.1 },
  { t: 0.75, label: 'Alpenglow', sky: '#2E2147', horizon: '#FF8A72', sun: '#FF8A5C', sunIntensity: 3.4, ambient: 0.7, azimuth: 2.75, elevation: 0.22 },
  { t: 1, label: 'Night', sky: '#070B14', horizon: '#1B2740', sun: '#A9C1FF', sunIntensity: 0.9, ambient: 0.3, azimuth: 3.6, elevation: 0.7 },
];

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

export function skyAt(t: number): SkyState {
  const x = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < KEYS.length - 2 && x > KEYS[i + 1].t) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const f = (x - a.t) / (b.t - a.t);
  const lerp = (p: number, q: number) => p + (q - p) * f;
  return {
    label: f < 0.5 ? a.label : b.label,
    sky: mix(a.sky, b.sky, f),
    horizon: mix(a.horizon, b.horizon, f),
    sun: mix(a.sun, b.sun, f),
    sunIntensity: lerp(a.sunIntensity, b.sunIntensity),
    ambient: lerp(a.ambient, b.ambient),
    azimuth: lerp(a.azimuth, b.azimuth),
    elevation: lerp(a.elevation, b.elevation),
  };
}

export const SKY_STOPS = KEYS.map((k) => ({ t: k.t, label: k.label, horizon: k.horizon, sky: k.sky }));
