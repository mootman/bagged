import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PeakImage } from '@/components/peak-photo';
import { PeakPoster } from '@/components/peak-poster';
import { Field, FriendPicker, Segmented } from '@/components/pickers';
import { BetaChips } from '@/components/social';
import { Button } from '@/components/ui';
import { Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { success, tap } from '@/lib/haptics';
import { daysSince, formatPlanDate, ME, useStore } from '@/lib/store';

const c = Colors.dark;

function upcomingWeekendDays(n = 6) {
  const out: string[] = [];
  const d = new Date();
  for (let i = 1; out.length < n && i < 60; i++) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    if (x.getDay() === 0 || x.getDay() === 6) {
      out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`);
    }
  }
  return out;
}

const STARTS = ['03:30', '04:30', '05:30', '06:30', '07:30'] as const;

export default function NewPlanScreen() {
  const params = useLocalSearchParams<{ peakId?: string; invite?: string }>();
  const { peaks, peakById, wantsOf, following, user, friendsWhoWant, betaFor, createPlan } = useStore();
  const [peakId, setPeakId] = useState(params.peakId ?? wantsOf(ME)[0] ?? 'co-quandary-peak');
  const [days] = useState(upcomingWeekendDays);
  const [date, setDate] = useState(days[0]);
  const [start, setStart] = useState<(typeof STARTS)[number] | undefined>('05:30');
  const [size, setSize] = useState(4);
  const [visibility, setVisibility] = useState<'crew' | 'public'>('crew');
  const [invites, setInvites] = useState<string[]>(params.invite ? [params.invite] : []);
  const [note, setNote] = useState('');
  const [picking, setPicking] = useState(!params.peakId);

  const peak = peakById.get(peakId)!;
  const wantIds = friendsWhoWant(peakId).map((u) => u.id);
  const friends = following.map((id) => user(id)).filter((u): u is NonNullable<typeof u> => !!u);
  const latest = betaFor(peakId)[0];
  const myWants = wantsOf(ME);
  const choices = [...myWants, ...peaks.map((p) => p.id).filter((id) => !myWants.includes(id))];

  const create = () => {
    const plan = createPlan({ peakId, date, start: start ?? '05:30', size, visibility, note: note.trim(), inviteIds: invites });
    success();
    router.replace(`/plan/${plan.id}`);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Field label="Peak">
        {picking ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {choices.map((id) => {
              const p = peakById.get(id)!;
              return (
                <Pressable
                  key={id}
                  onPress={() => {
                    tap();
                    setPeakId(id);
                    setPicking(false);
                  }}>
                  <PeakPoster peak={p} width={110} aspect={1.3} climbed={id === peakId} />
                  {myWants.includes(id) && <Text style={styles.wantTag}>On your list</Text>}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Pressable onPress={() => setPicking(true)} style={styles.peakRow}>
            <PeakImage peakId={peak.id} width={72} height={72} radius={Radius.sm} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.peakName}>{peak.name}</Text>
              <Text style={styles.peakMeta}>{peak.elevationFt.toLocaleString()} ft, {peak.range} Range</Text>
              {latest && (
                <View style={{ gap: 4 }}>
                  <Text style={styles.latest}>Conditions {daysSince(latest.date)} days ago</Text>
                  <BetaChips beta={latest.beta} compact />
                </View>
              )}
            </View>
            <Text style={styles.change}>Change</Text>
          </Pressable>
        )}
      </Field>

      <Field label="Day">
        <View style={styles.wrap}>
          {days.map((d) => (
            <Pressable
              key={d}
              onPress={() => {
                tap();
                setDate(d);
              }}
              style={[styles.day, date === d && styles.dayOn]}>
              <Text style={[styles.dayText, date === d && { color: c.accentText }]}>{formatPlanDate(d)}</Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Trailhead start">
        <Segmented options={STARTS} value={start} onChange={setStart} />
      </Field>

      <Field label="Group size, you included">
        <View style={styles.stepper}>
          <Pressable onPress={() => setSize((s) => Math.max(2, s - 1))} style={styles.stepBtn}>
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.stepVal}>{size}</Text>
          <Pressable onPress={() => setSize((s) => Math.min(10, s + 1))} style={styles.stepBtn}>
            <Text style={styles.stepText}>+</Text>
          </Pressable>
          <Text style={styles.stepHint}>{size - 1 - invites.length > 0 ? `${size - 1 - invites.length} open seat${size - 1 - invites.length > 1 ? 's' : ''} after invites` : 'Full with invites'}</Text>
        </View>
      </Field>

      <Field label="Who can see it">
        <Segmented options={['Crew only', 'Anyone can ask'] as const} value={visibility === 'crew' ? 'Crew only' : 'Anyone can ask'} onChange={(v) => setVisibility(v === 'Anyone can ask' ? 'public' : 'crew')} />
      </Field>

      <Field label={wantIds.length ? `Invite (${wantIds.length} want this peak)` : 'Invite'}>
        <FriendPicker friends={friends} selected={invites} wantsIds={wantIds} onToggle={(id) => setInvites((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))} />
      </Field>

      <Field label="Note">
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Pace, carpool, gear, turnaround time..."
          placeholderTextColor={c.textMuted}
          multiline
          style={styles.note}
        />
      </Field>

      <Button title={`Post plan for ${formatPlanDate(date)}`} onPress={create} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: Spacing.three, gap: Spacing.four, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingBottom: Spacing.six },
  wantTag: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 11, marginTop: 4 },
  peakRow: { flexDirection: 'row', gap: 14, alignItems: 'center', padding: 12, borderRadius: Radius.md, backgroundColor: c.backgroundElement },
  peakName: { color: c.text, fontFamily: Type.display, fontSize: 22 },
  peakMeta: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14 },
  latest: { color: c.success, fontFamily: Type.bodyBold, fontSize: 13, marginTop: 4 },
  change: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  day: { paddingHorizontal: 15, minHeight: 40, borderRadius: 99, justifyContent: 'center', backgroundColor: c.backgroundElement },
  dayOn: { backgroundColor: c.accent },
  dayText: { color: c.text, fontFamily: Type.bodyMedium, fontSize: 14 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.backgroundElement, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: c.text, fontSize: 22, fontFamily: Type.bodyBold },
  stepVal: { color: c.text, fontFamily: Type.display, fontSize: 30, minWidth: 24, textAlign: 'center', fontVariant: ['tabular-nums'] },
  stepHint: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14, flex: 1 },
  note: { backgroundColor: c.backgroundElement, color: c.text, padding: 14, borderRadius: Radius.md, minHeight: 90, fontFamily: Type.body, fontSize: 16, textAlignVertical: 'top' },
});
