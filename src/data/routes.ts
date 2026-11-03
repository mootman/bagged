/**
 * Common routes for each Colorado 14er: round-trip miles, total gain and class from the usual
 * trailhead. Figures are approximate, from widely published facts (guidebooks, Forest Service
 * and park pages). Before launch, re-measure each one from OpenStreetMap trail lines and the
 * elevation model in scripts/, and keep "Other" for anything not listed.
 *
 * A combo route (Decalibron, Grays and Torreys...) covers several summits in one outing. When you
 * log more than one of its peaks on the same day, its miles and gain count once.
 */
export type Route = {
  id: string;
  name: string;
  miles: number;
  gainFt: number;
  /** YDS class of the hardest moves. */
  cls: 1 | 2 | 3 | 4;
  /** Summits this outing covers, when it's more than one. */
  peaks?: string[];
  note?: string;
};

const P = (s: string) => `co-${s}`;

const COMBOS: Route[] = [
  { id: 'decalibron', name: 'Decalibron loop', miles: 7.25, gainFt: 3700, cls: 2, peaks: [P('mount-democrat'), P('mount-cameron'), P('mount-lincoln'), P('mount-bross')], note: 'From Kite Lake. Bross summit is on private land.' },
  { id: 'grays-torreys', name: 'Grays and Torreys', miles: 8.25, gainFt: 3600, cls: 2, peaks: [P('grays-peak'), P('torreys-peak')] },
  { id: 'belford-oxford', name: 'Belford and Oxford', miles: 11, gainFt: 5900, cls: 2, peaks: [P('mount-belford'), P('mount-oxford')] },
  { id: 'shavano-tabeguache', name: 'Shavano and Tabeguache', miles: 11.25, gainFt: 5600, cls: 2, peaks: [P('mount-shavano'), P('tabeguache-peak')] },
  { id: 'redcloud-sunshine', name: 'Redcloud and Sunshine', miles: 12.25, gainFt: 4800, cls: 2, peaks: [P('redcloud-peak'), P('sunshine-peak')] },
  { id: 'castle-conundrum', name: 'Castle and Conundrum', miles: 14, gainFt: 4850, cls: 2, peaks: [P('castle-peak'), P('conundrum-peak')] },
  { id: 'eolus-north-eolus', name: 'Eolus and North Eolus', miles: 17.5, gainFt: 6150, cls: 3, peaks: [P('mount-eolus'), P('north-eolus')], note: 'From Needleton via Chicago Basin.' },
  { id: 'chicago-basin', name: 'Chicago Basin, all four', miles: 20, gainFt: 7900, cls: 3, peaks: [P('windom-peak'), P('sunlight-peak'), P('mount-eolus'), P('north-eolus')], note: 'Usually a multi-day trip from Needleton.' },
  { id: 'maroon-traverse', name: 'Maroon Bells traverse', miles: 11, gainFt: 5200, cls: 4, peaks: [P('maroon-peak'), P('north-maroon-peak')] },
  { id: 'lindsey-ellingwood-blanca', name: 'Blanca and Ellingwood', miles: 17.5, gainFt: 6900, cls: 3, peaks: [P('blanca-peak'), P('ellingwood-point')], note: 'From the 2WD parking on Lake Como Road.' },
  { id: 'crestones', name: 'Crestone Peak and Needle', miles: 13, gainFt: 5600, cls: 4, peaks: [P('crestone-peak'), P('crestone-needle')] },
  { id: 'kit-carson-challenger', name: 'Challenger and Kit Carson', miles: 15, gainFt: 6250, cls: 3, peaks: [P('challenger-point'), P('kit-carson-mountain')], note: 'From Willow Creek.' },
  { id: 'wilson-el-diente', name: 'Mount Wilson and El Diente', miles: 16, gainFt: 5600, cls: 4, peaks: [P('mount-wilson'), P('el-diente-peak')] },
  { id: 'columbia-harvard', name: 'Columbia and Harvard', miles: 14, gainFt: 6000, cls: 3, peaks: [P('mount-columbia'), P('mount-harvard')] },
  { id: 'massive-elbert', name: 'Massive and Elbert, one day', miles: 19, gainFt: 8500, cls: 2, peaks: [P('mount-massive'), P('mount-elbert')] },
];

