import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef } from 'react';
import { StyleSheet, Text, View, type HostInstance } from 'react-native';

import { Mark } from '@/components/mark';
import { PeakImage, photosFor } from '@/components/peak-photo';
import { Colors, Type } from '@/constants/theme';
import { formatDate, useStore } from '@/lib/store';
import type { Ascent, Peak } from '@/lib/types';
import { usePhoto } from '@/lib/use-photo';

const c = Colors.dark;

/**
 * Instagram-story card (9:16). Your summit photo, or a photo of the peak, full bleed.
 * Big type at the bottom and the list progress that makes people want to finish.
 */
export const SummitCard = forwardRef<HostInstance, {
  peak: Peak;
  log: Ascent;
  listCount: number;
  listTotal: number;
  name: string;
  width: number;
}>(function SummitCard({ peak, log, listCount, listTotal, name, width }, ref) {
  const s = width / 360;
  const height = width * (16 / 9);
  const { user } = useStore();
  const own = usePhoto(log.photoId);
  const partners = [...log.withIds.map((id) => user(id)?.name.split(' ')[0] ?? ''), ...log.guests.map((g) => g.name)].filter(Boolean);
  const credit = !own ? photosFor(peak.id)[0] : undefined;

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width, height, borderRadius: 18 * s }]}>
      <PeakImage peakId={peak.id} photoId={log.photoId} width={width} height={height} />
      <LinearGradient colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']} style={[styles.fade, { top: 0, height: 140 * s }]} />
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.82)']} locations={[0, 0.45, 1]} style={[styles.fade, { bottom: 0, height: width * 1.05 }]} />

      <View style={[styles.top, { padding: 22 * s }]}>
        <Mark color="#fff" size={18 * s} />
      </View>

      <View style={[styles.bottom, { padding: 24 * s, gap: 6 * s }]}>
        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 * s, fontFamily: Type.bodyBold }}>{formatDate(log.date)}</Text>
        <Text style={{ color: '#fff', fontSize: 50 * s, fontFamily: Type.display, lineHeight: 56 * s }} numberOfLines={2}>
          {peak.name}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 * s, fontFamily: Type.body }}>
          {peak.elevationFt.toLocaleString()} ft{partners.length ? `. ${name} with ${partners.join(', ')}.` : ''}
        </Text>

        <View style={{ marginTop: 18 * s, gap: 8 * s }}>
          <View style={styles.row}>
            <Text style={{ color: '#fff', fontSize: 17 * s, fontFamily: Type.bodyBold }}>Colorado fourteeners</Text>
            <Text style={{ color: '#fff', fontSize: 17 * s, fontFamily: Type.bodyBold }}>
              {listCount} of {listTotal}
            </Text>
          </View>
          <View style={[styles.track, { height: 8 * s, borderRadius: 4 * s }]}>
            <View style={{ width: `${(listCount / listTotal) * 100}%`, height: '100%', backgroundColor: '#fff', borderRadius: 4 * s }} />
          </View>
        </View>
        {credit ? <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9 * s, fontFamily: Type.body, marginTop: 10 * s }}>Photo: {credit.author}, {credit.license}</Text> : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { overflow: 'hidden', backgroundColor: c.text },
  fade: { position: 'absolute', left: 0, right: 0 },
  top: { position: 'absolute', top: 0, left: 0 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden' },
});
