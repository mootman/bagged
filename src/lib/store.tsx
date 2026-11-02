import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { CO_14ERS } from '@/data/co14ers';

import type { Peak, Profile, SummitLog } from './types';

const KEY = 'bagged:v1';

type State = { logs: SummitLog[]; profile: Profile; dismissed: string[] };

const initial: State = { logs: [], profile: { name: '', favorites: [] }, dismissed: [] };

type Store = State & {
  ready: boolean;
  peaks: Peak[];
  peakById: Map<string, Peak>;
  addLogs: (logs: Omit<SummitLog, 'id' | 'createdAt'>[]) => SummitLog[];
  updateLog: (id: string, patch: Partial<SummitLog>) => void;
  removeLog: (id: string) => void;
  setProfile: (patch: Partial<Profile>) => void;
  toggleFavorite: (peakId: string) => void;
  /** Hide a detected candidate the user said no to, so rescans don't show it again. */
  dismissCandidate: (key: string) => void;
  /** Peak ids with at least one log. */
  summitedIds: Set<string>;
  /** Most recent summit photo per peak, for posters. */
  photoFor: Map<string, string>;
};

const Ctx = createContext<Store | null>(null);

export function candidateKey(peakId: string, date: string | null) {
  return `${peakId}|${date ?? 'undated'}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setState({ ...initial, ...JSON.parse(raw) }))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const addLogs = useCallback((input: Omit<SummitLog, 'id' | 'createdAt'>[]) => {
    const now = Date.now();
    const created = input.map((l, i) => ({ ...l, id: randomUUID(), createdAt: now + i }));
    setState((s) => {
      // One log per peak per day.
      const have = new Set(s.logs.map((l) => candidateKey(l.peakId, l.date)));
      const fresh = created.filter((l) => !have.has(candidateKey(l.peakId, l.date)));
      return { ...s, logs: [...fresh, ...s.logs] };
    });
    return created;
  }, []);

  const updateLog = useCallback((id: string, patch: Partial<SummitLog>) => {
    setState((s) => ({ ...s, logs: s.logs.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }, []);

  const removeLog = useCallback((id: string) => {
    setState((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== id) }));
  }, []);

  const setProfile = useCallback((patch: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  }, []);

  const toggleFavorite = useCallback((peakId: string) => {
    setState((s) => {
      const favs = s.profile.favorites;
      const next = favs.includes(peakId)
        ? favs.filter((f) => f !== peakId)
        : favs.length >= 4
          ? favs
          : [...favs, peakId];
      return { ...s, profile: { ...s.profile, favorites: next } };
    });
  }, []);

  const dismissCandidate = useCallback((key: string) => {
    setState((s) => ({ ...s, dismissed: [...new Set([...s.dismissed, key])] }));
  }, []);

  const value = useMemo<Store>(() => {
    const peakById = new Map(CO_14ERS.map((p) => [p.id, p]));
    return {
      ...state,
      ready,
      peaks: CO_14ERS,
      peakById,
      addLogs,
      updateLog,
      removeLog,
      setProfile,
      toggleFavorite,
      dismissCandidate,
      summitedIds: new Set(state.logs.map((l) => l.peakId)),
      photoFor: new Map(
        state.logs
          .filter((l) => l.photoId)
          .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
          .map((l) => [l.peakId, l.photoId!]),
      ),
    };
  }, [state, ready, addLogs, updateLog, removeLog, setProfile, toggleFavorite, dismissCandidate]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}

export function formatDate(date: string | null) {
  if (!date) return 'Date unknown';
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
