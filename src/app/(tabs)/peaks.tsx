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
  const cols = contentW > 500 ? 5 : 3;
  const gap = Spacing.two;
  const posterW = (contentW - gap * (cols - 1)) / cols;

  const climbed = peaks.filter((p) => summitedIds.has(p.id)).length;
  const shown = peaks
    .filter((p) => (filter === 'climbed' ? summitedIds.has(p.id) : filter === 'todo' ? !summitedIds.has(p.id) : true))
    .filter((p) => !q || `${p.name} ${p.range}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.elevationFt - a.elevationFt);

  return (
    <Screen tabs>
      <View style={{ gap: 2 }}>
        <Display size={30}>Colorado 14ers</Display>
        <Text style={{ color: c.textSecondary, fontSize: 15, fontFamily: Type.displayItalic }}>
          <Text style={{ color: c.accent, fontFamily: Type.display }}>{climbed}</Text> of {peaks.length} signed
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
        <Chip label={`Climbed ${climbed}`} active={filter === 'climbed'} onPress={() => setFilter('climbed')} />
        <Chip label={`To go ${peaks.length - climbed}`} active={filter === 'todo'} onPress={() => setFilter('todo')} />
      </View>
      <View style={[styles.grid, { gap }]}>
        {shown.map((p) => (
          <Tilt key={p.id} width={posterW} height={posterW * 1.5} onPress={() => router.push(`/peak/${p.id}`)}>
            <PeakPoster peak={p} width={posterW} climbed={summitedIds.has(p.id)} photoId={photoFor.get(p.id)} />
          </Tilt>
        ))}
      </View>
      {shown.length === 0 && (
        <Text style={{ color: c.textSecondary, textAlign: 'center', marginTop: Spacing.four }}>
          {filter === 'climbed' ? 'Nothing signed yet. Your first one is out there.' : 'No peaks match that.'}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { backgroundColor: c.backgroundElement, color: c.text, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontFamily: Type.body },
  chips: { flexDirection: 'row', gap: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
