import { StyleSheet, Text, View } from 'react-native';

import { BadgeMedal } from '@/components/engage';
import { Screen } from '@/components/ui';
import { Colors, Radius, Type } from '@/constants/theme';
import { badgesFor } from '@/lib/badges';
import { useStore } from '@/lib/store';

const c = Colors.dark;

/** Every badge, what it takes, and how close you are. */
export default function BadgesScreen() {
  const { logs, peaks, peakById } = useStore();
  const all = badgesFor(logs, peaks, peakById).sort((a, b) => Number(b.done) - Number(a.done) || b.have / b.need - a.have / a.need);
  const earned = all.filter((b) => b.done).length;
  return (
    <Screen>
      <Text style={styles.title}>
        {earned} of {all.length} earned
      </Text>
      {all.map((b) => (
        <View key={b.id} style={styles.row}>
          <BadgeMedal badge={b} size={56} />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.name}>{b.name}</Text>
            <Text style={styles.how}>{b.how}</Text>
            {!b.done && (
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${(b.have / b.need) * 100}%` }]} />
              </View>
            )}
          </View>
          <Text style={[styles.prog, b.done && { color: c.accent }]}>{b.done ? 'Earned' : b.need > 999 ? `${Math.round((b.have / b.need) * 100)}%` : `${b.have}/${b.need}`}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: c.text, fontFamily: Type.display, fontSize: 28 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, borderRadius: Radius.md, backgroundColor: c.backgroundElement },
  name: { color: c.text, fontFamily: Type.bodyBold, fontSize: 16 },
  how: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14, lineHeight: 19 },
  track: { height: 6, borderRadius: 3, backgroundColor: c.backgroundSelected, overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', backgroundColor: c.accent, borderRadius: 3 },
  prog: { color: c.textSecondary, fontFamily: Type.bodyBold, fontSize: 14 },
});
