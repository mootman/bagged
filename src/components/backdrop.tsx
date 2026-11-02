import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { RidgelineArt } from '@/components/ridgeline-art';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { usePhoto } from '@/lib/use-photo';

const c = Colors.dark;

/** Letterboxd-style backdrop: wide hero image that fades into the page, with content on top. */
export function Backdrop({ peakId, photoId, lit = true, height = 340, children }: { peakId: string; photoId?: string; lit?: boolean; height?: number; children?: ReactNode }) {
  const uri = usePhoto(photoId);
  const { width } = useWindowDimensions();
  return (
    <View style={{ height, width: '100%' }}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} /> : <RidgelineArt peakId={peakId} lit={lit} width={width} height={height} count={34} top={0.12} bottom={0.8} amplitude={0.28} reveal />}
      <LinearGradient
        colors={['rgba(236,238,232,0)', 'rgba(236,238,232,0.55)', c.background]}
        locations={[0, 0.6, 1]}
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
