import * as Clipboard from 'expo-clipboard';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { Backdrop } from '@/components/backdrop';
import { PartnerEditor } from '@/components/partner-editor';
import { Body, Button, Card, Display, Label, Screen, SectionHeader } from '@/components/ui';
import { APP_NAME } from '@/constants/brand';
import { Colors, Spacing } from '@/constants/theme';
import { success } from '@/lib/haptics';
import { formatDate, useStore } from '@/lib/store';
import { claimUrl, hasBackend } from '@/lib/supabase';
import { withClaimLinks } from '@/lib/tagging';
import type { Partner } from '@/lib/types';

const c = Colors.dark;

export default function LogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { logs, peakById, profile, updateLog, removeLog, photoFor } = useStore();
  const log = logs.find((l) => l.id === id);
  const [editing, setEditing] = useState(false);
  const [names, setNames] = useState<string[]>(log?.partners.map((p) => p.name) ?? []);
  const [saving, setSaving] = useState(false);

  if (!log) return <Screen><Body>This summit was removed.</Body></Screen>;
  const peak = peakById.get(log.peakId);
  if (!peak) return <Screen><Body>Unknown peak.</Body></Screen>;

  async function sendLink(p: Partner) {
    if (!p.claimToken || !peak || !log) return;
    const message = `You summited ${peak.name} with ${profile.name || 'me'} on ${formatDate(log.date)}. Sign it into your ${APP_NAME}: ${claimUrl(p.claimToken)}`;
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(message);
      Alert.alert('Copied', `Paste it to ${p.name}.`);
    } else {
      await Share.share({ message });
    }
  }

  async function savePartners() {
    if (!log) return;
    setSaving(true);
    try {
      const partners = await withClaimLinks({ peakId: log.peakId, date: log.date, taggerName: profile.name || 'A friend', existing: log.partners, names });
      updateLog(log.id, { partners });
      success();
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
    <>
      <Stack.Screen options={{ title: '', headerTransparent: true, headerTintColor: '#fff' }} />
      <Screen
        header={
          <Backdrop peakId={peak.id} photoId={log.photoId ?? photoFor.get(peak.id)} height={360}>
            <Label color={c.accent}>{formatDate(log.date)}</Label>
            <Display size={38}>{peak.name}</Display>
            <Body muted>
              {peak.elevationFt.toLocaleString()} ft · {peak.range} Range
              {log.taggedBy ? ` · tagged by ${log.taggedBy}` : ''}
            </Body>
          </Backdrop>
        }>
        {log.note ? <Body style={{ fontSize: 17, lineHeight: 25 }}>{log.note}</Body> : null}

        <Button title="Share summit card" onPress={() => router.push(`/share/${log.id}`)} />

        <SectionHeader title="Crew" action={log.partners.length && !editing ? 'Edit' : undefined} onAction={() => setEditing(true)} />
        {editing ? (
          <Card>
            <PartnerEditor names={names} onChange={setNames} />
            <Button title="Save crew" loading={saving} onPress={savePartners} />
          </Card>
        ) : log.partners.length ? (
          log.partners.map((p) => (
            <View key={p.name} style={styles.partner}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{p.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '600', flex: 1 }}>{p.name}</Text>
              {p.claimToken ? (
                <Pressable onPress={() => sendLink(p)} hitSlop={8}>
                  <Text style={{ color: c.link, fontWeight: '700' }}>Send link</Text>
                </Pressable>
              ) : (
                <Text style={{ color: c.textMuted, fontSize: 13 }}>{hasBackend ? 'No link yet' : 'Links need the server'}</Text>
              )}
            </View>
          ))
        ) : (
          <Card>
            <Body muted>Who was up there with you? Tag them and the summit lands in their register too.</Body>
            <Button title="Tag your crew" variant="secondary" onPress={() => setEditing(true)} />
          </Card>
        )}

        <Button title="Remove summit" variant="ghost" onPress={confirmDelete} style={{ marginTop: Spacing.four }} />
        <Text style={{ color: c.textMuted, textAlign: 'center', fontSize: 12 }}>
          Signed from {log.source === 'photo' ? 'your photos' : log.source === 'gpx' ? 'a GPS track' : log.source === 'claim' ? 'a friend’s tag' : 'manual entry'}
        </Text>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  partner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.backgroundSelected, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: c.text, fontWeight: '800', fontSize: 15 },
});
