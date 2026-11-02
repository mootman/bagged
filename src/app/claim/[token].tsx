import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { PeakPoster } from '@/components/peak-poster';
import { Body, Button, Display, Label, Screen } from '@/components/ui';
import { APP_NAME } from '@/constants/brand';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { success } from '@/lib/haptics';
import { formatDate, useStore } from '@/lib/store';
import { fetchClaim, hasBackend, markClaimed, type ClaimInfo } from '@/lib/supabase';

const c = Colors.dark;

/**
 * Landing page for a claim link. Works on the web without an account, so a friend can see
 * what they were tagged in before installing anything.
 */
export default function ClaimScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { peakById, profile, setProfile, addLogs, logs } = useStore();
  const [claim, setClaim] = useState<ClaimInfo | null | undefined>(undefined);
  const [name, setName] = useState(profile.name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClaim(token).then(setClaim).catch(() => setClaim(null));
  }, [token]);

  if (!hasBackend) return <Screen><Body>Claim links need the {APP_NAME} server. Ask whoever sent this to try again later.</Body></Screen>;
  if (claim === undefined) return <Screen><ActivityIndicator color={c.accent} /></Screen>;
  if (claim === null) return <Screen><Body>This link doesn&apos;t work anymore.</Body></Screen>;

  const peak = peakById.get(claim.peak_id);
  const already = logs.some((l) => l.peakId === claim.peak_id && l.date === claim.climb_date);

  async function accept() {
    if (!claim) return;
    setSaving(true);
    try {
      const finalName = name.trim() || claim.partner_name;
      if (!profile.name) setProfile({ name: finalName });
      if (!already) {
        addLogs([{ peakId: claim.peak_id, date: claim.climb_date, guests: [{ name: claim.tagger_name }], note: '', source: 'claim' }]);
      }
      await markClaimed(claim.token, finalName).catch(() => {});
      success();
      router.replace('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        {peak && <PeakPoster peak={peak} width={150} climbed={false} showTitle={false} />}
        <Label color={c.accent}>{claim.tagger_name} tagged you</Label>
        <Display size={36} style={{ textAlign: 'center' }}>
          {peak?.name ?? 'A summit'}
        </Display>
        <Body muted style={{ textAlign: 'center' }}>
          {formatDate(claim.climb_date)}
          {peak ? `  ·  ${peak.elevationFt.toLocaleString()} ft` : ''}
        </Body>
      </View>

      {!profile.name && (
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={`Your name (${claim.partner_name}?)`}
          placeholderTextColor={c.textMuted}
          style={styles.input}
        />
      )}
      <Button title={already ? 'Already in your register' : 'Sign it into my register'} disabled={already} loading={saving} onPress={accept} />
      <Body muted style={{ textAlign: 'center', fontSize: 13 }}>
        Then scan your photos to find every other summit you&apos;ve stood on.
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.two, marginTop: Spacing.four, marginBottom: Spacing.two },
  input: { backgroundColor: c.backgroundElement, color: c.text, borderRadius: Radius.md, padding: Spacing.three, fontSize: 16 },
});
