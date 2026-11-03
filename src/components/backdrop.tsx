import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { PhotoGallery } from '@/components/peak-photo';
import { MaxContentWidth, Spacing } from '@/constants/theme';

/**
 * Full-width photo at the top of a screen, like a trail page. Swipe for more photos.
 * The title and details sit on the page under it, not on the picture.
 */
export function Backdrop({ peakId, photoId, height = 340, children }: { peakId: string; photoId?: string; lit?: boolean; height?: number; children?: ReactNode }) {
  const { width } = useWindowDimensions();
  return (
    <View>
      <View style={{ height, width: '100%' }}>
        <PhotoGallery peakId={peakId} photoId={photoId} width={width} height={height} />
        {/* Keeps the back button readable on bright snow. */}
        <LinearGradient colors={['rgba(0,0,0,0.38)', 'rgba(0,0,0,0)']} style={styles.top} pointerEvents="none" />
      </View>
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, height: 110 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.one,
  },
});
