import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { CO_14ERS } from '@/data/co14ers';

import { buildDemo } from './social/seed';
import { effort } from './stats';
import type { Ascent, Beta, Notif, Peak, Plan, Question, User } from './types';

const KEY = 'register:v3';
const LEGACY_KEY = 'bagged:v1';
export const ME = 'me';

type State = {
  users: Record<string, User>;
  following: string[];
  wants: Record<string, string[]>;
  ascents: Ascent[];
  plans: Plan[];
  dismissed: string[];
  questions: Question[];
  notes: Notif[];
  /** Everything before this has been seen in the activity inbox. */
  notesSeenAt: number;
  /** True while running on the seeded demo crew instead of a real backend. */
  demo: boolean;
};

const blankMe: User = { id: ME, name: '', handle: '', home: '', color: '#FF7A45', favorites: [] };

function initialState(): State {
  const d = buildDemo();
  return {
    users: Object.fromEntries([[ME, blankMe], ...d.users.map((u) => [u.id, u])]),
    // A new climber follows nobody. The app has to be worth it alone; friends make it better.
    following: [],
    wants: { ...d.wants, [ME]: [] },
    ascents: d.ascents,
    plans: d.plans,
    dismissed: [],
    questions: d.questions,
    notes: [],
    notesSeenAt: Date.now(),
    demo: true,
  };
}

export type FeedItem =
  | { kind: 'ascent'; ascent: Ascent; climbers: string[]; at: number }
  | { kind: 'plan'; plan: Plan; at: number };

export type NewAscent = {
  peakId: string;
  date: string | null;
  withIds?: string[];
  guests?: { name: string; claimToken?: string }[];
  note?: string;
  beta?: Beta;
  source: Ascent['source'];
  photoId?: string;
  planId?: string;
  rating?: number;
  winter?: boolean;
  photos?: string[];
  routeId?: string;
  customMiles?: number;
  customGainFt?: number;
};

type Store = State & {
  ready: boolean;
  peaks: Peak[];
  peakById: Map<string, Peak>;
  me: User;
  /** Back-compat for screens built around "my" summits. */
  profile: User;
  logs: Ascent[];
  summitedIds: Set<string>;
  photoFor: Map<string, string>;

  user: (id: string) => User | undefined;
  ascentsOf: (userId: string) => Ascent[];
  summitedBy: (userId: string) => Set<string>;
  isFollowing: (userId: string) => boolean;
  wantsOf: (userId: string) => string[];
  /** Everyone: all public ascents, like Nextdoor. Friends: you and who you follow. */
  feed: (scope?: 'everyone' | 'friends') => FeedItem[];
  /** Full name for you and people you follow, first name and last initial for everyone else. */
  displayName: (userId: string) => string;
  /** Everyone's ascents of a peak, for the numbers on its page. */
  peakActivity: (peakId: string) => { climbers: number; ascents: number; winter: number; rating: number | null; ratings: number; lastDate: string | null };
  betaFor: (peakId: string, days?: number) => Ascent[];
  friendsWhoClimbed: (peakId: string) => User[];
  friendsWhoWant: (peakId: string) => User[];
  plansFor: (peakId: string) => Plan[];
  upcomingPlans: () => { mine: Plan[]; crew: Plan[]; open: Plan[] };
  /** Past plans I was on that nobody has logged yet. */
  toLog: () => Plan[];
  inCommon: (userId: string) => { climbed: string[]; want: string[] };
  suggestions: () => User[];

  setProfile: (patch: Partial<User>) => void;
  toggleFavorite: (peakId: string) => void;
  toggleWant: (peakId: string) => void;
  follow: (userId: string) => void;
  unfollow: (userId: string) => void;
  logAscent: (a: NewAscent) => Ascent;
  addLogs: (list: NewAscent[]) => Ascent[];
  updateAscent: (id: string, patch: Partial<Ascent>) => void;
  removeAscent: (id: string) => void;
  toggleKudos: (ascentId: string) => void;
  addComment: (ascentId: string, text: string) => void;
  createPlan: (p: Pick<Plan, 'peakId' | 'date' | 'start' | 'size' | 'visibility' | 'note'> & { inviteIds: string[] }) => Plan;
  requestJoin: (planId: string) => void;
  leavePlan: (planId: string) => void;
  approve: (planId: string, userId: string) => void;
  completePlan: (planId: string, extra: { note?: string; beta?: Beta }) => Ascent | null;
  dismissCandidate: (key: string) => void;

  /** Inbox: stored events plus live ones (someone climbed a peak on your list, new conditions). */
  activity: () => Notif[];
  unread: number;
  markSeen: () => void;
  /** Most ascents of a peak in the last 12 months. Ties go to whoever got there first. */
  legend: (peakId: string) => { board: { userId: string; count: number }[]; mine: number };
  /** Feet climbed in the last 30 days. */
  leaderboard: (scope: 'everyone' | 'friends') => { userId: string; feet: number; ascents: number }[];
  questionsFor: (peakId: string) => Question[];
  ask: (peakId: string, text: string) => void;
  answer: (questionId: string, text: string) => void;
  notify: (n: Omit<Notif, 'id'>) => void;
};

