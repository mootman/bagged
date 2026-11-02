import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef } from 'react';
import { StyleSheet, Text, View, type HostInstance } from 'react-native';

import { RidgelineArt } from '@/components/ridgeline-art';
import { Mark } from '@/components/mark';
import { Colors, Type } from '@/constants/theme';
import { formatDate, useStore } from '@/lib/store';
import type { Ascent, Peak } from '@/lib/types';
import { usePhoto } from '@/lib/use-photo';

const c = Colors.dark;

/**
 * Instagram-story card (9:16). Full-bleed summit photo (or the peak's art), big type at the
 * bottom, and the list progress that makes people want to finish.
 */
export const SummitCard = forwardRef<HostInstance, {
  peak: Peak;
  log: Ascent;
  listCount: number;
  listTotal: number;
  name: string;
  width: number;
}>(function SummitCard({ peak, log, listCount, listTotal, name, width }, ref) {
  const uri = usePhoto(log.photoId);
  const s = width / 360;
  const { user } = useStore();
  const partners = [...log.withIds.map((id) => user(id)?.name.split(' ')[0] ?? ''), ...log.guests.map((g) => g.name)].filter(Boolean);

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width, height: width * (16 / 9) }]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <RidgelineArt peakId={peak.id} lit width={width} height={width * (16 / 9)} count={36} top={0.14} bottom={0.6} amplitude={0.2} />}
      <LinearGradient colors={[c.background, 'rgba(236,238,232,0)']} style={[styles.topFade, { height: 120 * s }]} />
      <LinearGradient
        colors={['rgba(236,238,232,0)', 'rgba(236,238,232,0.9)', c.background]}
        locations={[0, 0.45, 1]}
        style={[styles.bottomFade, { height: width * 1.05 }]}
      />

      <View style={[styles.top, { padding: 24 * s }]}>
        <Mark size={18 * s} />
      </View>

      <View style={[styles.bottom, { padding: 24 * s, gap: 8 * s }]}>
        <Text style={{ color: c.text, fontSize: 16 * s, fontFamily: Type.bodyMedium }}>{formatDate(log.date)}</Text>
        <Text style={{ color: c.text, fontSize: 50 * s, fontFamily: Type.display, lineHeight: 52 * s, letterSpacing: -1.5 * s }} numberOfLines={2}>
          {peak.name}
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 15 * s, fontFamily: Type.body }}>
          {peak.elevationFt.toLocaleString()} ft{partners.length ? `. ${name} with ${partners.join(', ')}.` : ''}
        </Text>

        <View style={{ marginTop: 18 * s, gap: 8 * s }}>
          <View style={styles.row}>
            <Text style={{ color: c.text, fontSize: 18 * s, fontFamily: Type.bodyBold }}>Colorado fourteeners</Text>
            <Text style={{ color: c.textSecondary, fontSize: 18 * s, fontFamily: Type.display }}>
              <Text style={{ color: c.accent }}>{listCount}</Text> / {listTotal}
            </Text>
          </View>
          <View style={styles.segments}>
            {Array.from({ length: listTotal }, (_, i) => (
              <View key={i} style={[styles.segment, { height: 8 * s, backgroundColor: i < listCount ? c.accent : c.backgroundSelected }]} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { overflow: 'hidden', backgroundColor: c.background },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0 },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  top: { position: 'absolute', top: 0, left: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  segments: { flexDirection: 'row', gap: 2 },
  segment: { flex: 1 },
});
