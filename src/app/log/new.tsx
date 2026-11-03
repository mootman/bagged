import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PhotoPicker, RoutePicker, StarInput, WinterToggle } from '@/components/log-bits';
import { PartnerEditor } from '@/components/partner-editor';
import { BetaPicker, Field, FriendPicker } from '@/components/pickers';
import { Button } from '@/components/ui';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { localDay } from '@/lib/detect';
import { success } from '@/lib/haptics';
import { OTHER_ROUTE_ID, routesFor } from '@/data/routes';
import { daysSince, isWinter, ME, useStore } from '@/lib/store';
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
  const [rating, setRating] = useState<number | undefined>();
  const [photos, setPhotos] = useState<string[]>([]);
  const [winter, setWinter] = useState(() => isWinter(localDay(Date.now())));
  const [routeId, setRouteId] = useState<string | undefined>(() => routesFor(peakId)[0]?.id);
  const [miles, setMiles] = useState('');
  const [gain, setGain] = useState('');
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
      const other = routeId === OTHER_ROUTE_ID;
      const mine = logAscent({
        peakId: peak.id,
        date,
        withIds,
        guests: tagged,
        note: note.trim(),
        beta: beta.surface ? { ...beta } : undefined,
        source: 'manual',
        rating,
        winter,
        photos: photos.length ? photos : undefined,
        routeId,
        customMiles: other ? Number(miles) || undefined : undefined,
        customGainFt: other ? Number(gain) || undefined : undefined,
      });
      success();
      router.replace({ pathname: '/signed/[id]', params: { id: mine.id } });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <View style={{ gap: 4 }}>
        <Text style={styles.title}>{peak.name}</Text>
        <Text style={styles.kicker}>{peak.elevationFt.toLocaleString()} ft, {peak.range} Range</Text>
      </View>

      <Field label="When">
        <TextInput
          value={date}
          onChangeText={(t) => {
            setDate(t);
            if (DATE_RE.test(t)) setWinter(isWinter(t));
          }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          style={[styles.input, !dateOk && { borderLeftWidth: 4, borderLeftColor: c.danger }]}
        />
        {duplicate && <Text style={styles.warn}>You already logged {peak.name} on this day.</Text>}
        <WinterToggle value={winter} onChange={setWinter} />
      </Field>

      <Field label="Route">
        <RoutePicker routes={routesFor(peak.id)} value={routeId} onChange={setRouteId} miles={miles} gain={gain} onMiles={setMiles} onGain={setGain} peakName={(id) => peakById.get(id)?.name ?? id} />
      </Field>

      <Field label="Your rating">
        <StarInput value={rating} onChange={setRating} />
      </Field>

      <Field label="How it went">
        <TextInput value={note} onChangeText={setNote} placeholder="The views, the scary bit, what you'd tell a friend going next" placeholderTextColor={c.textMuted} multiline style={[styles.input, styles.note]} />
      </Field>

      <Field label="Photos">
        <PhotoPicker photos={photos} onChange={setPhotos} />
      </Field>

      <Field label="Who was with you">
        {friends.length > 0 && <FriendPicker friends={friends} selected={withIds} wantsIds={friendsWhoClimbed(peak.id).map((u) => u.id)} onToggle={(id) => setWithIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))} />}
        <PartnerEditor names={guests} onChange={setGuests} />
        <Text style={styles.hint}>Add their names. Once they join, the climb lands on their profile too.</Text>
      </Field>

      <Field label={fresh ? 'Conditions. Other climbers check this before they go.' : 'Conditions, if you remember'}>
        <BetaPicker beta={beta} onChange={setBeta} />
      </Field>

      <Button title={withIds.length ? `Log it for ${withIds.length + 1} of you` : 'Log this climb'} loading={saving} disabled={!dateOk || duplicate} onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: Spacing.three, gap: Spacing.four, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingBottom: Spacing.six },
  kicker: { color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 16 },
  title: { color: c.text, fontFamily: Type.display, fontSize: 40 },
  input: { backgroundColor: c.backgroundElement, color: c.text, paddingHorizontal: 16, borderRadius: 10, minHeight: 48, fontFamily: Type.bodyMedium, fontSize: 16, fontVariant: ['tabular-nums'] },
  note: { minHeight: 110, textAlignVertical: 'top', fontFamily: Type.body, paddingTop: 12 },
  hint: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14, lineHeight: 20 },
  warn: { color: c.danger, fontFamily: Type.bodyMedium, fontSize: 14 },
});
