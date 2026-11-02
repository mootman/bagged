import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { RidgelineArt } from '@/components/ridgeline-art';
import { Colors, Radius, Type } from '@/constants/theme';
import type { Peak } from '@/lib/types';
import { usePhoto } from '@/lib/use-photo';

const c = Colors.dark;

/**
 * 2:3 poster for a peak. Your own summit photo if you have one, otherwise the peak's real
 * terrain as a ridgeline plot, lit when you've climbed it.
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
  const height = Math.round(width * 1.5);
  const small = width < 90;
  const tiny = width < 60;
  const name = peak.name.replace(/^Mount /, 'Mt. ');
  // Shrink type for long single words (Uncompahgre) so they never break mid-word.
  const longest = Math.max(...name.split(' ').map((w) => w.length));
  const base = small ? 12 : 15;
  const fontSize = Math.min(base, (width - 16) / (longest * 0.58));

  return (
    <View
      style={[
        styles.poster,
        { width, height, borderColor: climbed ? 'rgba(255,122,69,0.55)' : c.border },
        climbed && !tiny && styles.glow,
        style,
      ]}>
      {uri ? (
        <>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          {!climbed && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,15,19,0.6)' }]} />}
        </>
      ) : (
        <RidgelineArt
          peakId={peak.id}
          lit={climbed}
          width={width}
          height={height}
          count={tiny ? 12 : small ? 18 : 26}
          top={showTitle ? 0.18 : 0.22}
          bottom={showTitle ? 0.74 : 0.95}
          amplitude={0.3}
        />
      )}
      {showTitle && (
        <LinearGradient colors={['transparent', 'rgba(10,15,19,0.95)']} locations={[0, 0.6]} style={styles.titleWrap}>
          <Text numberOfLines={2} style={[styles.title, { fontSize, lineHeight: fontSize * 1.15 }]}>
            {name}
          </Text>
          <Text style={[styles.sub, { color: climbed ? c.accent : c.textMuted, fontSize: small ? 9 : 10 }]}>
            {peak.elevationFt.toLocaleString()} FT
          </Text>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  poster: {
    borderRadius: Radius.xs,
    overflow: 'hidden',
    backgroundColor: c.background,
    borderWidth: 1,
  },
  glow: {
    shadowColor: c.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  titleWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 8, paddingTop: 26, paddingBottom: 8 },
  title: { color: c.text, fontFamily: Type.display },
  sub: { fontFamily: Type.mono, marginTop: 3, letterSpacing: 0.6 },
});
