import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, useStore } from '@/lib/store';
import { fetchClaim, hasBackend, markClaimed, type ClaimInfo } from '@/lib/supabase';

/**
 * Landing page for a claim link. Works on the web without an account, so a friend can
 * see what they were tagged in before installing anything.
 */
export default function ClaimScreen() {
  const t = useTheme();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { peakById, profile, setProfile, addLogs, logs } = useStore();
  const [claim, setClaim] = useState<ClaimInfo | null | undefined>(undefined);
  const [name, setName] = useState(profile.name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClaim(token).then(setClaim).catch(() => setClaim(null));
  }, [token]);

  if (!hasBackend) {
    return (
      <Screen>
        <ThemedText>Claim links need the Bagged server. Ask whoever sent this to try again later.</ThemedText>
      </Screen>
    );
  }
  if (claim === undefined) return <Screen><ActivityIndicator /></Screen>;
  if (claim === null) return <Screen><ThemedText>This link doesn&apos;t work anymore.</ThemedText></Screen>;

  const peak = peakById.get(claim.peak_id);
  const already = logs.some((l) => l.peakId === claim.peak_id && l.date === claim.climb_date);

  async function accept() {
    if (!claim) return;
    setSaving(true);
    try {
      const finalName = name.trim() || claim.partner_name;
      if (!profile.name) setProfile({ name: finalName });
      if (!already) {
        addLogs([
          {
            peakId: claim.peak_id,
            date: claim.climb_date,
            partners: [{ name: claim.tagger_name }],
            note: '',
            source: 'claim',
            taggedBy: claim.tagger_name,
          },
        ]);
      }
      await markClaimed(claim.token, finalName).catch(() => {});
      router.replace('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <ThemedText type="small" themeColor="textSecondary">
          {claim.tagger_name.toUpperCase()} TAGGED YOU
        </ThemedText>
        <ThemedText type="subtitle">{peak?.name ?? 'A summit'}</ThemedText>
        <ThemedText themeColor="textSecondary">
          {formatDate(claim.climb_date)}
          {peak ? ` · ${peak.elevationFt.toLocaleString()} ft` : ''}
        </ThemedText>
      </View>

      <Card>
        <ThemedText>
          You summited {peak?.name ?? 'this peak'} with {claim.tagger_name}. Claim it and it goes on your summit passport.
        </ThemedText>
        {!profile.name && (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={claim.partner_name}
            placeholderTextColor={t.textSecondary}
            style={[styles.input, { color: t.text, borderColor: t.border }]}
          />
        )}
        <Button title={already ? 'Already on your passport' : 'Claim it'} disabled={already} loading={saving} onPress={accept} />
      </Card>
      <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
        Then scan your photos to find every other summit you&apos;ve done.
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: Spacing.one, marginTop: Spacing.four },
  input: { borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.three, fontSize: 16 },
});
