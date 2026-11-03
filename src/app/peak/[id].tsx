import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Backdrop } from '@/components/backdrop';
import { Stars } from '@/components/log-bits';
import { PEAK_STATS } from '@/data/peak-stats.generated';
import { routeById, routesFor, standardRoute } from '@/data/routes';
import { Terrain3D } from '@/components/terrain-3d';
import { TimeSlider } from '@/components/time-slider';
import { Icon } from '@/components/icon';
import { Avatar, BetaChips, FacePile } from '@/components/social';
import { Body, Button, Display, SectionHeader } from '@/components/ui';
import { Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { tap } from '@/lib/haptics';
import { daysSince, formatDate, ME, useStore } from '@/lib/store';
import { heightmap } from '@/lib/terrain';

const c = Colors.dark;

function names(us: { name: string }[]) {
  const first = us.slice(0, 2).map((u) => u.name.split(' ')[0]);
  return us.length > 2 ? `${first.join(', ')} and ${us.length - 2} more` : first.join(' and ');
}

export default function PeakScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { peaks, peakById, logs, profile, toggleFavorite, toggleWant, wantsOf, betaFor, friendsWhoClimbed, friendsWhoWant, user, peakActivity, displayName } = useStore();
  const { width } = useWindowDimensions();
  const contentW = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const [time, setTime] = useState(0.42);
  const [scrollOn, setScrollOn] = useState(true);
  const peak = peakById.get(id);
  if (!peak) return null;

  const mine = logs.filter((l) => l.peakId === peak.id).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const isFav = profile.favorites.includes(peak.id);
  const favFull = profile.favorites.length >= 4 && !isFav;
  const rank = [...peaks].sort((a, b) => b.elevationFt - a.elevationFt).findIndex((p) => p.id === peak.id) + 1;
  const hm = heightmap(peak.id);
  const reports = betaFor(peak.id);
  const latest = reports[0];
  const climbed = friendsWhoClimbed(peak.id);
  const wanters = friendsWhoWant(peak.id);
  const act = peakActivity(peak.id);
  const stats = PEAK_STATS[peak.id];
  const std = standardRoute(peak.id);
  const wanted = wantsOf(ME).includes(peak.id);
  const reliefFt = hm ? Math.round(((hm.max - hm.min) * 3.28084) / 10) * 10 : null;

  return (
    <>
      <Stack.Screen options={{ title: '', headerTransparent: true, headerTintColor: '#fff', headerStyle: { backgroundColor: 'transparent' } }} />
      <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: c.background }}>
        <ScrollView scrollEnabled={scrollOn} contentContainerStyle={{ paddingBottom: Spacing.six }}>
          <Backdrop peakId={peak.id} photoId={mine[0]?.photoId} height={Math.round(width * 1.05)} />

          <View style={styles.body}>
            <View style={{ gap: 6 }}>
              <Display size={40}>{peak.name}</Display>
              <Text style={styles.sub}>
                {peak.range} Range{mine.length ? <Text style={{ color: c.accent, fontFamily: Type.bodyBold }}>, climbed {mine.length === 1 ? 'once' : `${mine.length} times`}</Text> : null}
              </Text>
            </View>

            {/* Community numbers: everyone's ascents, ratings and winter climbs. */}
            <View style={styles.community}>
              {act.rating ? (
                <View style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.ratingBig}>{act.rating.toFixed(1)}</Text>
                    <Stars value={Math.round(act.rating * 2) / 2} size={18} />
                  </View>
                  <Text style={styles.communityMeta}>
                    {act.ratings} {act.ratings === 1 ? 'rating' : 'ratings'}, {act.ascents} {act.ascents === 1 ? 'ascent' : 'ascents'} logged
                    {act.winter ? `, ${act.winter} in winter` : ''}
                  </Text>
                </View>
              ) : (
                <Text style={styles.communityMeta}>{act.ascents ? `${act.ascents} ascents logged` : 'Nobody has logged this one yet. Be the first.'}</Text>
              )}
            </View>

            <Button title={mine.length ? 'Log another climb' : 'I climbed this'} onPress={() => router.push({ pathname: '/log/new', params: { peakId: peak.id } })} />
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
              <Pressable
                onPress={() => {
                  tap();
                  toggleFavorite(peak.id);
                }}
                disabled={favFull}
                accessibilityLabel={isFav ? 'Remove from favorites' : 'Add to four favorites'}
                style={[styles.pill, isFav && styles.pillFav, { opacity: favFull ? 0.35 : 1 }]}>
                <Icon name="heart" size={18} filled={isFav} color={isFav ? '#fff' : c.text} />
                <Text style={[styles.pillText, isFav && { color: '#fff' }]}>{isFav ? 'In your top four' : 'Top four'}</Text>
              </Pressable>
            </View>

            <SectionHeader title="The numbers" />
            <View style={styles.grid}>
              <Fact value={peak.elevationFt.toLocaleString()} unit="ft" label="Elevation" />
              <Fact value={`#${rank}`} label="Highest in Colorado" />
              {stats?.prominenceFt ? <Fact value={stats.prominenceFt.toLocaleString()} unit="ft" label="Prominence" /> : <Fact value="Unranked" label="Under 300 ft prominence" />}
              {stats?.isolationMi ? <Fact value={String(stats.isolationMi)} unit="mi" label="To a higher peak" /> : null}
              {std ? <Fact value={String(std.miles)} unit="mi" label="Standard route, round trip" /> : null}
              {std ? <Fact value={std.gainFt.toLocaleString()} unit="ft" label="Standard route gain" /> : null}
              {std ? <Fact value={`Class ${std.cls}`} label={std.cls >= 3 ? 'Hands on rock' : 'Hiking'} /> : null}
              {reliefFt ? <Fact value={reliefFt.toLocaleString()} unit="ft" label="Relief within 2.5 km" /> : null}
            </View>
            {stats?.firstAscent || stats?.location ? (
              <View style={{ gap: 6 }}>
                {stats.location ? <Text style={styles.lore}>{stats.location}.</Text> : null}
                {stats.firstAscent ? <Text style={styles.lore}>First recorded ascent: {stats.firstAscent}.</Text> : null}
              </View>
            ) : null}

            <SectionHeader title="Routes" />
            <View style={{ gap: 8 }}>
              {routesFor(peak.id).map((r) => (
                <View key={r.id} style={styles.routeRow}>
                  <View style={[styles.classDot, { backgroundColor: r.cls >= 4 ? c.danger : r.cls === 3 ? c.gold : c.success }]}>
                    <Text style={styles.classText}>{r.cls}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.routeName}>{r.name}</Text>
                    <Text style={styles.routeMeta}>
                      {r.miles} mi round trip, {r.gainFt.toLocaleString()} ft gain
                      {r.peaks ? `. ${r.peaks.map((id) => peakById.get(id)?.name).join(', ')}` : ''}
                    </Text>
                    {r.note ? <Text style={styles.routeMeta}>{r.note}</Text> : null}
                  </View>
                </View>
              ))}
              <Text style={styles.credit}>Distances and gain are approximate. Read a full route description before you go.</Text>
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
                    <Text style={styles.betaByText}>{displayName(latest.userId)}{routeById(latest.routeId) ? `, ${routeById(latest.routeId)!.name}` : ''}{reports.length > 1 ? `. ${reports.length - 1} more reports below.` : ''}</Text>
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

            {reports.length > 1 && (
              <>
                <SectionHeader title="More conditions reports" />
                {reports.slice(1, 6).map((r) => (
                  <Pressable key={r.id} onPress={() => router.push(`/ascent/${r.id}`)} style={styles.report}>
                    <View style={styles.betaBy}>
                      <Avatar user={user(r.userId)} size={22} />
                      <Text style={[styles.betaByText, { flex: 1 }]}>{displayName(r.userId)}</Text>
                      <Text style={styles.betaAgo}>{daysSince(r.date)} days ago</Text>
                    </View>
                    <BetaChips beta={r.beta} compact />
                  </Pressable>
                ))}
              </>
            )}

            {/* The mountain in 3D. Drag to turn it, slide the light from dawn to night. */}
            <View style={{ gap: 12 }}>
              <SectionHeader title="The mountain up close" />
              <View style={styles.terrain} onTouchStart={() => setScrollOn(false)} onTouchEnd={() => setScrollOn(true)} onTouchCancel={() => setScrollOn(true)}>
                <Terrain3D peakId={peak.id} time={time} height={contentW * 0.95} />
                <View style={styles.hint} pointerEvents="none">
                  <Text style={styles.hintText}>Drag to turn it</Text>
                </View>
              </View>
              <TimeSlider value={time} onChange={setTime} />
            </View>

            <Pressable onPress={() => Linking.openURL(`https://www.14ers.com/search?q=${encodeURIComponent(peak.name)}`)}>
              <Text style={styles.extLink}>Full route descriptions on 14ers.com</Text>
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
            <Text style={styles.credit}>Photos from Wikimedia Commons, credited on each photo. Terrain from USGS 3DEP and SRTM via AWS Terrain Tiles, 5 km around the summit, height exaggerated 1.2 times.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function Fact({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <View style={styles.fact}>
      <Text style={{ color: c.text, fontSize: 26, fontFamily: Type.display, fontVariant: ['tabular-nums'] }}>
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
  terrain: { borderRadius: Radius.lg, overflow: 'hidden' },
  hint: { position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center' },
  hintText: { color: c.textSecondary, fontFamily: Type.bodyBold, fontSize: 13 },
  facts: { flexDirection: 'row', gap: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18 },
  fact: { width: '50%', gap: 2, paddingRight: 8 },
  community: { gap: 6 },
  ratingBig: { color: c.text, fontFamily: Type.display, fontSize: 28 },
  communityMeta: { color: c.textSecondary, fontFamily: Type.body, fontSize: 15 },
  pillFav: { backgroundColor: c.danger },
  lore: { color: c.text, fontFamily: Type.body, fontSize: 16, lineHeight: 23 },
  routeRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: Radius.md, backgroundColor: c.backgroundElement },
  classDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  classText: { color: '#fff', fontFamily: Type.bodyBold, fontSize: 14 },
  routeName: { color: c.text, fontFamily: Type.bodyBold, fontSize: 16 },
  routeMeta: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  fav: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: c.backgroundElement },
  route: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.md, backgroundColor: c.backgroundElement, borderLeftWidth: 5, borderLeftColor: c.success, alignItems: 'flex-start' },
  routeTag: { fontFamily: Type.bodyBold, fontSize: 15, marginTop: 1 },
  betaCard: { gap: 12, padding: Spacing.three, borderRadius: Radius.md, backgroundColor: c.backgroundElement },
  betaHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  betaKicker: { color: c.text, fontFamily: Type.display, fontSize: 20 },
  betaAgo: { color: c.textSecondary, fontFamily: Type.bodyBold, fontSize: 14 },
  betaNote: { color: c.text, fontFamily: Type.body, fontSize: 17, lineHeight: 25 },
  betaBy: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  betaByText: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14, flexShrink: 1 },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  socialText: { flex: 1, color: c.textSecondary, fontFamily: Type.body, fontSize: 15, lineHeight: 22 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 46, borderRadius: 23, backgroundColor: c.backgroundElement },
  pillOn: { backgroundColor: c.accent },
  pillText: { color: c.text, fontFamily: Type.bodyBold, fontSize: 15 },
  report: { gap: 8, paddingVertical: 12 },
  climb: { paddingVertical: 10, gap: 2 },
  extLink: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 15, textDecorationLine: 'underline' },
  credit: { color: c.textSecondary, fontFamily: Type.body, fontSize: 12, marginTop: Spacing.four },
});
