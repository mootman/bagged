import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/icon';
import { PeakImage } from '@/components/peak-photo';
import { Colors, Radius, Type } from '@/constants/theme';
import type { Peak } from '@/lib/types';

const c = Colors.dark;

/**
 * A peak as a photo tile, 2:3 like a film poster on Letterboxd. Your summit photo if you have
 * one, otherwise a photo of the mountain. A check in the corner once you've climbed it.
 */
export function PeakPoster({
  peak,
  width,
  climbed,
  photoId,
  showTitle = true,
  aspect = 1.5,
  style,
}: {
  peak: Peak;
  width: number;
  climbed: boolean;
  photoId?: string;
  showTitle?: boolean;
  aspect?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const height = Math.round(width * aspect);
  const small = width < 100;
  const tiny = width < 60;
  const name = peak.name.replace(/^Mount /, 'Mt. ');
  const radius = tiny ? Radius.xs : small ? Radius.sm : Radius.md;

  return (
    <View style={[{ width, height, borderRadius: radius, overflow: 'hidden' }, style]}>
      <PeakImage peakId={peak.id} photoId={photoId} width={width} height={height} />
      {showTitle && (
        <>
          <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.62)']} style={[styles.shade, { height: height * 0.55 }]} pointerEvents="none" />
          <View style={[styles.title, { padding: small ? 8 : 12 }]} pointerEvents="none">
            <Text numberOfLines={2} style={[styles.name, { fontSize: small ? 14 : 18, lineHeight: small ? 16 : 21 }]}>
              {name}
            </Text>
            <Text style={[styles.elev, { fontSize: small ? 11 : 13 }]}>{peak.elevationFt.toLocaleString()} ft</Text>
          </View>
        </>
      )}
      {climbed && !tiny && (
        <View style={[styles.badge, small && { width: 22, height: 22, borderRadius: 11, top: 6, right: 6 }]}>
          <Icon name="check" size={small ? 13 : 16} color="#fff" weight={2.6} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  title: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  name: { color: '#fff', fontFamily: Type.display },
  elev: { color: 'rgba(255,255,255,0.88)', fontFamily: Type.bodyMedium, marginTop: 2 },
  badge: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
});
