import { Image } from 'expo-image';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { RidgelineArt } from '@/components/ridgeline-art';
import { Colors, Type } from '@/constants/theme';
import { PEAK_PHOTOS } from '@/data/peak-photos.generated';
import type { PeakPhoto } from '@/lib/types';
import { usePhoto } from '@/lib/use-photo';

const c = Colors.dark;

export function photosFor(peakId: string): PeakPhoto[] {
  return PEAK_PHOTOS[peakId] ?? [];
}

/** A stable pick so the same post always shows the same photo, but a feed doesn't repeat one. */
export function pickIndex(key: string, n: number) {
  if (n <= 1) return 0;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

/**
 * The picture for a peak. Your own summit photo when there is one, otherwise a photo of the
 * mountain, otherwise its ridgeline drawn from real terrain.
 */
export function PeakImage({
  peakId,
  photoId,
  index = 0,
  width,
  height,
  radius = 0,
  credit = false,
  style,
}: {
  peakId: string;
  photoId?: string;
  index?: number;
  width: number;
  height: number;
  radius?: number;
  credit?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const uri = usePhoto(photoId);
  const photos = photosFor(peakId);
  const photo = photos.length ? photos[index % photos.length] : undefined;

  return (
    <View style={[{ width, height, borderRadius: radius, overflow: 'hidden', backgroundColor: c.backgroundElement }, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : photo ? (
        <Image source={photo.src} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <RidgelineArt peakId={peakId} lit width={width} height={height} count={Math.max(10, Math.round(height / 9))} top={0.12} bottom={0.95} amplitude={0.3} paper={c.backgroundElement} />
      )}
      {credit && !uri && photo ? <Credit photo={photo} /> : null}
    </View>
  );
}

/** Small credit on the photo itself. Tap to open its page on Wikimedia Commons. */
export function Credit({ photo, style }: { photo: PeakPhoto; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={() => Linking.openURL(photo.source)} hitSlop={6} style={[styles.credit, style]}>
      <Text numberOfLines={1} style={styles.creditText}>
        {photo.author}, {photo.license}
      </Text>
    </Pressable>
  );
}

/** Swipe through every photo of a peak, full width. Dots show where you are. */
export function PhotoGallery({ peakId, photoId, width, height }: { peakId: string; photoId?: string; width: number; height: number }) {
  const uri = usePhoto(photoId);
  const photos = photosFor(peakId);
  const [page, setPage] = useState(0);
  const count = (uri ? 1 : 0) + photos.length;

  if (count <= 1) return <PeakImage peakId={peakId} photoId={photoId} width={width} height={height} credit />;

  return (
    <View style={{ width, height }}>
      <ScrollPager width={width} height={height} onPage={setPage}>
        {uri ? <Image key="mine" source={{ uri }} style={{ width, height }} contentFit="cover" /> : null}
        {photos.map((p, i) => (
          <View key={i} style={{ width, height }}>
            <Image source={p.src} style={{ width, height }} contentFit="cover" transition={150} />
            <Credit photo={p} />
          </View>
        ))}
      </ScrollPager>
      <View pointerEvents="none" style={styles.dots}>
        {Array.from({ length: count }, (_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotOn]} />
        ))}
      </View>
    </View>
  );
}

function ScrollPager({ width, height, onPage, children }: { width: number; height: number; onPage: (i: number) => void; children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={{ width, height }}
      scrollEventThrottle={32}
      onScroll={(e) => onPage(Math.round(e.nativeEvent.contentOffset.x / width))}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  credit: { position: 'absolute', right: 8, bottom: 8, maxWidth: '70%', backgroundColor: 'rgba(0,0,0,0.38)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  creditText: { color: 'rgba(255,255,255,0.92)', fontFamily: Type.body, fontSize: 10 },
  dots: { position: 'absolute', bottom: 14, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotOn: { backgroundColor: '#fff', width: 18 },
});
