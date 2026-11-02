import { createClaims, hasBackend } from './supabase';

type Partner = { name: string; claimToken?: string };

/**
 * Turn partner names into Partner records, creating claim links on the server for any
 * that don't have one yet. Without a backend, partners are saved with no link.
 */
export async function withClaimLinks(args: {
  peakId: string;
  date: string | null;
  taggerName: string;
  existing: Partner[];
  names: string[];
}): Promise<Partner[]> {
  const byName = new Map(args.existing.map((p) => [p.name, p]));
  // Copies, so stored partner objects are never mutated.
  const result: Partner[] = args.names.map((n) => ({ ...(byName.get(n) ?? { name: n }) }));
  const needLinks = result.filter((p) => !p.claimToken);
  if (!hasBackend || needLinks.length === 0) return result;

  const tokens = await createClaims({
    peakId: args.peakId,
    date: args.date,
    taggerName: args.taggerName,
    partnerNames: needLinks.map((p) => p.name),
  });
  needLinks.forEach((p, i) => (p.claimToken = tokens[i]));
  return result;
}
