import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Backdrop } from '@/components/backdrop';
import { BetaPicker } from '@/components/pickers';
import { Avatar, BetaChips, seatsLeft } from '@/components/social';
import { Button } from '@/components/ui';
import { Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { success } from '@/lib/haptics';
import { daysSince, formatPlanDate, ME, useStore } from '@/lib/store';
import type { Beta } from '@/lib/types';

const c = Colors.dark;

export default function PlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plans, peakById, user, requestJoin, leavePlan, approve, completePlan, betaFor } = useStore();
  const [logging, setLogging] = useState(false);
  const [beta, setBeta] = useState<Beta>({});
  const [note, setNote] = useState('');
  const plan = plans.find((p) => p.id === id);
  const peak = plan && peakById.get(plan.peakId);
  if (!plan || !peak) return null;

  const going = plan.memberIds.includes(ME);
  const requested = plan.requestIds.includes(ME);
  const host = user(plan.hostId);
  const isHost = plan.hostId === ME;
  const past = daysSince(plan.date) >= 0 && !plan.done;
  const open = seatsLeft(plan);
  const reports = betaFor(peak.id).slice(0, 3);

  const finish = () => {
    const mine = completePlan(plan.id, { beta: beta.surface ? beta : undefined, note: note.trim() });
    if (mine) router.replace({ pathname: '/signed/[id]', params: { id: mine.id } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen options={{ title: '', headerTransparent: true, headerStyle: { backgroundColor: 'transparent' } }} />
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.six }} keyboardShouldPersistTaps="handled">
        <Backdrop peakId={peak.id} height={340}>
          <Text style={styles.kicker}>
            {formatPlanDate(plan.date).toUpperCase()} · {plan.start} START · {plan.visibility === 'public' ? 'OPEN TO ASK' : 'CREW'}
          </Text>
          <Pressable onPress={() => router.push(`/peak/${peak.id}`)}>
            <Text style={styles.title}>{peak.name}</Text>
          </Pressable>
        </Backdrop>

        <View style={styles.page}>
          {plan.note ? (
            <View style={styles.hostNote}>
              <Avatar user={host} size={30} />
              <Text style={styles.noteText}>
                <Text style={{ fontFamily: Type.bodyBold }}>{isHost ? 'You' : host?.name.split(' ')[0]}: </Text>
                {plan.note}
              </Text>
            </View>
          ) : null}

          <View style={styles.crewHead}>
            <Text style={styles.section}>Crew</Text>
            <Text style={[styles.seats, open === 0 && { color: c.textMuted }]}>{open ? `${open} of ${plan.size} seats open` : `Full · ${plan.size}`}</Text>
          </View>
          <View style={styles.crew}>
            {plan.memberIds.map((m) => (
              <Pressable key={m} onPress={() => m !== ME && router.push(`/user/${m}`)} style={styles.member}>
                <Avatar user={user(m)} size={54} ring={m === plan.hostId ? c.accent : undefined} />
                <Text style={styles.memberName} numberOfLines={1}>
                  {m === ME ? 'You' : user(m)?.name.split(' ')[0]}
                </Text>
                {m === plan.hostId && <Text style={styles.hostTag}>HOST</Text>}
              </Pressable>
            ))}
            {Array.from({ length: open }, (_, i) => (
              <View key={`open${i}`} style={styles.member}>
                <View style={styles.openSeat}>
                  <Text style={{ color: c.textMuted, fontSize: 20 }}>+</Text>
                </View>
                <Text style={[styles.memberName, { color: c.textMuted }]}>Open</Text>
              </View>
            ))}
          </View>

          {isHost && plan.requestIds.length > 0 && (
            <View style={{ gap: 8 }}>
              <Text style={styles.label}>WANTS TO JOIN</Text>
              {plan.requestIds.map((r) => (
                <View key={r} style={styles.request}>
                  <Avatar user={user(r)} size={32} />
                  <Text style={{ color: c.text, fontFamily: Type.bodyMedium, flex: 1 }}>{user(r)?.name}</Text>
                  <Pressable onPress={() => approve(plan.id, r)} style={styles.approve}>
                    <Text style={styles.approveText}>Approve</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {plan.done ? (
            <Text style={styles.doneText}>Summited and logged for everyone.</Text>
          ) : past && going ? (
            logging ? (
              <View style={styles.logBox}>
                <Text style={styles.section}>How was it up there?</Text>
                <Text style={styles.sub}>This logs the summit for all {plan.memberIds.length} of you. Your conditions report helps the next crew.</Text>
                <BetaPicker beta={beta} onChange={setBeta} />
                <TextInput value={note} onChangeText={setNote} placeholder="Anything the next person should know" placeholderTextColor={c.textMuted} multiline style={styles.note} />
                <Button title={`Log it for the crew`} onPress={finish} />
              </View>
            ) : (
              <Button title="We summited" onPress={() => setLogging(true)} />
            )
          ) : going ? (
            <Button title={isHost ? 'Cancel plan' : 'Leave plan'} variant="secondary" onPress={() => {
              leavePlan(plan.id);
              if (isHost) router.back();
            }} />
          ) : requested ? (
            <View style={styles.pending}>
              <Text style={styles.pendingText}>Asked to join. {host?.name.split(' ')[0]} will let you know.</Text>
            </View>
          ) : open > 0 ? (
            <Button
              title="Ask to join"
              onPress={() => {
                success();
                requestJoin(plan.id);
              }}
            />
          ) : null}

          <Text style={[styles.section, { marginTop: Spacing.two }]}>Latest beta</Text>
          {reports.length === 0 && <Text style={styles.sub}>No reports in the last few weeks. Check 14ers.com before you go.</Text>}
          {reports.map((r) => (
            <Pressable key={r.id} onPress={() => router.push(`/ascent/${r.id}`)} style={styles.report}>
              <View style={styles.reportHead}>
                <Avatar user={user(r.userId)} size={26} />
                <Text style={styles.reportWho}>{r.userId === ME ? 'You' : user(r.userId)?.name}</Text>
                <Text style={[styles.reportAgo, daysSince(r.date) <= 7 && { color: c.success }]}>{daysSince(r.date)}D AGO</Text>
              </View>
              <BetaChips beta={r.beta} />
              {r.note ? (
                <Text style={styles.reportNote} numberOfLines={3}>
                  {r.note}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: Spacing.three, gap: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  kicker: { color: c.accent, fontFamily: Type.monoBold, fontSize: 10.5, letterSpacing: 1.1 },
  title: { color: c.text, fontFamily: Type.display, fontSize: 42, lineHeight: 46 },
  hostNote: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: Radius.md, backgroundColor: c.backgroundElement, borderWidth: 1, borderColor: c.border },
  noteText: { flex: 1, color: c.text, fontFamily: Type.body, fontSize: 15, lineHeight: 21 },
  crewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  section: { color: c.text, fontFamily: Type.display, fontSize: 22 },
  sub: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14, lineHeight: 20 },
  seats: { color: c.accent, fontFamily: Type.mono, fontSize: 11 },
  crew: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  member: { width: 64, alignItems: 'center', gap: 6 },
  memberName: { color: c.text, fontFamily: Type.bodyMedium, fontSize: 12 },
  hostTag: { color: c.accent, fontFamily: Type.mono, fontSize: 8, letterSpacing: 1, marginTop: -4 },
  openSeat: { width: 54, height: 54, borderRadius: 27, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  label: { color: c.textMuted, fontFamily: Type.mono, fontSize: 10, letterSpacing: 1 },
  request: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  approve: { backgroundColor: c.accent, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7 },
  approveText: { color: c.accentText, fontFamily: Type.bodyBold, fontSize: 13 },
  logBox: { gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.md, borderWidth: 1, borderColor: 'rgba(255,122,69,0.45)', backgroundColor: '#1E1418' },
  note: { backgroundColor: c.backgroundElement, color: c.text, borderRadius: 14, padding: 14, minHeight: 80, fontFamily: Type.body, fontSize: 15, textAlignVertical: 'top', borderWidth: 1, borderColor: c.border },
  pending: { padding: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: c.gold },
  pendingText: { color: c.gold, fontFamily: Type.bodyMedium, fontSize: 14 },
  doneText: { color: c.success, fontFamily: Type.bodyBold, fontSize: 15 },
  report: { gap: 8, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  reportHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reportWho: { color: c.text, fontFamily: Type.bodyBold, fontSize: 14, flex: 1 },
  reportAgo: { color: c.textMuted, fontFamily: Type.mono, fontSize: 10 },
  reportNote: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14, lineHeight: 20 },
});
