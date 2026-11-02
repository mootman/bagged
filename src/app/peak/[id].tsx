import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Backdrop } from '@/components/backdrop';
import { Body, Button, Card, Display, Label, Screen, SectionHeader } from '@/components/ui';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { tap } from '@/lib/haptics';
import { formatDate, useStore } from '@/lib/store';

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

export default function PeakScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { peaks, peakById, logs, profile, toggleFavorite, photoFor } = useStore();
  const peak = peakById.get(id);
  if (!peak) return <Screen><Body>Peak not found.</Body></Screen>;

  const mine = logs.filter((l) => l.peakId === peak.id).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  const isFav = profile.favorites.includes(peak.id);
  const favFull = profile.favorites.length >= 4 && !isFav;
  const rank = [...peaks].sort((a, b) => b.elevationFt - a.elevationFt).findIndex((p) => p.id === peak.id) + 1;
  const hard = HARD.has(peak.id);

  return (
    <>
      <Stack.Screen options={{ title: '', headerTransparent: true, headerTintColor: '#fff' }} />
      <Screen
        padded
        header={
          <Backdrop peakId={peak.id} photoId={photoFor.get(peak.id)} height={380}>
            <Label color={mine.length ? c.accent : c.textSecondary}>{mine.length ? 'Signed' : `${peak.range} Range`}</Label>
            <Display size={40}>{peak.name}</Display>
          </Backdrop>
        }>
        <View style={styles.facts}>
          <Fact value={`${peak.elevationFt.toLocaleString()}'`} label="Elevation" />
          <Fact value={`#${rank}`} label="In Colorado" />
          <Fact value={hard ? 'Scramble' : 'Hike'} label="Standard route" color={hard ? c.accent : undefined} />
        </View>

        <View style={styles.actions}>
          <Button
            title={mine.length ? 'Log it again' : 'I climbed this'}
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
            style={[styles.fav, { opacity: favFull ? 0.35 : 1, borderColor: isFav ? c.accent : c.border }]}>
            <Text style={{ fontSize: 20, color: isFav ? c.accent : c.textSecondary }}>{isFav ? '♥' : '♡'}</Text>
          </Pressable>
        </View>
        {favFull && <Body muted style={{ fontSize: 13 }}>Your four favorites are full. Remove one to add this.</Body>}

        {hard && (
          <Card style={{ borderLeftWidth: 3, borderLeftColor: c.accent }}>
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>Serious terrain</Text>
            <Body muted>
              The standard route involves scrambling and exposure. Check conditions, start early, and turn around if weather
              builds. Every summit is optional.
            </Body>
          </Card>
        )}

        <Pressable onPress={() => Linking.openURL(`https://www.14ers.com/search?q=${encodeURIComponent(peak.name)}`)}>
          <Text style={{ color: c.link, fontWeight: '600' }}>Routes and current conditions on 14ers.com</Text>
        </Pressable>

        {mine.length > 0 && (
          <>
            <SectionHeader title={`Your climbs (${mine.length})`} />
            {mine.map((l) => (
              <Pressable key={l.id} onPress={() => router.push(`/log/${l.id}`)} style={styles.climb}>
                <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>{formatDate(l.date)}</Text>
                <Text style={{ color: c.textSecondary }}>
                  {l.partners.length ? `with ${l.partners.map((p) => p.name).join(', ')}` : 'Solo'}
                </Text>
              </Pressable>
            ))}
          </>
        )}
      </Screen>
    </>
  );
}

function Fact({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={{ color: color ?? c.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 }}>{value}</Text>
      <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  facts: { flexDirection: 'row', gap: Spacing.three, paddingVertical: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.two },
  fav: { width: 52, height: 52, borderRadius: Radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  climb: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border, gap: 2 },
});
