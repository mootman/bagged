import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PartnerEditor } from '@/components/partner-editor';
import { BetaPicker, Field, FriendPicker } from '@/components/pickers';
import { Button } from '@/components/ui';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { localDay } from '@/lib/detect';
import { success } from '@/lib/haptics';
import { daysSince, ME, useStore } from '@/lib/store';
import { withClaimLinks } from '@/lib/tagging';
import type { Beta } from '@/lib/types';

const c = Colors.dark;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Sign a summit: when, who with, and what it was like up there. */
export default function NewAscentScreen() {
  const { peakId } = useLocalSearchParams<{ peakId: string }>();
  const { peakById, me, logAscent, logs, following, user, friendsWhoClimbed } = useStore();
  const peak = peakById.get(peakId);
  const [date, setDate] = useState(() => localDay(Date.now()));
  const [withIds, setWithIds] = useState<string[]>([]);
  const [guests, setGuests] = useState<string[]>([]);
  const [beta, setBeta] = useState<Beta>({});
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!peak) return null;
  const dateOk = DATE_RE.test(date) && !Number.isNaN(Date.parse(date));
  const duplicate = logs.some((l) => l.userId === ME && l.peakId === peak.id && l.date === date);
  const friends = following.map((id) => user(id)).filter((u): u is NonNullable<typeof u> => !!u);
  const fresh = dateOk && daysSince(date) < 3;

  async function save() {
    if (!peak) return;
    setSaving(true);
    try {
      let tagged = guests.map((name) => ({ name }));
      try {
        tagged = (await withClaimLinks({ peakId: peak.id, date, taggerName: me.name || 'A friend', existing: [], names: guests })).map((g) => ({ name: g.name, claimToken: g.claimToken }));
      } catch {
        Alert.alert('Saved without links', "Couldn't create invite links right now.");
      }
      const mine = logAscent({ peakId: peak.id, date, withIds, guests: tagged, note: note.trim(), beta: beta.surface ? beta : undefined, source: 'manual' });
      success();
      router.replace({ pathname: '/signed/[id]', params: { id: mine.id } });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={{ gap: 4 }}>
        <Text style={styles.kicker}>{peak.elevationFt.toLocaleString()} FT · {peak.range.toUpperCase()}</Text>
        <Text style={styles.title}>{peak.name}</Text>
      </View>

      <Field label="Date">
        <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={c.textMuted} autoCapitalize="none" style={[styles.input, !dateOk && { borderColor: c.accent }]} />
        {duplicate && <Text style={styles.warn}>You already logged {peak.name} on this day.</Text>}
      </Field>

      <Field label="Who was up there with you">
        <FriendPicker friends={friends} selected={withIds} wantsIds={friendsWhoClimbed(peak.id).map((u) => u.id)} onToggle={(id) => setWithIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))} />
        <Text style={styles.hint}>Friends you tag get this summit on their register too. No one types it twice.</Text>
        <PartnerEditor names={guests} onChange={setGuests} />
        <Text style={styles.hint}>Not on the app yet? Add their name and send them an invite link.</Text>
      </Field>

      <Field label={fresh ? 'Conditions · people are planning around this' : 'Conditions (optional)'}>
        <BetaPicker beta={beta} onChange={setBeta} />
      </Field>

      <Field label="Note">
        <TextInput value={note} onChangeText={setNote} placeholder="How it went, what you'd tell a friend going next" placeholderTextColor={c.textMuted} multiline style={[styles.input, styles.note]} />
      </Field>

      <Button title={withIds.length ? `Sign it for ${withIds.length + 1} of you` : 'Sign the register'} loading={saving} disabled={!dateOk || duplicate} onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: Spacing.three, gap: Spacing.four, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingBottom: Spacing.six },
  kicker: { color: c.accent, fontFamily: Type.mono, fontSize: 10, letterSpacing: 1.2 },
  title: { color: c.text, fontFamily: Type.display, fontSize: 36 },
  input: { backgroundColor: c.backgroundElement, color: c.text, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: Type.mono, fontSize: 15, borderWidth: 1, borderColor: c.border },
  note: { minHeight: 90, textAlignVertical: 'top', fontFamily: Type.body },
  hint: { color: c.textMuted, fontFamily: Type.body, fontSize: 12 },
  warn: { color: c.accent, fontFamily: Type.body, fontSize: 13 },
});
