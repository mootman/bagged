import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Terrain3D } from '@/components/terrain-3d';
import { TimeSlider } from '@/components/time-slider';
import { Avatar, BetaChips, FacePile, PlanCard } from '@/components/social';
import { Body, Button, Display, Label, SectionHeader } from '@/components/ui';
import { Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { tap } from '@/lib/haptics';
import { daysSince, formatDate, ME, useStore } from '@/lib/store';
import { heightmap } from '@/lib/terrain';

const c = Colors.dark;

/**
 * Peaks whose standard routes are commonly rated Class 3 or harder.
 * Verify against 14ers.com route ratings before launch.
 */
const HARD = new Set([
  'co-capitol-peak', 'co-little-bear-peak', 'co-maroon-peak', 'co-north-maroon-peak', 'co-pyramid-peak',
  'co-crestone-needle', 'co-crestone-peak', 'co-kit-carson-mountain', 'co-mount-wilson', 'co-el-diente-peak',
  'co-sunlight-peak', 'co-mount-eolus', 'co-north-eolus', 'co-wilson-peak', 'co-longs-peak', 'co-wetterhorn-peak',
  'co-snowmass-mountain',
]);

function names(us: { name: string }[]) {
  const first = us.slice(0, 2).map((u) => u.name.split(' ')[0]);
  return us.length > 2 ? `${first.join(', ')} and ${us.length - 2} more` : first.join(' and ');
}

function dms(v: number, pos: string, neg: string) {
  return `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
}

export default function PeakScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { peaks, peakById, logs, profile, toggleFavorite, toggleWant, wantsOf, betaFor, friendsWhoClimbed, friendsWhoWant, plansFor, user } = useStore();
  const [time, setTime] = useState(0.7);
  const [scrollOn, setScrollOn] = useState(true);
  const peak = peakById.get(id);
  if (!peak) return null;

  const mine = logs.filter((l) => l.peakId === peak.id).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const isFav = profile.favorites.includes(peak.id);
  const favFull = profile.favorites.length >= 4 && !isFav;
  const rank = [...peaks].sort((a, b) => b.elevationFt - a.elevationFt).findIndex((p) => p.id === peak.id) + 1;
  const hard = HARD.has(peak.id);
  const hm = heightmap(peak.id);
  const reports = betaFor(peak.id);
  const latest = reports[0];
  const climbed = friendsWhoClimbed(peak.id);
  const wanters = friendsWhoWant(peak.id);
  const plans = plansFor(peak.id);
  const wanted = wantsOf(ME).includes(peak.id);
  const reliefFt = hm ? Math.round(((hm.max - hm.min) * 3.28084) / 10) * 10 : null;

  return (
    <>
      <Stack.Screen options={{ title: '', headerTransparent: true, headerTintColor: c.text, headerStyle: { backgroundColor: 'transparent' } }} />
      <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: c.background }}>
        <ScrollView scrollEnabled={scrollOn} contentContainerStyle={{ paddingBottom: Spacing.six }}>
          {/* The 3D view takes touches for orbiting; pause page scroll while a finger is on it. */}
          <View onTouchStart={() => setScrollOn(false)} onTouchEnd={() => setScrollOn(true)} onTouchCancel={() => setScrollOn(true)}>
            <Terrain3D peakId={peak.id} time={time} height={430} />
          </View>
          <View style={styles.hint} pointerEvents="none">
            <Text style={styles.hintText}>DRAG TO TURN THE MOUNTAIN</Text>
          </View>

          <View style={styles.body}>
            <View style={{ gap: 6 }}>
              <Label color={mine.length ? c.accent : undefined}>
                {mine.length ? `Signed ${mine.length}×` : `${peak.range} Range`}  ·  {dms(peak.lat, 'N', 'S')}  {dms(peak.lon, 'E', 'W')}
              </Label>
              <Display size={44}>{peak.name}</Display>
            </View>

            <TimeSlider value={time} onChange={setTime} />

            <View style={styles.facts}>
              <Fact value={peak.elevationFt.toLocaleString()} unit="ft" label="Summit" />
              <Fact value={`#${rank}`} label="In Colorado" />
              {reliefFt && <Fact value={reliefFt.toLocaleString()} unit="ft" label="Relief in view" />}
            </View>

            {/* What it's like up there right now. The reason to open this page mid-week. */}
            <View style={styles.betaCard}>
              <View style={styles.betaHead}>
                <Text style={[styles.betaKicker, latest && daysSince(latest.date) <= 7 ? { color: c.success } : null]}>
                  {latest ? (daysSince(latest.date) <= 7 ? '● FRESH BETA' : 'LATEST BETA') : 'NO RECENT BETA'}
                </Text>
                {latest && <Text style={styles.betaAgo}>{daysSince(latest.date) === 0 ? 'TODAY' : `${daysSince(latest.date)}D AGO`} · {reports.length} REPORT{reports.length === 1 ? '' : 'S'} / 45D</Text>}
              </View>
              {latest ? (
                <Pressable onPress={() => router.push(`/ascent/${latest.id}`)} style={{ gap: 10 }}>
                  <BetaChips beta={latest.beta} />
                  {latest.note ? (
                    <Text style={styles.betaNote} numberOfLines={3}>
                      “{latest.note}”
                    </Text>
                  ) : null}
                  <View style={styles.betaBy}>
                    <Avatar user={user(latest.userId)} size={22} />
                    <Text style={styles.betaByText}>{latest.userId === ME ? 'You' : user(latest.userId)?.name}{latest.beta?.route ? ` · ${latest.beta.route}` : ''}</Text>
                  </View>
                </Pressable>
              ) : (
                <Body muted>Nobody has reported in the last six weeks. If you go, your report is the one everyone will read.</Body>
              )}
            </View>

            {(climbed.length > 0 || wanters.length > 0) && (
              <View style={{ gap: 12 }}>
                {climbed.length > 0 && (
                  <View style={styles.socialRow}>
                    <FacePile ids={climbed.map((u) => u.id)} size={28} max={4} />
                    <Text style={styles.socialText}>
                      {names(climbed)} {climbed.length === 1 ? 'has' : 'have'} stood here. <Text style={{ color: c.link }} onPress={() => router.push(`/user/${climbed[0].id}`)}>Ask {climbed[0].name.split(' ')[0]}</Text>
                    </Text>
                  </View>
                )}
                {wanters.length > 0 && (
                  <View style={styles.socialRow}>
                    <FacePile ids={wanters.map((u) => u.id)} size={28} max={4} />
                    <Text style={styles.socialText}>
                      {names(wanters)} want{wanters.length === 1 ? 's' : ''} to climb it too.
                    </Text>
                  </View>
                )}
              </View>
            )}

            <Button title={wanters.length ? `Plan it with ${wanters[0].name.split(' ')[0]}${wanters.length > 1 ? ` +${wanters.length - 1}` : ''}` : 'Plan a climb'} onPress={() => router.push({ pathname: '/plan/new', params: { peakId: peak.id, ...(wanters[0] ? { invite: wanters[0].id } : {}) } })} />
            <View style={styles.actions}>
              <Pressable
                onPress={() => {
                  tap();
                  toggleWant(peak.id);
                }}
                style={[styles.pill, wanted && styles.pillOn]}>
                <Text style={[styles.pillText, wanted && { color: c.accent }]}>{wanted ? '✓ Want to climb' : '+ Want to climb'}</Text>
              </Pressable>
              <Pressable onPress={() => router.push({ pathname: '/log/new', params: { peakId: peak.id } })} style={styles.pill}>
                <Text style={styles.pillText}>{mine.length ? 'Log it again' : 'I climbed this'}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  tap();
                  toggleFavorite(peak.id);
                }}
                disabled={favFull}
                accessibilityLabel={isFav ? 'Remove from favorites' : 'Add to four favorites'}
                style={[styles.fav, { opacity: favFull ? 0.35 : 1, borderColor: isFav ? c.accent : c.border, backgroundColor: isFav ? 'rgba(255,122,69,0.12)' : 'transparent' }]}>
                <Text style={{ fontSize: 18, color: isFav ? c.accent : c.textSecondary }}>{isFav ? '♥' : '♡'}</Text>
              </Pressable>
            </View>

            {plans.length > 0 && (
              <>
                <SectionHeader title={`Going up (${plans.length})`} />
                {plans.map((p) => (
                  <PlanCard key={p.id} plan={p} />
                ))}
              </>
            )}

            {reports.length > 1 && (
              <>
                <SectionHeader title="More conditions reports" />
                {reports.slice(1, 6).map((r) => (
                  <Pressable key={r.id} onPress={() => router.push(`/ascent/${r.id}`)} style={styles.report}>
                    <View style={styles.betaBy}>
                      <Avatar user={user(r.userId)} size={22} />
                      <Text style={[styles.betaByText, { flex: 1 }]}>{r.userId === ME ? 'You' : user(r.userId)?.name}</Text>
                      <Text style={styles.betaAgo}>{daysSince(r.date)}D AGO</Text>
                    </View>
                    <BetaChips beta={r.beta} compact />
                  </Pressable>
                ))}
              </>
            )}

            <View style={[styles.route, hard && { borderColor: 'rgba(255,122,69,0.4)' }]}>
              <Text style={[styles.routeTag, { color: hard ? c.accent : c.success }]}>{hard ? 'SCRAMBLE' : 'HIKE'}</Text>
              <Body muted style={{ flex: 1 }}>
                {hard
                  ? 'The standard route has scrambling and real exposure. Check conditions, start early, turn around if weather builds.'
                  : 'The standard route is a hike, but it is still 14,000 ft. Start early and be off the top before afternoon storms.'}
              </Body>
            </View>

            <Pressable onPress={() => Linking.openURL(`https://www.14ers.com/search?q=${encodeURIComponent(peak.name)}`)}>
              <Text style={{ color: c.link, fontFamily: Type.bodyMedium }}>Route descriptions on 14ers.com  →</Text>
            </Pressable>

            {mine.length > 0 && (
              <>
                <SectionHeader title="Your ascents" />
                {mine.map((l) => (
                  <Pressable key={l.id} onPress={() => router.push(`/ascent/${l.id}`)} style={styles.climb}>
                    <Text style={{ color: c.text, fontFamily: Type.display, fontSize: 18 }}>{formatDate(l.date)}</Text>
                    <Text style={{ color: c.textSecondary, fontFamily: Type.body }}>
                      {l.withIds.length ? `with ${l.withIds.map((u) => user(u)?.name.split(' ')[0]).join(', ')}` : 'Solo'}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}
            <Text style={styles.credit}>Terrain: AWS Terrain Tiles (USGS 3DEP, SRTM). 5 km around the summit, 1.35× vertical.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function Fact({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={{ color: c.text, fontSize: 26, fontFamily: Type.display }}>
        {value}
        {unit ? <Text style={{ fontSize: 13, fontFamily: Type.mono, color: c.textSecondary }}> {unit}</Text> : null}
      </Text>
      <Text style={{ color: c.textMuted, fontSize: 10, fontFamily: Type.mono, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.three, gap: Spacing.four, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', marginTop: Spacing.one },
  hint: { position: 'absolute', top: 398, left: 0, right: 0, alignItems: 'center' },
  hintText: { color: 'rgba(237,230,214,0.45)', fontFamily: Type.mono, fontSize: 9, letterSpacing: 1.5 },
  facts: { flexDirection: 'row', gap: Spacing.three, paddingVertical: Spacing.three, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.border },
  actions: { flexDirection: 'row', gap: Spacing.two },
  fav: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  route: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.sm, borderWidth: 1, borderColor: c.border, alignItems: 'flex-start' },
  routeTag: { fontFamily: Type.monoBold, fontSize: 11, letterSpacing: 1, marginTop: 3 },
  betaCard: { gap: 12, padding: Spacing.three, borderRadius: Radius.md, backgroundColor: c.backgroundElement, borderWidth: 1, borderColor: c.border },
  betaHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  betaKicker: { color: c.textMuted, fontFamily: Type.monoBold, fontSize: 10.5, letterSpacing: 1.2 },
  betaAgo: { color: c.textMuted, fontFamily: Type.mono, fontSize: 9.5 },
  betaNote: { color: c.text, fontFamily: Type.displayItalic, fontSize: 17, lineHeight: 24 },
  betaBy: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  betaByText: { color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 13 },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  socialText: { flex: 1, color: c.textSecondary, fontFamily: Type.body, fontSize: 14, lineHeight: 20 },
  pill: { paddingHorizontal: 16, height: 46, borderRadius: 23, borderWidth: 1, borderColor: c.border, justifyContent: 'center' },
  pillOn: { borderColor: c.accent, backgroundColor: 'rgba(255,122,69,0.1)' },
  pillText: { color: c.text, fontFamily: Type.bodyMedium, fontSize: 14 },
  report: { gap: 8, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  climb: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border, gap: 2 },
  credit: { color: c.textMuted, fontFamily: Type.mono, fontSize: 9, letterSpacing: 0.3, marginTop: Spacing.four },
});