/** Single-summit routes. The first one for each peak is its standard route. */
const SINGLE: Record<string, Route[]> = {
  'mount-elbert': [
    { id: 'elbert-ne', name: 'Northeast Ridge', miles: 9.5, gainFt: 4700, cls: 1 },
    { id: 'elbert-e', name: 'East Ridge', miles: 11, gainFt: 4800, cls: 1 },
    { id: 'elbert-black-cloud', name: 'Black Cloud', miles: 11, gainFt: 5300, cls: 2 },
  ],
  'mount-massive': [
    { id: 'massive-e', name: 'East Slopes', miles: 13.75, gainFt: 4500, cls: 2 },
    { id: 'massive-sw', name: 'Southwest Slopes', miles: 7.5, gainFt: 3950, cls: 2 },
  ],
  'mount-harvard': [{ id: 'harvard-s', name: 'South Slopes', miles: 14, gainFt: 4600, cls: 2 }],
  'blanca-peak': [{ id: 'blanca-nw', name: 'Northwest Face', miles: 17, gainFt: 6500, cls: 2, note: 'From the 2WD parking on Lake Como Road.' }],
  'la-plata-peak': [
    { id: 'laplata-nw', name: 'Northwest Ridge', miles: 9.25, gainFt: 4500, cls: 2 },
    { id: 'laplata-ellingwood', name: 'Ellingwood Ridge', miles: 9.5, gainFt: 5800, cls: 3 },
  ],
  'uncompahgre-peak': [{ id: 'uncompahgre-s', name: 'South Ridge', miles: 7.5, gainFt: 3000, cls: 2, note: 'From the 4WD Nellie Creek trailhead.' }],
  'crestone-peak': [{ id: 'crestone-peak-s', name: 'South Face (Red Gully)', miles: 14, gainFt: 5700, cls: 3 }],
  'mount-lincoln': [{ id: 'lincoln-w', name: 'West Ridge', miles: 6, gainFt: 2600, cls: 2 }],
  'castle-peak': [
    { id: 'castle-ne', name: 'Northeast Ridge', miles: 13.5, gainFt: 4600, cls: 2 },
    { id: 'castle-ne-4wd', name: 'Northeast Ridge (from 4WD)', miles: 6.5, gainFt: 2400, cls: 2 },
  ],
  'grays-peak': [{ id: 'grays-n', name: 'North Slopes', miles: 8, gainFt: 3000, cls: 1 }],
  'mount-antero': [{ id: 'antero-w', name: 'West Slopes', miles: 16, gainFt: 5200, cls: 2 }],
  'torreys-peak': [
    { id: 'torreys-s', name: 'South Slopes', miles: 8, gainFt: 3000, cls: 2 },
    { id: 'torreys-kelso', name: 'Kelso Ridge', miles: 6.75, gainFt: 3100, cls: 3 },
  ],
  'quandary-peak': [
    { id: 'quandary-e', name: 'East Ridge', miles: 6.75, gainFt: 3450, cls: 1 },
    { id: 'quandary-w', name: 'West Ridge', miles: 4.5, gainFt: 2950, cls: 3 },
  ],
  'mount-blue-sky': [
    { id: 'bluesky-summit-lake', name: 'From Summit Lake', miles: 5.5, gainFt: 2000, cls: 2 },
    { id: 'bluesky-sawtooth', name: 'Sawtooth from Guanella Pass', miles: 10.75, gainFt: 3900, cls: 3 },
  ],
  'longs-peak': [{ id: 'longs-keyhole', name: 'Keyhole Route', miles: 14.5, gainFt: 5100, cls: 3 }],
  'mount-wilson': [{ id: 'wilson-n', name: 'North Slopes', miles: 16, gainFt: 5100, cls: 4 }],
  'mount-shavano': [{ id: 'shavano-e', name: 'East Slopes', miles: 9.25, gainFt: 4600, cls: 2 }],
  'mount-princeton': [{ id: 'princeton-e', name: 'East Slopes', miles: 6.5, gainFt: 3200, cls: 2, note: 'From the upper road near the radio towers.' }],
  'mount-belford': [{ id: 'belford-nw', name: 'Northwest Ridge', miles: 8, gainFt: 4500, cls: 2 }],
  'crestone-needle': [{ id: 'needle-s', name: 'South Face', miles: 12, gainFt: 4400, cls: 3 }],
  'mount-yale': [{ id: 'yale-sw', name: 'Southwest Slopes', miles: 9.5, gainFt: 4300, cls: 2 }],
  'mount-bross': [{ id: 'bross-w', name: 'West Slopes', miles: 3.5, gainFt: 2250, cls: 2, note: 'Summit is on private land; check current access.' }],
  'kit-carson-mountain': [{ id: 'kit-carson-ave', name: 'Kit Carson Avenue', miles: 15, gainFt: 6250, cls: 3 }],
  'maroon-peak': [{ id: 'maroon-s', name: 'South Ridge', miles: 12, gainFt: 4800, cls: 3 }],
  'tabeguache-peak': [{ id: 'tab-via-shavano', name: 'Via Shavano', miles: 11.25, gainFt: 5600, cls: 2 }],
  'mount-oxford': [{ id: 'oxford-via-belford', name: 'Via Belford', miles: 11, gainFt: 5900, cls: 2 }],
  'mount-sneffels': [
    { id: 'sneffels-s', name: 'South Slopes', miles: 6, gainFt: 2900, cls: 2 },
    { id: 'sneffels-sw', name: 'Southwest Ridge', miles: 6, gainFt: 2900, cls: 3 },
  ],
  'mount-democrat': [{ id: 'democrat-e', name: 'East Slope', miles: 4, gainFt: 2150, cls: 2 }],
  'capitol-peak': [{ id: 'capitol-ne', name: 'Northeast Ridge', miles: 17, gainFt: 5300, cls: 4 }],
  'pikes-peak': [
    { id: 'pikes-crags', name: 'Northwest Slopes (Crags)', miles: 14, gainFt: 4300, cls: 2 },
    { id: 'pikes-barr', name: 'Barr Trail', miles: 26, gainFt: 7500, cls: 1 },
  ],
  'snowmass-mountain': [{ id: 'snowmass-e', name: 'East Slopes', miles: 22, gainFt: 5800, cls: 3 }],
  'windom-peak': [{ id: 'windom-w', name: 'West Ridge', miles: 17, gainFt: 6000, cls: 2, note: 'From Needleton via Chicago Basin.' }],
  'mount-eolus': [{ id: 'eolus-ne', name: 'Northeast Ridge', miles: 17.5, gainFt: 6100, cls: 3, note: 'From Needleton via Chicago Basin.' }],
  'challenger-point': [{ id: 'challenger-n', name: 'North Slope', miles: 12.5, gainFt: 5400, cls: 2 }],
  'mount-columbia': [{ id: 'columbia-w', name: 'West Slopes', miles: 11.5, gainFt: 4250, cls: 2 }],
  'missouri-mountain': [{ id: 'missouri-nw', name: 'Northwest Ridge', miles: 10.5, gainFt: 4500, cls: 2 }],
  'humboldt-peak': [{ id: 'humboldt-w', name: 'West Ridge', miles: 11, gainFt: 4200, cls: 2 }],
  'mount-bierstadt': [{ id: 'bierstadt-w', name: 'West Slopes', miles: 7, gainFt: 2850, cls: 2 }],
  'sunlight-peak': [{ id: 'sunlight-s', name: 'South Slopes', miles: 17, gainFt: 6000, cls: 4, note: 'From Needleton via Chicago Basin.' }],
  'handies-peak': [
    { id: 'handies-sw', name: 'Southwest Slopes (American Basin)', miles: 5.5, gainFt: 2500, cls: 1 },
    { id: 'handies-e', name: 'East Slopes (Grizzly Gulch)', miles: 8, gainFt: 3650, cls: 1 },
  ],
  'culebra-peak': [{ id: 'culebra-nw', name: 'Northwest Ridge', miles: 5, gainFt: 2700, cls: 2, note: 'Private ranch. Reservation and fee required.' }],
  'ellingwood-point': [{ id: 'ellingwood-s', name: 'South Face', miles: 17, gainFt: 6200, cls: 2 }],
  'mount-lindsey': [{ id: 'lindsey-n', name: 'North Face', miles: 8.25, gainFt: 3500, cls: 2 }],
  'little-bear-peak': [{ id: 'littlebear-w', name: 'West Ridge (Hourglass)', miles: 14, gainFt: 6200, cls: 4 }],
  'mount-sherman': [{ id: 'sherman-sw', name: 'Southwest Ridge', miles: 5.25, gainFt: 2100, cls: 2 }],
  'redcloud-peak': [{ id: 'redcloud-ne', name: 'Northeast Ridge', miles: 9, gainFt: 3700, cls: 2 }],
  'pyramid-peak': [{ id: 'pyramid-ne', name: 'Northeast Ridge', miles: 8.25, gainFt: 4500, cls: 4 }],
  'wilson-peak': [{ id: 'wilsonpeak-sw', name: 'Southwest Ridge', miles: 9.5, gainFt: 4000, cls: 3 }],
  'san-luis-peak': [{ id: 'sanluis-ne', name: 'Northeast Ridge', miles: 13.5, gainFt: 3600, cls: 1 }],
  'wetterhorn-peak': [{ id: 'wetterhorn-se', name: 'Southeast Ridge', miles: 7, gainFt: 3300, cls: 3 }],
  'mount-of-the-holy-cross': [{ id: 'holycross-n', name: 'North Ridge', miles: 12, gainFt: 5600, cls: 2 }],
  'huron-peak': [{ id: 'huron-nw', name: 'Northwest Slopes', miles: 6.5, gainFt: 3500, cls: 2, note: 'From the 4WD trailhead past Winfield.' }],
  'sunshine-peak': [{ id: 'sunshine-via-redcloud', name: 'Via Redcloud', miles: 12.25, gainFt: 4800, cls: 2 }],
  'north-maroon-peak': [{ id: 'nmaroon-ne', name: 'Northeast Ridge', miles: 9.25, gainFt: 4500, cls: 4 }],
  'el-diente-peak': [{ id: 'eldiente-n', name: 'North Slopes', miles: 15, gainFt: 5000, cls: 3 }],
  'conundrum-peak': [{ id: 'conundrum-s', name: 'South Ridge', miles: 13.5, gainFt: 4600, cls: 2 }],
  'north-eolus': [{ id: 'neolus-s', name: 'South Ridge', miles: 17, gainFt: 5900, cls: 3, note: 'From Needleton via Chicago Basin.' }],
  'mount-cameron': [{ id: 'cameron-via-democrat', name: 'From Kite Lake', miles: 5.5, gainFt: 2700, cls: 2 }],
};

export const OTHER_ROUTE_ID = 'other';

export function routesFor(peakId: string): Route[] {
  const singles = SINGLE[peakId.replace(/^co-/, '')] ?? [];
  const combos = COMBOS.filter((r) => r.peaks?.includes(peakId));
  return [...singles, ...combos];
}

export function routeById(id: string | undefined): Route | undefined {
  if (!id) return undefined;
  return COMBOS.find((r) => r.id === id) ?? Object.values(SINGLE).flat().find((r) => r.id === id);
}

export function standardRoute(peakId: string): Route | undefined {
  return routesFor(peakId)[0];
}
