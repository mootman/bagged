import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Terrain3D } from '@/components/terrain-3d';
import { TimeSlider } from '@/components/time-slider';
import { Body, Button, Display, Label, SectionHeader } from '@/components/ui';
import { Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { tap } from '@/lib/haptics';
import { formatDate, useStore } from '@/lib/store';
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

function dms(v: number, pos: string, neg: string) {
  return `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
}

export default function PeakScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { peaks, peakById, logs, profile, toggleFavorite } = useStore();
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

            <View style={styles.facts}>
              <Fact value={peak.elevationFt.toLocaleString()} unit="ft" label="Summit" />
              <Fact value={`#${rank}`} label="In Colorado" />
              {reliefFt && <Fact value={reliefFt.toLocaleString()} unit="ft" label="Relief in view" />}
            </View>

            <TimeSlider value={time} onChange={setTime} />

            <View style={styles.actions}>
              <Button
                title={mine.length ? 'Sign it again' : 'I climbed this'}
                onPress={() => router.push({ pathname: '/log/new', params: { peakId: peak.id } })}
                style={{ flex: 1 }}
              />
              <Pressable
                onPress={() => {
                  tap();
                  toggleFavorite(peak.id);
                }}
                disabled={favFull}
                accessibilityLabel={isFav ? 'Remove from favorites' : 'Add to four favorites'}
                style={[styles.fav, { opacity: favFull ? 0.35 : 1, borderColor: isFav ? c.accent : c.border, backgroundColor: isFav ? 'rgba(255,122,69,0.12)' : 'transparent' }]}>
                <Text style={{ fontSize: 22, color: isFav ? c.accent : c.textSecondary }}>{isFav ? '♥' : '♡'}</Text>
              </Pressable>
            </View>

            <View style={[styles.route, hard && { borderColor: 'rgba(255,122,69,0.4)' }]}>
              <Text style={[styles.routeTag, { color: hard ? c.accent : c.success }]}>{hard ? 'SCRAMBLE' : 'HIKE'}</Text>
              <Body muted style={{ flex: 1 }}>
                {hard
                  ? 'The standard route has scrambling and real exposure. Check conditions, start early, turn around if weather builds.'
                  : 'The standard route is a hike, but it is still 14,000 ft. Start early and be off the top before afternoon storms.'}
              </Body>
            </View>

            <Pressable onPress={() => Linking.openURL(`https://www.14ers.com/search?q=${encodeURIComponent(peak.name)}`)}>
              <Text style={{ color: c.link, fontFamily: Type.bodyMedium }}>Routes and current conditions on 14ers.com  →</Text>
            </Pressable>

            {mine.length > 0 && (
              <>
                <SectionHeader title="Your ascents" />
                {mine.map((l) => (
                  <Pressable key={l.id} onPress={() => router.push(`/log/${l.id}`)} style={styles.climb}>
                    <Text style={{ color: c.text, fontFamily: Type.display, fontSize: 18 }}>{formatDate(l.date)}</Text>
                    <Text style={{ color: c.textSecondary, fontFamily: Type.body }}>
                      {l.partners.length ? `with ${l.partners.map((p) => p.name).join(', ')}` : 'Solo'}
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
  fav: { width: 54, height: 54, borderRadius: 27, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  route: { flexDirection: 'row', gap: Spacing.three, padding: Spacing.three, borderRadius: Radius.sm, borderWidth: 1, borderColor: c.border, alignItems: 'flex-start' },
  routeTag: { fontFamily: Type.monoBold, fontSize: 11, letterSpacing: 1, marginTop: 3 },
  climb: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border, gap: 2 },
  credit: { color: c.textMuted, fontFamily: Type.mono, fontSize: 9, letterSpacing: 0.3, marginTop: Spacing.four },
});
