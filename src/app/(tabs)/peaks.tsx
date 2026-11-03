import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { PeakPoster } from '@/components/peak-poster';
import { Tilt } from '@/components/tilt';
import { Chip, Display, Screen } from '@/components/ui';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useStore } from '@/lib/store';

const c = Colors.dark;
type Filter = 'all' | 'climbed' | 'todo';

/** Letterboxd's core surface: a grid of posters. Here, every 14er, with your gaps showing. */
export default function PeaksScreen() {
  const { width } = useWindowDimensions();
  const { peaks, summitedIds, photoFor } = useStore();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const contentW = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const cols = contentW > 500 ? 3 : 2;
  const gap = 12;
  const posterW = (contentW - gap * (cols - 1)) / cols;

  const climbed = peaks.filter((p) => summitedIds.has(p.id)).length;
  const shown = peaks
    .filter((p) => (filter === 'climbed' ? summitedIds.has(p.id) : filter === 'todo' ? !summitedIds.has(p.id) : true))
    .filter((p) => !q || `${p.name} ${p.range}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.elevationFt - a.elevationFt);

  return (
    <Screen tabs>
      <View style={{ gap: 2 }}>
        <Display size={34}>Peaks</Display>
        <Text style={{ color: c.textSecondary, fontSize: 16, fontFamily: Type.body }}>
          You&apos;ve climbed {climbed} of Colorado&apos;s {peaks.length} fourteeners
        </Text>
      </View>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search peaks or ranges"
        placeholderTextColor={c.textMuted}
        style={styles.search}
      />
      <View style={styles.chips}>
        <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label={`Climbed (${climbed})`} active={filter === 'climbed'} onPress={() => setFilter('climbed')} />
        <Chip label={`Still to do (${peaks.length - climbed})`} active={filter === 'todo'} onPress={() => setFilter('todo')} />
      </View>
      <View style={[styles.grid, { gap }]}>
        {shown.map((p) => (
          <Tilt key={p.id} width={posterW} height={posterW * 1.25} onPress={() => router.push(`/peak/${p.id}`)}>
            <PeakPoster peak={p} width={posterW} aspect={1.25} climbed={summitedIds.has(p.id)} photoId={photoFor.get(p.id)} />
          </Tilt>
        ))}
      </View>
      {shown.length === 0 && (
        <Text style={{ color: c.textSecondary, textAlign: 'center', marginTop: Spacing.four }}>
          {filter === 'climbed' ? 'Nothing logged yet. Your first one is out there.' : 'No peaks match that.'}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { backgroundColor: c.backgroundElement, color: c.text, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 99, fontSize: 16, fontFamily: Type.body },
  chips: { flexDirection: 'row', gap: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
