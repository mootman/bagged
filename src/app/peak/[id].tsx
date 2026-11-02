import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Terrain3D } from '@/components/terrain-3d';
import { TimeSlider } from '@/components/time-slider';
import { Icon } from '@/components/icon';
import { Avatar, BetaChips, FacePile, PlanCard } from '@/components/social';
import { Body, Button, Display, SectionHeader } from '@/components/ui';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
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
            <Text style={styles.hintText}>Drag to turn it</Text>
          </View>

          <View style={styles.body}>
            <View style={{ gap: 6 }}>
              <Display size={44}>{peak.name}</Display>
              <Text style={styles.sub}>
                {peak.range} Range{mine.length ? <Text style={{ color: c.accent, fontFamily: Type.bodyBold }}>, climbed {mine.length === 1 ? 'once' : `${mine.length} times`}</Text> : null}
              </Text>
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
                <Text style={styles.betaKicker}>Conditions</Text>
                {latest && (
                  <Text style={[styles.betaAgo, daysSince(latest.date) <= 7 && { color: c.success }]}>
                    {daysSince(latest.date) === 0 ? 'Today' : daysSince(latest.date) === 1 ? 'Yesterday' : `${daysSince(latest.date)} days ago`}
                  </Text>
                )}
              </View>
              {latest ? (
                <Pressable onPress={() => router.push(`/ascent/${latest.id}`)} style={{ gap: 10 }}>
                  <BetaChips beta={latest.beta} />
                  {latest.note ? (
                    <Text style={styles.betaNote} numberOfLines={3}>
                      {latest.note}
                    </Text>
                  ) : null}
                  <View style={styles.betaBy}>
                    <Avatar user={user(latest.userId)} size={22} />
                    <Text style={styles.betaByText}>{latest.userId === ME ? 'You' : user(latest.userId)?.name}{latest.beta?.route ? `, ${latest.beta.route}` : ''}{reports.length > 1 ? `. ${reports.length - 1} more reports below.` : ''}</Text>
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
                <Icon name="bookmark" size={18} filled={wanted} color={wanted ? c.accentText : c.text} />
                <Text style={[styles.pillText, wanted && { color: c.accentText }]}>{wanted ? 'On your list' : 'Want to climb'}</Text>
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
                style={[styles.fav, { opacity: favFull ? 0.35 : 1 }]}>
                <Icon name="heart" size={20} filled={isFav} color={isFav ? c.accent : c.text} />
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
                      <Text style={styles.betaAgo}>{daysSince(r.date)} days ago</Text>
                    </View>
                    <BetaChips beta={r.beta} compact />
                  </Pressable>
                ))}
              </>
            )}

            <View style={[styles.route, hard && { borderLeftColor: c.danger }]}>
              <Text style={[styles.routeTag, { color: hard ? c.danger : c.success }]}>{hard ? 'Scramble' : 'Hike'}</Text>
              <Body muted style={{ flex: 1 }}>
                {hard
                  ? 'The standard route has scrambling and real exposure. Check conditions, start early, turn around if weather builds.'
                  : 'The standard route is a hike, but it is still 14,000 ft. Start early and be off the top before afternoon storms.'}
              </Body>
            </View>

            <Pressable onPress={() => Linking.openURL(`https://www.14ers.com/search?q=${encodeURIComponent(peak.name)}`)}>
              <Text style={styles.extLink}>Route descriptions on 14ers.com</Text>
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
            <Text style={styles.credit}>Terrain from USGS 3DEP and SRTM via AWS Terrain Tiles, 5 km around the summit, height exaggerated 1.35 times.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function Fact({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={{ color: c.text, fontSize: 26, fontFamily: Type.display, letterSpacing: -0.6, fontVariant: ['tabular-nums'] }}>
        {value}
        {unit ? <Text style={{ fontSize: 16, fontFamily: Type.bodyMedium, color: c.textSecondary }}> {unit}</Text> : null}
      </Text>
      <Text style={{ color: c.textSecondary, fontSize: 13, fontFamily: Type.body }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: Spacing.three, gap: Spacing.four, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', marginTop: Spacing.one },
  sub: { color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 16 },
  hint: { position: 'absolute', top: 398, left: 0, right: 0, alignItems: 'center' },
  hintText: { color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 13 },
  facts: { flexDirection: 'row', gap: Spacing.three },
  actions: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  fav: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: c.backgroundElement },
  route: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, backgroundColor: c.backgroundElement, borderLeftWidth: 4, borderLeftColor: c.success, alignItems: 'flex-start' },
  routeTag: { fontFamily: Type.bodyBold, fontSize: 15, marginTop: 1 },
  betaCard: { gap: 12, padding: Spacing.three, backgroundColor: c.backgroundElement },
  betaHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  betaKicker: { color: c.text, fontFamily: Type.display, fontSize: 20, letterSpacing: -0.4 },
  betaAgo: { color: c.textSecondary, fontFamily: Type.bodyBold, fontSize: 14 },
  betaNote: { color: c.text, fontFamily: Type.body, fontSize: 17, lineHeight: 25 },
  betaBy: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  betaByText: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14, flexShrink: 1 },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  socialText: { flex: 1, color: c.textSecondary, fontFamily: Type.body, fontSize: 15, lineHeight: 22 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 46, backgroundColor: c.backgroundElement },
  pillOn: { backgroundColor: c.accent },
  pillText: { color: c.text, fontFamily: Type.bodyBold, fontSize: 15, marginTop: 2 },
  report: { gap: 8, paddingVertical: 12 },
  climb: { paddingVertical: 10, gap: 2 },
  extLink: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 15, textDecorationLine: 'underline' },
  credit: { color: c.textSecondary, fontFamily: Type.body, fontSize: 12, marginTop: Spacing.four },
});
