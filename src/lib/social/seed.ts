import type { Ascent, Beta, Plan, User } from '../types';

/**
 * Demo crew so the app is alive before a backend is connected. Everything is relative to
 * "now" at first launch, so the feed always looks fresh. Remove once real accounts exist.
 */

export const DEMO_USERS: User[] = [
  { id: 'u_jess', name: 'Jess Alvarez', handle: 'jessclimbs', home: 'Boulder', color: '#5B8DEF', favorites: ['co-longs-peak', 'co-mount-sneffels', 'co-wetterhorn-peak', 'co-capitol-peak'] },
  { id: 'u_marcus', name: 'Marcus Lee', handle: 'marcus.lee', home: 'Denver', color: '#E0A458', favorites: ['co-quandary-peak', 'co-mount-elbert', 'co-pikes-peak'] },
  { id: 'u_priya', name: 'Priya Raman', handle: 'priyaonpeaks', home: 'Golden', color: '#C77DFF', favorites: ['co-mount-bierstadt', 'co-grays-peak', 'co-torreys-peak', 'co-mount-democrat'] },
  { id: 'u_theo', name: 'Theo Brooks', handle: 'theob', home: 'Fort Collins', color: '#4FB07A', favorites: ['co-capitol-peak', 'co-pyramid-peak', 'co-little-bear-peak', 'co-crestone-needle'] },
  { id: 'u_nina', name: 'Nina Kowalski', handle: 'ninak', home: 'Colorado Springs', color: '#EF6F6C', favorites: ['co-pikes-peak'] },
  { id: 'u_diego', name: 'Diego Ortiz', handle: 'diego.o', home: 'Leadville', color: '#56CFE1', favorites: ['co-mount-massive', 'co-la-plata-peak', 'co-mount-elbert'] },
  { id: 'u_avery', name: 'Avery Chen', handle: 'averyc', home: 'Boulder', color: '#F2C14E', favorites: ['co-longs-peak', 'co-maroon-peak'] },
  { id: 'u_sam', name: 'Sam Okafor', handle: 'samok', home: 'Denver', color: '#9AD1D4', favorites: ['co-mount-sherman'] },
];

/** Who the demo "me" follows. Avery and Sam show up as suggestions. */
export const DEMO_FOLLOWING = ['u_jess', 'u_marcus', 'u_priya', 'u_theo', 'u_nina', 'u_diego'];

export const DEMO_WANTS: Record<string, string[]> = {
  u_jess: ['co-capitol-peak', 'co-wetterhorn-peak', 'co-grays-peak'],
  u_marcus: ['co-capitol-peak', 'co-longs-peak'],
  u_priya: ['co-capitol-peak', 'co-longs-peak', 'co-maroon-peak'],
  u_theo: ['co-maroon-peak', 'co-north-maroon-peak'],
  u_nina: ['co-longs-peak', 'co-mount-bierstadt'],
  u_diego: ['co-wetterhorn-peak', 'co-uncompahgre-peak'],
  u_avery: ['co-capitol-peak'],
  u_sam: ['co-quandary-peak'],
};

