import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef } from 'react';
import { StyleSheet, Text, View, type HostInstance } from 'react-native';

import { PeakArtwork } from '@/components/peak-poster';
import { APP_NAME } from '@/constants/brand';
import { Colors } from '@/constants/theme';
import { formatDate } from '@/lib/store';
import type { Peak, SummitLog } from '@/lib/types';
import { usePhoto } from '@/lib/use-photo';

const c = Colors.dark;

/**
 * Instagram-story card (9:16). Full-bleed summit photo (or the peak's art), big type at the
 * bottom, and the list progress that makes people want to finish.
 */
export const SummitCard = forwardRef<HostInstance, {
  peak: Peak;
  log: SummitLog;
  listCount: number;
  listTotal: number;
  name: string;
  width: number;
}>(function SummitCard({ peak, log, listCount, listTotal, name, width }, ref) {
  const uri = usePhoto(log.photoId);
  const s = width / 360;
  const partners = log.partners.map((p) => p.name);

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width, height: width * (16 / 9) }]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <PeakArtwork id={peak.id} />}
      <LinearGradient colors={['rgba(10,12,14,0.55)', 'transparent']} style={[styles.topFade, { height: 140 * s }]} />
      <LinearGradient
        colors={['transparent', 'rgba(10,12,14,0.75)', 'rgba(10,12,14,0.96)']}
        locations={[0, 0.45, 1]}
        style={[styles.bottomFade, { height: width * 1.05 }]}
      />

      <View style={[styles.top, { padding: 24 * s }]}>
        <View style={[styles.dot, { width: 10 * s, height: 10 * s, borderRadius: 5 * s }]} />
        <Text style={[styles.brand, { fontSize: 13 * s }]}>{APP_NAME.toUpperCase()}</Text>
      </View>

      <View style={[styles.bottom, { padding: 24 * s, gap: 8 * s }]}>
        <Text style={{ color: c.accent, fontSize: 13 * s, fontWeight: '800', letterSpacing: 2 }}>
          SIGNED {formatDate(log.date).toUpperCase()}
        </Text>
        <Text style={{ color: '#fff', fontSize: 46 * s, fontWeight: '900', lineHeight: 48 * s, letterSpacing: -1 }} numberOfLines={2}>
          {peak.name}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18 * s, fontWeight: '700' }}>
          {peak.elevationFt.toLocaleString()} ft{partners.length ? `  ·  ${name} with ${partners.join(', ')}` : ''}
        </Text>

        <View style={{ marginTop: 18 * s, gap: 8 * s }}>
          <View style={styles.row}>
            <Text style={{ color: '#fff', fontSize: 15 * s, fontWeight: '700' }}>Colorado 14ers</Text>
            <Text style={{ color: '#fff', fontSize: 15 * s, fontWeight: '800' }}>
              <Text style={{ color: c.accent }}>{listCount}</Text> / {listTotal}
            </Text>
          </View>
          <View style={styles.segments}>
            {Array.from({ length: listTotal }, (_, i) => (
              <View key={i} style={[styles.segment, { height: 8 * s, backgroundColor: i < listCount ? c.accent : 'rgba(255,255,255,0.18)' }]} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: 6, backgroundColor: c.background },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  top: { position: 'absolute', top: 0, left: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { backgroundColor: c.accent },
  brand: { color: '#fff', fontWeight: '900', letterSpacing: 3 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  segments: { flexDirection: 'row', gap: 2 },
  segment: { flex: 1, borderRadius: 2 },
});
