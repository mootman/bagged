import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/lib/store';

export default function PeaksScreen() {
  const t = useTheme();
  const { peaks, summitedIds } = useStore();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'elevation' | 'range'>('elevation');

  const shown = peaks
    .filter((p) => !q || `${p.name} ${p.range}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) =>
      sort === 'elevation' ? b.elevationFt - a.elevationFt : a.range.localeCompare(b.range) || b.elevationFt - a.elevationFt,
    );

  return (
    <Screen tabs>
      <ThemedText type="subtitle">Colorado 14ers</ThemedText>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Search peaks or ranges"
        placeholderTextColor={t.textSecondary}
        style={[styles.search, { color: t.text, backgroundColor: t.backgroundElement }]}
      />
      <View style={styles.sortRow}>
        {(['elevation', 'range'] as const).map((s) => (
          <Pressable key={s} onPress={() => setSort(s)} style={[styles.chip, { backgroundColor: sort === s ? t.text : t.backgroundElement }]}>
            <ThemedText type="small" style={{ color: sort === s ? t.background : t.text }}>
              By {s}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      <View>
        {shown.map((p) => {
          const done = summitedIds.has(p.id);
          return (
            <Pressable key={p.id} onPress={() => router.push(`/peak/${p.id}`)} style={[styles.row, { borderBottomColor: t.border }]}>
              <View style={[styles.dot, { backgroundColor: done ? t.accent : 'transparent', borderColor: done ? t.accent : t.unclimbed }]} />
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">{p.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {p.range}
                  {p.ranked ? '' : ' · unranked'}
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {p.elevationFt.toLocaleString()}&apos;
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: { borderRadius: Radius.sm, padding: Spacing.three, fontSize: 16 },
  sortRow: { flexDirection: 'row', gap: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderRadius: 99 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
});