const Ctx = createContext<Store | null>(null);

export function candidateKey(peakId: string, date: string | null) {
  return `${peakId}|${date ?? 'undated'}`;
}

/** Old single-player logs become my ascents. */
function migrateLegacy(raw: string, base: State): State {
  try {
    const old = JSON.parse(raw) as {
      logs?: { id: string; peakId: string; date: string | null; partners?: { name: string; claimToken?: string }[]; note?: string; source?: Ascent['source']; createdAt?: number; photoId?: string; taggedBy?: string }[];
      profile?: { name?: string; favorites?: string[] };
      dismissed?: string[];
    };
    const mine: Ascent[] = (old.logs ?? []).map((l) => ({
      id: l.id,
      userId: ME,
      peakId: l.peakId,
      date: l.date,
      withIds: [],
      guests: l.partners ?? [],
      note: l.note ?? '',
      source: l.source ?? 'manual',
      createdAt: l.createdAt ?? Date.now(),
      photoId: l.photoId,
      taggedBy: l.taggedBy,
      kudos: [],
      comments: [],
    }));
    return {
      ...base,
      users: { ...base.users, [ME]: { ...blankMe, name: old.profile?.name ?? '', favorites: old.profile?.favorites ?? [] } },
      ascents: [...mine, ...base.ascents],
      dismissed: old.dismissed ?? [],
    };
  } catch {
    return base;
  }
}