function day(offset: number, from = Date.now()) {
  const d = new Date(from + offset * 86_400_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Days until the coming Saturday, skipping to the next one if it's only a day away. */
function nextSaturday(from = Date.now()) {
  const add = (6 - new Date(from).getDay() + 7) % 7;
  return add < 2 ? add + 7 : add;
}

let seq = 0;
const id = (p: string) => `${p}_${(seq++).toString(36)}`;

function ascent(
  userId: string,
  peakId: string,
  daysAgo: number,
  extra: Partial<Ascent> = {},
  now = Date.now(),
): Ascent {
  return {
    id: id('a'),
    userId,
    peakId,
    date: day(-daysAgo, now),
    withIds: [],
    guests: [],
    note: '',
    source: 'photo',
    createdAt: now - daysAgo * 86_400_000 + 15 * 3_600_000,
    kudos: [],
    comments: [],
    ...extra,
  };
}

/** One ascent per person for a group climb, all pointing at each other. */
function group(userIds: string[], peakId: string, daysAgo: number, shared: Partial<Ascent>, perUser: Record<string, Partial<Ascent>> = {}, now = Date.now()) {
  return userIds.map((u) => ascent(u, peakId, daysAgo, { ...shared, withIds: userIds.filter((x) => x !== u), ...(perUser[u] ?? {}) }, now));
}

const snow: Beta = { surface: 'Snow', traction: 'Microspikes' };

/** Summer history so every friend has a real passport. */
const HISTORY: Record<string, [string, number][]> = {
  u_jess: [['co-longs-peak', 430], ['co-mount-sneffels', 410], ['co-wilson-peak', 760], ['co-mount-elbert', 820], ['co-mount-massive', 825], ['co-la-plata-peak', 790], ['co-huron-peak', 1150], ['co-mount-yale', 1170], ['co-mount-princeton', 1180], ['co-mount-antero', 445], ['co-handies-peak', 400], ['co-redcloud-peak', 402], ['co-sunshine-peak', 402], ['co-san-luis-peak', 1130], ['co-uncompahgre-peak', 760], ['co-mount-sherman', 1200], ['co-mount-bierstadt', 1210], ['co-pikes-peak', 1500]],
  u_marcus: [['co-mount-elbert', 450], ['co-pikes-peak', 820], ['co-mount-bierstadt', 830], ['co-mount-sherman', 1190], ['co-mount-democrat', 1220], ['co-mount-lincoln', 1220], ['co-mount-bross', 1220], ['co-mount-cameron', 1220], ['co-huron-peak', 470]],
  u_priya: [['co-grays-peak', 420], ['co-torreys-peak', 420], ['co-mount-democrat', 440], ['co-mount-lincoln', 440], ['co-mount-bross', 440], ['co-quandary-peak', 780], ['co-mount-sherman', 800], ['co-mount-elbert', 1160], ['co-handies-peak', 1140], ['co-mount-belford', 1180], ['co-mount-oxford', 1180], ['co-missouri-mountain', 1190]],
  u_theo: [['co-capitol-peak', 455], ['co-pyramid-peak', 470], ['co-little-bear-peak', 800], ['co-blanca-peak', 800], ['co-ellingwood-point', 801], ['co-crestone-needle', 815], ['co-crestone-peak', 816], ['co-kit-carson-mountain', 1170], ['co-challenger-point', 1170], ['co-mount-wilson', 1180], ['co-el-diente-peak', 1180], ['co-wilson-peak', 1181], ['co-snowmass-mountain', 430], ['co-castle-peak', 1520], ['co-conundrum-peak', 1520], ['co-longs-peak', 1530], ['co-mount-eolus', 1540], ['co-north-eolus', 1540], ['co-sunlight-peak', 1541], ['co-windom-peak', 1541], ['co-maroon-peak', 1900]],
  u_nina: [['co-pikes-peak', 460], ['co-mount-sherman', 810], ['co-quandary-peak', 1150]],
  u_diego: [['co-mount-massive', 440], ['co-la-plata-peak', 470], ['co-mount-elbert', 800], ['co-mount-harvard', 805], ['co-mount-columbia', 805], ['co-huron-peak', 830], ['co-mount-belford', 1160], ['co-mount-oxford', 1160], ['co-mount-of-the-holy-cross', 1175], ['co-mount-shavano', 1180], ['co-tabeguache-peak', 1180], ['co-mount-antero', 1190], ['co-mount-princeton', 1200], ['co-mount-yale', 1520]],
  u_avery: [['co-mount-bierstadt', 430], ['co-grays-peak', 800], ['co-torreys-peak', 800], ['co-quandary-peak', 810]],
  u_sam: [['co-mount-bierstadt', 470], ['co-quandary-peak', 820]],
};

export function buildDemo(now = Date.now()) {
  seq = 0;
  const ascents: Ascent[] = [];

  // Fresh, late-season ascents with real beta. These drive the feed.
  ascents.push(
    ...group(['u_jess', 'u_marcus'], 'co-quandary-peak', 1, {
      beta: { ...snow, wind: 'Howling', summitTime: '10:40', route: 'East Ridge' },
      kudos: ['u_priya', 'u_theo', 'u_nina', 'u_diego'],
    }, {
      u_jess: {
        note: 'Winter route is in. Packed trail to about 13k, then wind made the last 400 ft miserable. Goggles were the MVP.',
        comments: [
          { id: 'c1', userId: 'u_priya', text: 'Was the road to the trailhead icy?', at: now - 20 * 3_600_000 },
          { id: 'c2', userId: 'u_jess', text: 'Dry until the last mile. Fine in a Subaru.', at: now - 19 * 3_600_000 },
        ],
      },
      u_marcus: { note: 'Jess broke trail the whole way. I mostly complained.', kudos: ['u_jess', 'u_nina'] },
    }, now),
    ascent('u_priya', 'co-mount-bierstadt', 3, {
      note: 'The willows are frozen solid, so no mud. Guanella Pass road still open but closes soon.',
      beta: { surface: 'Patchy snow', traction: 'Microspikes', wind: 'Breezy', summitTime: '09:55', route: 'West Slopes' },
      kudos: ['u_jess', 'u_marcus', 'u_nina'],
      comments: [{ id: 'c3', userId: 'u_nina', text: 'Perfect, doing this on the weekend. Thank you!', at: now - 2 * 86_400_000 }],
    }, now),
    ascent('u_diego', 'co-mount-elbert', 4, {
      note: 'Postholed above treeline on the way down. Go early while the crust holds.',
      beta: { ...snow, wind: 'Calm', summitTime: '11:20', route: 'Northeast Ridge' },
      kudos: ['u_theo', 'u_jess'],
    }, now),
    ascent('u_theo', 'co-mount-sherman', 6, {
      note: 'Quick one before work. The old mine buildings in fresh snow are something else.',
      beta: { surface: 'Patchy snow', traction: 'None', wind: 'Breezy', summitTime: '08:05', route: 'Southwest Ridge' },
      kudos: ['u_diego'],
    }, now),
    ...group(['u_nina', 'u_jess'], 'co-pikes-peak', 9, {
      beta: { surface: 'Patchy snow', traction: 'Microspikes', wind: 'Calm', summitTime: '12:30', route: 'Barr Trail' },
      kudos: ['u_marcus'],
    }, { u_nina: { note: 'Barr Trail from the bottom. 13 miles, every step worth it. Donuts at the top.' } }, now),
    ...group(['u_marcus', 'u_priya'], 'co-grays-peak', 12, { beta: { ...snow, wind: 'Calm', summitTime: '09:30', route: 'North Slopes' }, kudos: ['u_jess'] }, {}, now),
    ...group(['u_marcus', 'u_priya'], 'co-torreys-peak', 12, { beta: { ...snow, wind: 'Breezy', summitTime: '10:15', route: 'Kelso Ridge' }, kudos: ['u_theo'] }, {
      u_priya: { note: 'Kelso Ridge with a dusting of snow. Took our time on the knife edge.' },
    }, now),
  );

  for (const [userId, list] of Object.entries(HISTORY)) {
    for (const [peakId, daysAgo] of list) ascents.push(ascent(userId, peakId, daysAgo, { beta: { surface: 'Dry', traction: 'None' } }, now));
  }

  const sat = nextSaturday(now);
  const plans: Plan[] = [
    {
      id: 'p_gt', peakId: 'co-grays-peak', date: day(sat, now), start: '05:30', hostId: 'u_jess', memberIds: ['u_jess', 'u_priya'], requestIds: [],
      size: 4, visibility: 'crew', note: 'Grays then Torreys if the wind cooperates. Spikes required. Carpooling from Boulder at 4.', createdAt: now - 10 * 3_600_000,
    },
    {
      id: 'p_bier', peakId: 'co-mount-bierstadt', date: day(sat + 1, now), start: '06:30', hostId: 'u_nina', memberIds: ['u_nina'], requestIds: [],
      size: 3, visibility: 'public', note: 'Chill pace. My first snowy 14er, anyone welcome.', createdAt: now - 26 * 3_600_000,
    },
    {
      id: 'p_cap', peakId: 'co-capitol-peak', date: '2027-07-17', start: '03:30', hostId: 'u_theo', memberIds: ['u_theo', 'u_diego'], requestIds: [],
      size: 4, visibility: 'crew', note: 'Knife edge. Need people solid on class 3. Camping at Capitol Lake the night before.', createdAt: now - 3 * 86_400_000,
    },
    {
      // A climb "you" did yesterday with friends but nobody has logged yet: the plan-to-log loop.
      id: 'p_dem', peakId: 'co-mount-democrat', date: day(-1, now), start: '06:00', hostId: 'u_priya', memberIds: ['u_priya', 'me', 'u_marcus'], requestIds: [],
      size: 4, visibility: 'crew', note: 'Democrat, then Decalibron if we feel good.', createdAt: now - 6 * 86_400_000,
    },
    {
      id: 'p_longs', peakId: 'co-longs-peak', date: '2027-08-07', start: '02:30', hostId: 'u_avery', memberIds: ['u_avery', 'u_sam'], requestIds: [],
      size: 5, visibility: 'public', note: 'Keyhole route, alpine start. Looking for 2 to 3 more who have done a class 3 before.', createdAt: now - 5 * 86_400_000,
    },
  ];

  return { users: DEMO_USERS, following: DEMO_FOLLOWING, wants: DEMO_WANTS, ascents, plans };
}
