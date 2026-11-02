import { forwardRef } from 'react';
import { StyleSheet, Text, View, type HostInstance } from 'react-native';

import { PassportMap } from '@/components/passport-map';
import { Colors } from '@/constants/theme';
import { formatDate } from '@/lib/store';
import type { Peak, SummitLog } from '@/lib/types';

/** Instagram-story shaped card (9:16). Always dark so it looks the same for everyone. */
export const SummitCard = forwardRef<HostInstance, {
  peak: Peak;
  log: SummitLog;
  allPeaks: Peak[];
  summited: Set<string>;
  name: string;
  width: number;
}>(function SummitCard({ peak, log, allPeaks, summited, name, width }, ref) {
  const c = Colors.dark;
  const s = width / 360;
  const count = allPeaks.filter((p) => summited.has(p.id)).length;
  const partners = log.partners.map((p) => p.name);

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width, height: width * (16 / 9), backgroundColor: c.background, padding: 24 * s }]}>
      <View style={{ gap: 6 * s }}>
        <Text style={[styles.brand, { color: c.accent, fontSize: 14 * s, marginBottom: 14 * s }]}>BAGGED</Text>
        <Text style={{ color: c.textSecondary, fontSize: 14 * s, fontWeight: '600' }}>{formatDate(log.date).toUpperCase()}</Text>
        <Text style={{ color: c.text, fontSize: 40 * s, fontWeight: '800', lineHeight: 44 * s }} numberOfLines={2}>
          {peak.name}
        </Text>
        <Text style={{ color: c.text, fontSize: 18 * s, fontWeight: '600' }}>{peak.elevationFt.toLocaleString()} ft</Text>
        {partners.length > 0 && (
          <Text style={{ color: c.textSecondary, fontSize: 15 * s }} numberOfLines={2}>
            {name} with {partners.join(', ')}
          </Text>
        )}
      </View>

      <View style={{ alignItems: 'center' }}>
        <PassportMap peaks={allPeaks} summited={summited} colors={c} width={width - 48 * s} maxHeight={width * (16 / 9) - 380 * s} showFrame={false} />
      </View>

      <View style={{ gap: 8 * s }}>
        <View style={styles.row}>
          <Text style={{ color: c.text, fontSize: 16 * s, fontWeight: '700' }}>Colorado 14ers</Text>
          <Text style={{ color: c.accent, fontSize: 16 * s, fontWeight: '800' }}>
            {count}/{allPeaks.length}
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: c.backgroundSelected, height: 10 * s }]}>
          <View style={{ width: `${(count / allPeaks.length) * 100}%`, height: '100%', backgroundColor: c.accent, borderRadius: 5 * s }} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { justifyContent: 'space-between', overflow: 'hidden' },
  brand: { fontWeight: '900', letterSpacing: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { borderRadius: 5, overflow: 'hidden' },
});
