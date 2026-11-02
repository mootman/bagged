import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PeakArtwork } from '@/components/peak-poster';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { usePhoto } from '@/lib/use-photo';

const c = Colors.dark;

/** Letterboxd-style backdrop: wide hero image that fades into the page, with content on top. */
export function Backdrop({ peakId, photoId, height = 340, children }: { peakId: string; photoId?: string; height?: number; children?: ReactNode }) {
  const uri = usePhoto(photoId);
  return (
    <View style={{ height, width: '100%' }}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} /> : <PeakArtwork id={peakId} />}
      <LinearGradient
        colors={['rgba(18,22,26,0.15)', 'rgba(18,22,26,0.35)', c.background]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.one,
  },
});
