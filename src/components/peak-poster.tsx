import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop } from 'react-native-svg';

import { Colors, Radius } from '@/constants/theme';
import { ART_H, ART_W, peakArt } from '@/lib/peak-art';
import type { Peak } from '@/lib/types';
import { usePhoto } from '@/lib/use-photo';

const c = Colors.dark;

export const PeakArtwork = memo(function PeakArtwork({ id }: { id: string }) {
  const art = peakArt(id);
  const gid = `sky-${id}`;
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${ART_W} ${ART_H}`} preserveAspectRatio="xMidYMid slice">
      <Defs>
        <SvgGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={art.sky[0]} />
          <Stop offset="0.75" stopColor={art.sky[1]} />
        </SvgGradient>
      </Defs>
      <Rect width={ART_W} height={ART_H} fill={`url(#${gid})`} />
      {art.stars.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity={0.7} />
      ))}
      {art.layers.map((l, i) => (
        <Path key={i} d={l.d} fill={l.fill} />
      ))}
      {art.snow && <Path d={art.snow} fill="#F4F1EA" opacity={0.92} />}
    </Svg>
  );
});

/**
 * 2:3 poster for a peak. Your own summit photo if you have one, otherwise generated art.
 * Unclimbed peaks are dimmed so the climbed ones glow, like a collection with gaps.
 */
export function PeakPoster({
  peak,
  width,
  climbed,
  photoId,
  showTitle = true,
  style,
}: {
  peak: Peak;
  width: number;
  climbed: boolean;
  photoId?: string;
  showTitle?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const uri = usePhoto(photoId);
  const height = width * 1.5;
  const small = width < 90;

  return (
    <View style={[styles.poster, { width, height, borderColor: climbed ? c.accent : c.border }, style]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : <PeakArtwork id={peak.id} />}
      {!climbed && <View style={[StyleSheet.absoluteFill, styles.dim]} />}
      {showTitle && (
        <LinearGradient colors={['transparent', 'rgba(10,12,14,0.92)']} style={styles.titleWrap}>
          <Text numberOfLines={2} style={[styles.title, { fontSize: small ? 10.5 : 13 }]}>
            {peak.name.replace(/^Mount /, 'Mt. ')}
          </Text>
          {!small && <Text style={styles.sub}>{peak.elevationFt.toLocaleString()}&apos;</Text>}
        </LinearGradient>
      )}
      {climbed && width >= 60 && <View style={[styles.badge, small && { width: 14, height: 14, top: 5, right: 5 }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  poster: {
    borderRadius: Radius.xs,
    overflow: 'hidden',
    backgroundColor: c.backgroundElement,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  dim: { backgroundColor: 'rgba(18,22,26,0.62)' },
  titleWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 7, paddingTop: 22, paddingBottom: 7 },
  title: { color: c.text, fontWeight: '700', lineHeight: 15, letterSpacing: -0.1 },
  sub: { color: c.textSecondary, fontSize: 11, marginTop: 1, fontWeight: '500' },
  badge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: c.accent,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
});
