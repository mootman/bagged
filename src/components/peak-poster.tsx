import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { RidgelineArt } from '@/components/ridgeline-art';
import { Colors, Type } from '@/constants/theme';
import type { Peak } from '@/lib/types';
import { usePhoto } from '@/lib/use-photo';

const c = Colors.dark;

/**
 * 2:3 sheet for a peak. Your summit photo if you have one, otherwise its real terrain,
 * inked in blue once you've climbed it. The name sits on the sheet, under the drawing.
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
  const longest = Math.max(...name.split(' ').map((w) => w.length));
  const fontSize = Math.min(small ? 12 : 15, (width - 14) / (longest * 0.56));
  const paper = climbed ? '#F6F7F3' : c.backgroundElement;

  return (
    <View style={[styles.sheet, { width, height, backgroundColor: paper }, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <RidgelineArt
          peakId={peak.id}
          lit={climbed}
          width={width}
          height={height}
          count={tiny ? 10 : small ? 16 : 24}
          top={showTitle ? 0.14 : 0.2}
          bottom={showTitle ? 0.68 : 0.94}
          amplitude={0.28}
          paper={paper}
          marker={!tiny}
        />
      )}
      {showTitle && (
        <View style={[styles.title, uri && styles.titleOnPhoto]}>
          <Text numberOfLines={2} style={{ color: uri ? '#fff' : c.text, fontFamily: Type.display, fontSize, lineHeight: fontSize * 1.1, letterSpacing: -0.2 }}>
            {name}
          </Text>
          <Text style={[styles.elev, { fontSize: small ? 11 : 12, color: uri ? 'rgba(255,255,255,0.85)' : climbed ? c.accent : c.textSecondary }]}>
            {peak.elevationFt.toLocaleString()} ft
          </Text>
        </View>
      )}
      {/* A climbed sheet gets a heavy blue edge along the bottom, like a filed map. */}
      {climbed && !tiny && <View style={styles.edge} />}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { overflow: 'hidden' },
  title: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 8, paddingBottom: 10 },
  titleOnPhoto: { backgroundColor: 'rgba(21,32,26,0.45)', paddingTop: 8 },
  elev: { fontFamily: Type.bodyMedium, marginTop: 2, fontVariant: ['tabular-nums'] },
  edge: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: c.accent },
});
