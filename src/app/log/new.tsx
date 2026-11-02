import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';

import { PartnerEditor } from '@/components/partner-editor';
import { Body, Button, Card, Display, Label, Screen } from '@/components/ui';
import { Radius, Spacing , Colors } from '@/constants/theme';
import { localDay } from '@/lib/detect';
import { success } from '@/lib/haptics';
import { useStore } from '@/lib/store';
import { withClaimLinks } from '@/lib/tagging';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function NewLogScreen() {
  const t = Colors.dark;
  const { peakId } = useLocalSearchParams<{ peakId: string }>();
  const { peakById, profile, addLogs, logs } = useStore();
  const peak = peakById.get(peakId);
  const [date, setDate] = useState(() => localDay(Date.now()));
  const [partners, setPartners] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!peak) return <Screen><Body>Pick a peak from the Peaks tab first.</Body></Screen>;

  const dateOk = DATE_RE.test(date) && !Number.isNaN(Date.parse(date));
  const duplicate = logs.some((l) => l.peakId === peak.id && l.date === date);

  async function save() {
    if (!peak) return;
    setSaving(true);
    try {
      let tagged = partners.map((name) => ({ name }));
      try {
        tagged = await withClaimLinks({ peakId: peak.id, date, taggerName: profile.name || 'A friend', existing: [], names: partners });
      } catch {
        Alert.alert('Saved without links', "Couldn't create claim links right now. You can tag partners again from the summit page.");
      }
      const [log] = addLogs([{ peakId: peak.id, date, partners: tagged, note: note.trim(), source: 'manual' }]);
      success();
      router.replace(`/signed/${log.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Display size={30}>{peak.name}</Display>

      <Label>Date</Label>
      <TextInput
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={t.textSecondary}
        autoCapitalize="none"
        style={[styles.input, { color: t.text, borderColor: dateOk ? t.border : t.accent, backgroundColor: t.backgroundElement }]}
      />
      {duplicate && (
        <Body style={{ color: t.accent, fontSize: 13 }}>You already logged {peak.name} on this day.</Body>
      )}

      <Label>Who was with you</Label>
      <Card>
        <PartnerEditor names={partners} onChange={setPartners} />
        <Body muted style={{ fontSize: 13 }}>Each person gets a link to claim this summit. It lands in their register too.</Body>
      </Card>

      <Label>Note</Label>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Conditions, route, how it went"
        placeholderTextColor={t.textSecondary}
        multiline
        style={[styles.input, styles.note, { color: t.text, borderColor: t.border, backgroundColor: t.backgroundElement }]}
      />

      <Button title="Sign the register" loading={saving} disabled={!dateOk || duplicate} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.three, fontSize: 16 },
  note: { minHeight: 100, textAlignVertical: 'top' },
});
