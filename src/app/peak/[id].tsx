import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, useStore } from '@/lib/store';

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
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { peakById, logs, profile, toggleFavorite } = useStore();
  const peak = peakById.get(id);
  if (!peak) return <Screen><ThemedText>Peak not found.</ThemedText></Screen>;

  const mine = logs.filter((l) => l.peakId === peak.id);
  const isFav = profile.favorites.includes(peak.id);
  const favFull = profile.favorites.length >= 4 && !isFav;

  return (
    <Screen>
      <Stack.Screen options={{ title: peak.name }} />
      <View style={{ gap: Spacing.one }}>
        <ThemedText type="subtitle">{peak.name}</ThemedText>
        <ThemedText themeColor="textSecondary">
          {peak.elevationFt.toLocaleString()} ft · {peak.range} Range{peak.ranked ? '' : ' · unranked'}
        </ThemedText>
      </View>

      {HARD.has(peak.id) && (
        <Card style={{ borderLeftWidth: 4, borderLeftColor: t.accent }}>
          <ThemedText type="smallBold">Serious terrain</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Standard routes here involve scrambling or exposure. Check current conditions and the route, start early, and
            turn around if weather builds. Bagged doesn&apos;t give route directions.
          </ThemedText>
        </Card>
      )}

      <Button title="Log this summit" onPress={() => router.push({ pathname: '/log/new', params: { peakId: peak.id } })} />
      <View style={styles.row}>
        <Button
          title={isFav ? 'Remove from favorites' : favFull ? 'Favorites full (4)' : 'Add to four favorites'}
          variant="secondary"
          disabled={favFull}
          onPress={() => toggleFavorite(peak.id)}
          style={{ flex: 1 }}
        />
      </View>
      <Pressable
        onPress={() =>
          Linking.openURL(`https://www.14ers.com/search?q=${encodeURIComponent(peak.name)}`)
        }>
        <ThemedText type="linkPrimary" style={{ color: t.accent }}>
          Routes and conditions on 14ers.com
        </ThemedText>
      </Pressable>

      {mine.length > 0 && (
        <>
          <SectionTitle>Your climbs</SectionTitle>
          {mine.map((l) => (
            <Pressable key={l.id} onPress={() => router.push(`/log/${l.id}`)}>
              <Card>
                <ThemedText type="smallBold">{formatDate(l.date)}</ThemedText>
                {l.partners.length > 0 && (
                  <ThemedText type="small" themeColor="textSecondary">
                    with {l.partners.map((p) => p.name).join(', ')}
                  </ThemedText>
                )}
              </Card>
            </Pressable>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: Spacing.two } });
