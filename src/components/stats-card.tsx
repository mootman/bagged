import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Type } from '@/constants/theme';
import type { ClimberStats } from '@/lib/stats';

const c = Colors.dark;

function fmt(n: number) {
  return Math.round(n).toLocaleString();
}

/** The numbers people screenshot: feet, miles, Everests, and a few fun ones. */
export function StatsCard({ s, isMe }: { s: ClimberStats; isMe: boolean }) {
  if (!s.ascents) return null;
  const facts: string[] = [];
  if (s.everests >= 0.1) facts.push(`That's ${s.everests >= 1 ? s.everests.toFixed(1) : s.everests.toFixed(2)} times the height of Everest, from sea level.`);
  if (s.highest) facts.push(`Highest summit: ${s.highest.name}, ${s.highest.elevationFt.toLocaleString()} ft.`);
  if (s.mostClimbed) facts.push(`Most climbed: ${s.mostClimbed.peak.name}, ${s.mostClimbed.count} times.`);
  if (s.bestYear && s.bestYear.count > 1) facts.push(`Best year: ${s.bestYear.year}, with ${s.bestYear.count} ascents.`);
  if (s.favoriteMonth) facts.push(`${isMe ? 'You climb' : 'Climbs'} most in ${s.favoriteMonth}.`);
  if (s.hardest >= 3) facts.push(`Hardest route: class ${s.hardest}.`);
  if (s.rangesDone.length) facts.push(`Finished every 14er in the ${s.rangesDone.join(' and ')} ${s.rangesDone.length > 1 ? 'ranges' : 'Range'}.`);
  if (s.avgRating) facts.push(`Average rating: ${s.avgRating.toFixed(1)} stars.`);

  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <Text style={styles.heroNum}>{fmt(s.feet)}</Text>
        <Text style={styles.heroLabel}>feet climbed</Text>
      </View>
      <View style={styles.grid}>
        <Cell value={s.miles.toLocaleString()} label="miles hiked" />
        <Cell value={String(s.ascents)} label={s.ascents === 1 ? 'ascent' : 'ascents'} />
        <Cell value={String(s.peaks)} label="different 14ers" />
        <Cell value={String(s.winter)} label="winter ascents" />
      </View>
      {facts.length > 0 && (
        <View style={{ gap: 6 }}>
          {facts.map((f) => (
            <Text key={f} style={styles.fact}>
              {f}
            </Text>
          ))}
        </View>
      )}
      <Text style={styles.fine}>Feet and miles use the route you picked, or the standard route when you didn&apos;t pick one.</Text>
    </View>
  );
}

function Cell({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellValue}>{value}</Text>
      <Text style={styles.cellLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, backgroundColor: c.backgroundElement, padding: 20, gap: 16 },
  hero: { gap: 0 },
  heroNum: { color: c.accent, fontFamily: Type.display, fontSize: 52, lineHeight: 58 },
  heroLabel: { color: c.text, fontFamily: Type.bodyBold, fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 },
  cell: { width: '50%', gap: 1 },
  cellValue: { color: c.text, fontFamily: Type.display, fontSize: 28 },
  cellLabel: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14 },
  fact: { color: c.text, fontFamily: Type.body, fontSize: 15, lineHeight: 21 },
  fine: { color: c.textMuted, fontFamily: Type.body, fontSize: 12 },
});