const sortByDate = (a: Ascent, b: Ascent) => (b.date ?? '').localeCompare(a.date ?? '') || b.createdAt - a.createdAt;
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [ready, setReady] = useState(false);
  // "Now" for windows like the last two weeks. Fixed per launch, which is plenty for these.
  const [now] = useState(() => Date.now());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) setState({ ...initialState(), ...JSON.parse(raw) });
        else {
          const legacy = await AsyncStorage.getItem(LEGACY_KEY);
          if (legacy) setState(migrateLegacy(legacy, initialState()));
        }
      } catch {}
      setReady(true);
    })();
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  /** Demo only: other people "respond" a moment later so the social loop is visible. */
  const later = useCallback((ms: number, fn: (s: State) => State) => {
    timers.current.push(setTimeout(() => setState(fn), ms));
  }, []);

  const setProfile = useCallback((patch: Partial<User>) => {
    setState((s) => {
      const me = { ...s.users[ME], ...patch };
      if (patch.name && !me.handle) me.handle = patch.name.toLowerCase().replace(/[^a-z0-9]+/g, '');
      return { ...s, users: { ...s.users, [ME]: me } };
    });
  }, []);

  const toggleFavorite = useCallback((peakId: string) => {
    setState((s) => {
      const favs = s.users[ME].favorites;
      const next = favs.includes(peakId) ? favs.filter((f) => f !== peakId) : favs.length >= 4 ? favs : [...favs, peakId];
      return { ...s, users: { ...s.users, [ME]: { ...s.users[ME], favorites: next } } };
    });
  }, []);

  const toggleWant = useCallback((peakId: string) => {
    setState((s) => {
      const mine = s.wants[ME] ?? [];
      return { ...s, wants: { ...s.wants, [ME]: mine.includes(peakId) ? mine.filter((p) => p !== peakId) : [...mine, peakId] } };
    });
  }, []);

  const follow = useCallback((userId: string) => setState((s) => ({ ...s, following: [...new Set([...s.following, userId])] })), []);
  const unfollow = useCallback((userId: string) => setState((s) => ({ ...s, following: s.following.filter((f) => f !== userId) })), []);

  const addLogs = useCallback((list: NewAscent[]) => {
    const now = Date.now();
    const created: Ascent[] = [];
    for (const [i, a] of list.entries()) {
      const mine: Ascent = {
        id: randomUUID(),
        userId: ME,
        peakId: a.peakId,
        date: a.date,
        withIds: a.withIds ?? [],
        guests: a.guests ?? [],
        note: a.note ?? '',
        beta: a.beta,
        source: a.source,
        photoId: a.photoId,
        planId: a.planId,
        rating: a.rating,
        winter: a.winter ?? isWinter(a.date),
        photos: a.photos,
        routeId: a.routeId,
        customMiles: a.customMiles,
        customGainFt: a.customGainFt,
        createdAt: now + i,
        kudos: [],
        comments: [],
      };
      created.push(mine);
      // Everyone you tagged gets the summit on their passport too.
      for (const uid of mine.withIds) {
        created.push({
          ...mine,
          id: randomUUID(),
          userId: uid,
          withIds: [ME, ...mine.withIds.filter((x) => x !== uid)],
          note: '',
          photoId: undefined,
          photos: undefined,
          rating: undefined,
          taggedBy: ME,
          source: a.source === 'plan' ? 'plan' : 'claim',
        });
      }
    }
    setState((s) => {
      // Same peak, same day is a duplicate. Undated repeats are allowed: people did climb some peaks many times.
      const have = new Set(s.ascents.filter((x) => x.date).map((x) => `${x.userId}|${candidateKey(x.peakId, x.date)}`));
      const fresh = created.filter((x) => !x.date || !have.has(`${x.userId}|${candidateKey(x.peakId, x.date)}`));
      return { ...s, ascents: [...fresh, ...s.ascents] };
    });
    return created.filter((c) => c.userId === ME);
  }, []);

  const notify = useCallback((n: Omit<Notif, 'id'>) => setState((s) => ({ ...s, notes: [{ ...n, id: randomUUID() }, ...s.notes].slice(0, 200) })), []);

  const logAscent = useCallback(
    (a: NewAscent) => {
      const [mine] = addLogs([a]);
      // Demo: the community notices. Friends first, then other climbers. Each reaction is a notification.
      const pool = [...state.following, ...Object.keys(state.users).filter((u) => u !== ME && !state.following.includes(u))];
      pool.slice(0, 4).forEach((uid, i) =>
        later(2500 + i * 2200, (s) => ({
          ...s,
          ascents: s.ascents.map((x) => (x.id === mine.id && !x.kudos.includes(uid) ? { ...x, kudos: [...x.kudos, uid] } : x)),
          notes: [{ id: randomUUID(), kind: 'kudos' as const, at: Date.now(), userId: uid, ascentId: mine.id, peakId: mine.peakId }, ...s.notes],
        })),
      );
      if (pool[1] && a.note) {
        const text = 'Nice one. How was the trail above treeline?';
        later(9000, (s) => ({
          ...s,
          ascents: s.ascents.map((x) => (x.id === mine.id ? { ...x, comments: [...x.comments, { id: randomUUID(), userId: pool[1], text, at: Date.now() }] } : x)),
          notes: [{ id: randomUUID(), kind: 'comment' as const, at: Date.now(), userId: pool[1], ascentId: mine.id, peakId: mine.peakId, text }, ...s.notes],
        }));
      }
      return mine;
    },
    [addLogs, later, state.following, state.users],
  );

  const ask = useCallback(
    (peakId: string, text: string) => {
      const q: Question = { id: randomUUID(), peakId, userId: ME, text: text.trim(), at: Date.now(), answers: [] };
      if (!q.text) return;
      setState((s) => ({ ...s, questions: [q, ...s.questions] }));
      // Demo: someone who climbed it lately answers.
      const recent = state.ascents.filter((x) => x.peakId === peakId && x.userId !== ME).sort(sortByDate)[0];
      const who = recent?.userId ?? 'u_jess';
      const b = recent?.beta;
      const reply = b?.surface
        ? `I was up there ${recent.date ? `on ${formatDate(recent.date)}` : 'recently'}. ${b.surface === 'Dry' ? 'Dry the whole way.' : `${b.surface} above treeline${b.traction && b.traction !== 'None' ? `, brought ${b.traction.toLowerCase()}` : ''}.`} Start early either way.`
        : 'Went a few weeks back. The trail is easy to follow, just be off the top before the afternoon clouds build.';
      later(5000, (s) => ({
        ...s,
        questions: s.questions.map((x) => (x.id === q.id ? { ...x, answers: [...x.answers, { id: randomUUID(), userId: who, text: reply, at: Date.now() }] } : x)),
        notes: [{ id: randomUUID(), kind: 'answer' as const, at: Date.now(), userId: who, peakId, questionId: q.id, text: reply }, ...s.notes],
      }));
    },
    [later, state.ascents],
  );

  const answer = useCallback((questionId: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    setState((s) => ({ ...s, questions: s.questions.map((q) => (q.id === questionId ? { ...q, answers: [...q.answers, { id: randomUUID(), userId: ME, text: t, at: Date.now() }] } : q)) }));
  }, []);

  const markSeen = useCallback(() => setState((s) => ({ ...s, notesSeenAt: Date.now() })), []);

  const updateAscent = useCallback((id: string, patch: Partial<Ascent>) => {
    setState((s) => ({ ...s, ascents: s.ascents.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  }, []);

  const removeAscent = useCallback((id: string) => setState((s) => ({ ...s, ascents: s.ascents.filter((a) => a.id !== id) })), []);

  const toggleKudos = useCallback((ascentId: string) => {
    setState((s) => ({
      ...s,
      ascents: s.ascents.map((a) => (a.id === ascentId ? { ...a, kudos: a.kudos.includes(ME) ? a.kudos.filter((k) => k !== ME) : [...a.kudos, ME] } : a)),
    }));
  }, []);

  const addComment = useCallback((ascentId: string, text: string) => {
    const c = { id: randomUUID(), userId: ME, text: text.trim(), at: Date.now() };
    if (!c.text) return;
    setState((s) => ({ ...s, ascents: s.ascents.map((a) => (a.id === ascentId ? { ...a, comments: [...a.comments, c] } : a)) }));
  }, []);

  const createPlan = useCallback<Store['createPlan']>(
    ({ inviteIds, ...p }) => {
      const plan: Plan = { ...p, id: randomUUID(), hostId: ME, memberIds: [ME], requestIds: [], createdAt: Date.now() };
      setState((s) => ({ ...s, plans: [plan, ...s.plans] }));
      // Demo: invited friends say yes one by one.
      inviteIds.slice(0, p.size - 1).forEach((uid, i) =>
        later(1800 + i * 1500, (s) => ({ ...s, plans: s.plans.map((x) => (x.id === plan.id && !x.memberIds.includes(uid) ? { ...x, memberIds: [...x.memberIds, uid] } : x)) })),
      );
      return plan;
    },
    [later],
  );

  const requestJoin = useCallback(
    (planId: string) => {
      setState((s) => ({ ...s, plans: s.plans.map((p) => (p.id === planId ? { ...p, requestIds: [...new Set([...p.requestIds, ME])] } : p)) }));
      // Demo: the host approves.
      later(1600, (s) => ({
        ...s,
        plans: s.plans.map((p) =>
          p.id === planId && p.requestIds.includes(ME) && p.memberIds.length < p.size
            ? { ...p, requestIds: p.requestIds.filter((r) => r !== ME), memberIds: [...p.memberIds, ME] }
            : p,
        ),
      }));
    },
    [later],
  );

  const leavePlan = useCallback((planId: string) => {
    setState((s) => ({
      ...s,
      plans: s.plans
        .map((p) => (p.id === planId ? { ...p, memberIds: p.memberIds.filter((m) => m !== ME), requestIds: p.requestIds.filter((m) => m !== ME) } : p))
        .filter((p) => !(p.id === planId && p.hostId === ME)),
    }));
  }, []);

  const approve = useCallback((planId: string, userId: string) => {
    setState((s) => ({
      ...s,
      plans: s.plans.map((p) => (p.id === planId ? { ...p, requestIds: p.requestIds.filter((r) => r !== userId), memberIds: [...new Set([...p.memberIds, userId])] } : p)),
    }));
  }, []);

  const completePlan = useCallback<Store['completePlan']>(
    (planId, extra) => {
      const plan = state.plans.find((p) => p.id === planId);
      if (!plan) return null;
      const [mine] = addLogs([
        { peakId: plan.peakId, date: plan.date <= today() ? plan.date : today(), withIds: plan.memberIds.filter((m) => m !== ME), note: extra.note, beta: extra.beta, source: 'plan', planId },
      ]);
      setState((s) => ({ ...s, plans: s.plans.map((p) => (p.id === planId ? { ...p, done: true } : p)) }));
      return mine;
    },
    [state.plans, addLogs],
  );

  const dismissCandidate = useCallback((key: string) => setState((s) => ({ ...s, dismissed: [...new Set([...s.dismissed, key])] })), []);

  const value = useMemo<Store>(() => {
    const peakById = new Map(CO_14ERS.map((p) => [p.id, p]));
    const me = state.users[ME];
    const ascentsOf = (uid: string) => state.ascents.filter((a) => a.userId === uid).sort(sortByDate);
    const summitedBy = (uid: string) => new Set(state.ascents.filter((a) => a.userId === uid).map((a) => a.peakId));
    const mine = ascentsOf(ME);
    const followingSet = new Set(state.following);
    const circle = new Set([ME, ...state.following]);
    const upcoming = state.plans.filter((p) => !p.done && p.date >= today());

    const isPublic = (uid: string) => uid === ME || (state.users[uid]?.privacy ?? 'public') === 'public';
    const feed = (scope: 'everyone' | 'friends' = 'everyone'): FeedItem[] => {
      // One card per group climb, preferring the version with a note.
      const groups = new Map<string, Ascent[]>();
      for (const a of state.ascents) {
        if (scope === 'friends' ? !circle.has(a.userId) : !(circle.has(a.userId) || isPublic(a.userId))) continue;
        // Backfilled history without a date isn't news.
        if (!a.date && a.source === 'manual' && a.userId === ME && !a.note) continue;
        const key = `${a.peakId}|${a.date}|${[a.userId, ...a.withIds].sort().join(',')}`;
        groups.set(key, [...(groups.get(key) ?? []), a]);
      }
      const items: FeedItem[] = [];
      for (const list of groups.values()) {
        const best = list.find((a) => a.userId === ME) ?? list.find((a) => a.note) ?? list[0];
        const climbers = [best.userId, ...best.withIds].filter((u, i, arr) => arr.indexOf(u) === i);
        items.push({ kind: 'ascent', ascent: best, climbers, at: best.createdAt });
      }
      return items.sort((a, b) => b.at - a.at).slice(0, 60);
    };

    const myWants = new Set(state.wants[ME] ?? []);
    const twoWeeks = now - 14 * 86_400_000;
    const live: Notif[] = [];
    for (const a of state.ascents) {
      if (a.userId === ME || a.createdAt < twoWeeks || !myWants.has(a.peakId)) continue;
      live.push({ id: `w-${a.id}`, kind: a.beta?.surface ? 'conditions' : 'want-climbed', at: a.createdAt, userId: a.userId, peakId: a.peakId, ascentId: a.id });
    }
    for (const q of state.questions) {
      if (q.userId === ME || q.at < twoWeeks) continue;
      if (state.ascents.some((a) => a.userId === ME && a.peakId === q.peakId)) live.push({ id: `q-${q.id}`, kind: 'question', at: q.at, userId: q.userId, peakId: q.peakId, questionId: q.id, text: q.text });
    }
    const acts = [...state.notes, ...live].sort((a, b) => b.at - a.at).slice(0, 80);

    const yearAgo = now - 365 * 86_400_000;
    const legend = (peakId: string) => {
      const counts = new Map<string, { count: number; first: number }>();
      for (const a of state.ascents) {
        if (a.peakId !== peakId || !a.date || new Date(a.date).getTime() < yearAgo) continue;
        if (!isPublic(a.userId) && !circle.has(a.userId)) continue;
        const c = counts.get(a.userId) ?? { count: 0, first: a.createdAt };
        counts.set(a.userId, { count: c.count + 1, first: Math.min(c.first, a.createdAt) });
      }
      const board = [...counts.entries()].sort((a, b) => b[1].count - a[1].count || a[1].first - b[1].first).map(([userId, v]) => ({ userId, count: v.count }));
      return { board, mine: counts.get(ME)?.count ?? 0 };
    };
    // Rolling 30 days, so the board is never empty on the 2nd of the month.
    const d0 = new Date(now - 30 * 86_400_000);
    const monthStart = `${d0.getFullYear()}-${String(d0.getMonth() + 1).padStart(2, '0')}-${String(d0.getDate()).padStart(2, '0')}`;
    const leaderboard = (scope: 'everyone' | 'friends') => {
      const per = new Map<string, { feet: number; ascents: number; keys: Set<string> }>();
      for (const a of state.ascents) {
        if (!a.date || a.date < monthStart) continue;
        if (scope === 'friends' ? !circle.has(a.userId) : !(circle.has(a.userId) || isPublic(a.userId))) continue;
        const e = effort(a);
        const row = per.get(a.userId) ?? { feet: 0, ascents: 0, keys: new Set<string>() };
        row.ascents += 1;
        if (!row.keys.has(e.key)) {
          row.keys.add(e.key);
          row.feet += e.feet;
        }
        per.set(a.userId, row);
      }
      if (!per.has(ME)) per.set(ME, { feet: 0, ascents: 0, keys: new Set() });
      return [...per.entries()].map(([userId, r]) => ({ userId, feet: r.feet, ascents: r.ascents })).sort((a, b) => b.feet - a.feet);
    };

    return {
      ...state,
      ready,
      activity: () => acts,
      unread: acts.filter((n) => n.at > state.notesSeenAt).length,
      markSeen,
      legend,
      leaderboard,
      questionsFor: (peakId) => state.questions.filter((q) => q.peakId === peakId).sort((a, b) => b.at - a.at),
      ask,
      answer,
      notify,
      peaks: CO_14ERS,
      peakById,
      me,
      profile: me,
      logs: mine,
      summitedIds: new Set(mine.map((a) => a.peakId)),
      photoFor: new Map(mine.filter((l) => l.photoId).reverse().map((l) => [l.peakId, l.photoId!])),

      user: (id) => state.users[id],
      ascentsOf,
      summitedBy,
      isFollowing: (id) => followingSet.has(id),
      wantsOf: (id) => state.wants[id] ?? [],
      feed,
      displayName: (uid) => {
        const u = state.users[uid];
        if (!u) return 'Someone';
        if (uid === ME) return 'You';
        if (followingSet.has(uid)) return u.name;
        const [first, ...rest] = u.name.split(' ');
        const last = rest.at(-1);
        return last ? `${first} ${last[0]}.` : first;
      },
      peakActivity: (peakId) => {
        const list = state.ascents.filter((a) => a.peakId === peakId);
        const rated = list.filter((a) => a.rating);
        return {
          climbers: new Set(list.map((a) => a.userId)).size,
          ascents: list.length,
          winter: list.filter((a) => a.winter).length,
          rating: rated.length ? rated.reduce((n, a) => n + (a.rating ?? 0), 0) / rated.length : null,
          ratings: rated.length,
          lastDate: list.map((a) => a.date).filter((d): d is string => !!d).sort().at(-1) ?? null,
        };
      },
      betaFor: (peakId, days = 45) => {
        const cutoff = Date.now() - days * 86_400_000;
        const seen = new Set<string>();
        return state.ascents
          .filter((a) => a.peakId === peakId && a.beta && a.beta.surface && a.date && new Date(a.date).getTime() >= cutoff)
          .sort(sortByDate)
          .filter((a) => {
            // One report per group climb.
            const k = `${a.date}|${[a.userId, ...a.withIds].sort().join(',')}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
      },
      friendsWhoClimbed: (peakId) => state.following.filter((u) => state.ascents.some((a) => a.userId === u && a.peakId === peakId)).map((u) => state.users[u]),
      friendsWhoWant: (peakId) => state.following.filter((u) => (state.wants[u] ?? []).includes(peakId)).map((u) => state.users[u]),
      plansFor: (peakId) => upcoming.filter((p) => p.peakId === peakId && (circle.has(p.hostId) || p.visibility === 'public' || p.memberIds.includes(ME))),
      upcomingPlans: () => ({
        mine: upcoming.filter((p) => p.memberIds.includes(ME) || p.requestIds.includes(ME)).sort((a, b) => a.date.localeCompare(b.date)),
        crew: upcoming
          .filter((p) => !p.memberIds.includes(ME) && !p.requestIds.includes(ME) && p.memberIds.some((m) => followingSet.has(m)))
          .sort((a, b) => a.date.localeCompare(b.date)),
        open: upcoming
          .filter((p) => p.visibility === 'public' && !p.memberIds.includes(ME) && !p.requestIds.includes(ME) && !p.memberIds.some((m) => followingSet.has(m)))
          .sort((a, b) => a.date.localeCompare(b.date)),
      }),
      toLog: () => state.plans.filter((p) => !p.done && p.date < today() && p.memberIds.includes(ME)),
      inCommon: (uid) => {
        const theirs = summitedBy(uid);
        const mineSet = summitedBy(ME);
        const myWants = state.wants[ME] ?? [];
        return { climbed: [...theirs].filter((p) => mineSet.has(p)), want: myWants.filter((p) => (state.wants[uid] ?? []).includes(p)) };
      },
      suggestions: () => Object.values(state.users).filter((u) => u.id !== ME && !followingSet.has(u.id)),

      setProfile,
      toggleFavorite,
      toggleWant,
      follow,
      unfollow,
      logAscent,
      addLogs,
      updateAscent,
      removeAscent,
      toggleKudos,
      addComment,
      createPlan,
      requestJoin,
      leavePlan,
      approve,
      completePlan,
      dismissCandidate,
    };
  }, [state, ready, now, markSeen, ask, answer, notify, setProfile, toggleFavorite, toggleWant, follow, unfollow, logAscent, addLogs, updateAscent, removeAscent, toggleKudos, addComment, createPlan, requestJoin, leavePlan, approve, completePlan, dismissCandidate]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}

/** Calendar winter: Dec 21 through Mar 20. The date most 14er winter lists go by. */
export function isWinter(date: string | null | undefined) {
  if (!date) return false;
  const [, m, d] = date.split('-').map(Number);
  return (m === 12 && d >= 21) || m === 1 || m === 2 || (m === 3 && d <= 20);
}

export function formatDate(date: string | null) {
  if (!date) return 'Date unknown';
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatPlanDate(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "2h", "3d", "Oct 12" */
export function ago(ts: number) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Days since a YYYY-MM-DD date. */
export function daysSince(date: string | null) {
  if (!date) return Infinity;
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86_400_000);
}
