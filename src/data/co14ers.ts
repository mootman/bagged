import type { Peak } from '@/lib/types';

/**
 * Colorado 14ers: the 53 ranked summits plus the 5 unranked summits that make up
 * the traditional list of 58.
 *
 * Ranked coordinates and elevations: Wikipedia, "List of Colorado fourteeners".
 * North Maroon and El Diente: soaringweb.org CO 14er control points.
 * Conundrum and Mount Cameron: high point found in the elevation model (scripts/bake-terrain.py).
 * Peaks marked `approx: true` still need checking against a survey source before launch.
 * Detection uses a wider radius for them.
 */
type Row = [name: string, elevationFt: number, lat: number, lon: number, range: string];

const ranked: Row[] = [
  ['Mount Elbert', 14440, 39.1178, -106.4454, 'Sawatch'],
  ['Mount Massive', 14428, 39.1875, -106.4757, 'Sawatch'],
  ['Mount Harvard', 14421, 38.9244, -106.3207, 'Sawatch'],
  ['Blanca Peak', 14351, 37.5775, -105.4856, 'Sangre de Cristo'],
  ['La Plata Peak', 14343, 39.0294, -106.4729, 'Sawatch'],
  ['Uncompahgre Peak', 14321, 38.0717, -107.4621, 'San Juan'],
  ['Crestone Peak', 14300, 37.9669, -105.5855, 'Sangre de Cristo'],
  ['Mount Lincoln', 14293, 39.3515, -106.1116, 'Mosquito'],
  ['Castle Peak', 14279, 39.0097, -106.8614, 'Elk'],
  ['Grays Peak', 14278, 39.6339, -105.8176, 'Front'],
  ['Mount Antero', 14276, 38.6741, -106.2462, 'Sawatch'],
  ['Torreys Peak', 14275, 39.6428, -105.8212, 'Front'],
  ['Quandary Peak', 14271, 39.3973, -106.1064, 'Mosquito'],
  ['Mount Blue Sky', 14271, 39.5883, -105.6438, 'Front'],
  ['Longs Peak', 14259, 40.255, -105.6151, 'Front'],
  ['Mount Wilson', 14252, 37.8391, -107.9916, 'San Miguel'],
  ['Mount Shavano', 14231, 38.6192, -106.2393, 'Sawatch'],
  ['Mount Princeton', 14204, 38.7492, -106.2424, 'Sawatch'],
  ['Mount Belford', 14203, 38.9607, -106.3607, 'Sawatch'],
  ['Crestone Needle', 14203, 37.9647, -105.5766, 'Sangre de Cristo'],
  ['Mount Yale', 14200, 38.8442, -106.3138, 'Sawatch'],
  ['Mount Bross', 14178, 39.3354, -106.1077, 'Mosquito'],
  ['Kit Carson Mountain', 14171, 37.9797, -105.6026, 'Sangre de Cristo'],
  ['Maroon Peak', 14163, 39.0708, -106.989, 'Elk'],
  ['Tabeguache Peak', 14162, 38.6255, -106.2509, 'Sawatch'],
  ['Mount Oxford', 14160, 38.9648, -106.3388, 'Sawatch'],
  ['Mount Sneffels', 14158, 38.0038, -107.7923, 'Sneffels'],
  ['Mount Democrat', 14155, 39.3396, -106.14, 'Mosquito'],
  ['Capitol Peak', 14137, 39.1503, -107.0829, 'Elk'],
  ['Pikes Peak', 14115, 38.8405, -105.0442, 'Front'],
  ['Snowmass Mountain', 14099, 39.1188, -107.0665, 'Elk'],
  ['Windom Peak', 14093, 37.6212, -107.5919, 'Needle'],
  ['Mount Eolus', 14090, 37.6218, -107.6227, 'San Juan'],
  ['Challenger Point', 14087, 37.9804, -105.6066, 'Sangre de Cristo'],
  ['Mount Columbia', 14077, 38.9039, -106.2975, 'Sawatch'],
  ['Missouri Mountain', 14074, 38.9476, -106.3785, 'Sawatch'],
  ['Humboldt Peak', 14070, 37.9762, -105.5552, 'Sangre de Cristo'],
  ['Mount Bierstadt', 14065, 39.5826, -105.6688, 'Front'],
  ['Sunlight Peak', 14065, 37.6274, -107.5959, 'San Juan'],
  ['Handies Peak', 14058, 37.913, -107.5044, 'San Juan'],
  ['Culebra Peak', 14053, 37.1224, -105.1858, 'Culebra'],
  ['Ellingwood Point', 14048, 37.5826, -105.4927, 'Sangre de Cristo'],
  ['Mount Lindsey', 14048, 37.5837, -105.4449, 'Sangre de Cristo'],
  ['Little Bear Peak', 14043, 37.5666, -105.4972, 'Sangre de Cristo'],
  ['Mount Sherman', 14043, 39.225, -106.1699, 'Mosquito'],
  ['Redcloud Peak', 14041, 37.941, -107.4219, 'San Juan'],
  ['Pyramid Peak', 14025, 39.0717, -106.9502, 'Elk'],
  ['Wilson Peak', 14023, 37.8603, -107.9847, 'San Juan'],
  ['San Luis Peak', 14022, 37.9868, -106.9313, 'La Garita'],
  ['Wetterhorn Peak', 14021, 38.0607, -107.5109, 'San Juan'],
  ['Mount of the Holy Cross', 14011, 39.4668, -106.4817, 'Sawatch'],
  ['Huron Peak', 14010, 38.9455, -106.4381, 'Sawatch'],
  ['Sunshine Peak', 14007, 37.9228, -107.4256, 'San Juan'],
];

const unranked: (Row | [...Row, 'approx'])[] = [
  ['North Maroon Peak', 14014, 39.0761, -106.9872, 'Elk'],
  ['El Diente Peak', 14159, 37.8395, -108.0053, 'San Miguel'],
  ['Conundrum Peak', 14060, 39.01458, -106.86356, 'Elk'],
  ['North Eolus', 14039, 37.6253, -107.6209, 'San Juan', 'approx'],
  ['Mount Cameron', 14238, 39.34636, -106.11872, 'Mosquito'],
];

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const CO_14ERS: Peak[] = [
  ...ranked.map(([name, elevationFt, lat, lon, range]) => ({
    id: `co-${slugify(name)}`,
    name,
    elevationFt,
    lat,
    lon,
    range,
    ranked: true,
  })),
  ...unranked.map(([name, elevationFt, lat, lon, range, flag]) => ({
    id: `co-${slugify(name)}`,
    name,
    elevationFt,
    lat,
    lon,
    range,
    ranked: false,
    approx: flag === 'approx',
  })),
];

export const LISTS = [
  {
    id: 'co-14ers',
    name: 'Colorado 14ers',
    peakIds: CO_14ERS.map((p) => p.id),
  },
] as const;
