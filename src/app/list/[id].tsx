import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PeakImage } from '@/components/peak-photo';
import { Body, ProgressBar, Screen } from '@/components/ui';
import { Colors, Radius, Type } from '@/constants/theme';
import { routeLine } from '@/components/log-bits';
import { standardRoute } from '@/data/routes';
import { LISTS } from '@/lib/badges';
import { useStore } from '@/lib/store';

const c = Colors.dark;

/** A list to work through, Letterboxd-style, with your progress. */
export default function ListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { peakById, summitedIds } = useStore();
  const list = LISTS.find((l) => l.id === id);
  if (!list) return null;
  const done = list.peaks.filter((p) => summitedIds.has(p)).length;
  return (
    <Screen>
      <Stack.Screen options={{ title: '' }} />
      <View style={{ gap: 6 }}>
        <Text style={styles.title}>{list.name}</Text>
        <Body muted>{list.blurb}</Body>
      </View>
      <View style={{ gap: 6 }}>
        <Text style={styles.progress}>
          {done} of {list.peaks.length} done
        </Text>
        <ProgressBar value={done} total={list.peaks.length} />
      </View>
      {list.peaks.map((pid, i) => {
        const p = peakById.get(pid);
        if (!p) return null;
        const r = standardRoute(pid);
        const have = summitedIds.has(pid);
        return (
          <Pressable key={pid} onPress={() => router.push(`/peak/${pid}`)} style={styles.row}>
            <Text style={styles.n}>{i + 1}</Text>
            <PeakImage peakId={pid} width={64} height={64} radius={Radius.sm} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.name, have && { color: c.accent }]}>{p.name}</Text>
              {r ? <Text style={styles.meta}>{routeLine(r)}</Text> : null}
            </View>
            {have && <Text style={styles.check}>Done</Text>}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: c.text, fontFamily: Type.display, fontSize: 32, lineHeight: 38 },
  progress: { color: c.text, fontFamily: Type.bodyBold, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  n: { width: 18, color: c.textSecondary, fontFamily: Type.display, fontSize: 16, textAlign: 'center' },
  name: { color: c.text, fontFamily: Type.bodyBold, fontSize: 16 },
  meta: { color: c.textSecondary, fontFamily: Type.body, fontSize: 13 },
  check: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 14 },
});
