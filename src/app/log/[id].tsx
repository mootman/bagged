import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Share, StyleSheet, View } from 'react-native';

import { PartnerEditor } from '@/components/partner-editor';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, useStore } from '@/lib/store';
import { claimUrl, hasBackend } from '@/lib/supabase';
import { withClaimLinks } from '@/lib/tagging';
import type { Partner } from '@/lib/types';

export default function LogScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { logs, peakById, profile, updateLog, removeLog } = useStore();
  const log = logs.find((l) => l.id === id);
  const [editing, setEditing] = useState(false);
  const [names, setNames] = useState<string[]>(log?.partners.map((p) => p.name) ?? []);
  const [saving, setSaving] = useState(false);

  if (!log) return <Screen><ThemedText>This summit was removed.</ThemedText></Screen>;
  const peak = peakById.get(log.peakId);

  async function sendLink(p: Partner) {
    if (!p.claimToken || !peak || !log) return;
    const url = claimUrl(p.claimToken);
    const message = `You summited ${peak.name} with ${profile.name || 'me'} on ${formatDate(log.date)}. Claim it on Bagged: ${url}`;
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(message);
      Alert.alert('Copied', 'Paste it to ' + p.name);
    } else {
      await Share.share({ message });
    }
  }

  async function savePartners() {
    if (!log) return;
    setSaving(true);
    try {
      const partners = await withClaimLinks({
        peakId: log.peakId,
        date: log.date,
        taggerName: profile.name || 'A friend',
        existing: log.partners,
        names,
      });
      updateLog(log.id, { partners });
      setEditing(false);
    } catch (e) {
      Alert.alert('Could not create links', String(e));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    const go = () => {
      removeLog(log!.id);
      router.back();
    };
    if (Platform.OS === 'web') go();
    else Alert.alert('Remove this summit?', undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: go }]);
  }

  return (
    <Screen>
      <View style={{ gap: Spacing.one }}>
        <ThemedText type="subtitle">{peak?.name}</ThemedText>
        <ThemedText themeColor="textSecondary">
          {formatDate(log.date)}
          {peak ? ` · ${peak.elevationFt.toLocaleString()} ft` : ''}
          {log.taggedBy ? ` · tagged by ${log.taggedBy}` : ''}
        </ThemedText>
      </View>
      {log.note ? <ThemedText>{log.note}</ThemedText> : null}

      <Button title="Make a summit card" onPress={() => router.push(`/share/${log.id}`)} />

      <SectionTitle>Crew</SectionTitle>
      {editing ? (
        <Card>
          <PartnerEditor names={names} onChange={setNames} />
          <Button title="Save crew" loading={saving} onPress={savePartners} />
        </Card>
      ) : (
        <>
          {log.partners.map((p) => (
            <Card key={p.name} style={styles.partner}>
              <ThemedText type="smallBold" style={{ flex: 1 }}>
                {p.name}
              </ThemedText>
              {p.claimToken ? (
                <Button title="Send claim link" variant="secondary" onPress={() => sendLink(p)} style={{ minHeight: 38 }} />
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  {hasBackend ? 'No link yet' : 'Links need the server set up'}
                </ThemedText>
              )}
            </Card>
          ))}
          <Button title={log.partners.length ? 'Edit crew' : 'Tag who you climbed with'} variant="secondary" onPress={() => setEditing(true)} />
        </>
      )}

      <Button title="Remove summit" variant="ghost" onPress={confirmDelete} style={{ marginTop: Spacing.four }} />
      <ThemedText type="small" style={{ color: t.textSecondary, textAlign: 'center' }}>
        Logged from {log.source === 'photo' ? 'your photos' : log.source === 'gpx' ? 'a GPS track' : log.source === 'claim' ? 'a friend’s tag' : 'manual entry'}
      </ThemedText>
    </Screen>
  );
}

const styles = StyleSheet.create({ partner: { flexDirection: 'row', alignItems: 'center' } });
