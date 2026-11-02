import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Null when the app runs without a backend. Logging still works; claim links don't. */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      })
    : null;

export const hasBackend = supabase !== null;

/** Public link for a claim. Uses the hosted web app if set, otherwise a deep link. */
export function claimUrl(token: string) {
  const web = process.env.EXPO_PUBLIC_WEB_URL;
  return web ? `${web.replace(/\/$/, '')}/claim/${token}` : Linking.createURL(`/claim/${token}`);
}

export type ClaimInfo = {
  token: string;
  peak_id: string;
  climb_date: string | null;
  tagger_name: string;
  partner_name: string;
  claimed: boolean;
};

/** Create one claim token per partner. Returns tokens in the same order as names. */
export async function createClaims(args: {
  peakId: string;
  date: string | null;
  taggerName: string;
  partnerNames: string[];
}): Promise<string[]> {
  if (!supabase) throw new Error('No backend configured');
  const { data, error } = await supabase.rpc('create_climb_with_tags', {
    p_peak_id: args.peakId,
    p_climb_date: args.date,
    p_tagger_name: args.taggerName,
    p_partner_names: args.partnerNames,
  });
  if (error) throw error;
  return (data as { token: string }[]).map((r) => r.token);
}

export async function fetchClaim(token: string): Promise<ClaimInfo | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_claim', { p_token: token });
  if (error) throw error;
  return (data as ClaimInfo[])[0] ?? null;
}

export async function markClaimed(token: string, claimerName: string) {
  if (!supabase) return;
  const { error } = await supabase.rpc('claim_tag', { p_token: token, p_claimer_name: claimerName });
  if (error) throw error;
}
