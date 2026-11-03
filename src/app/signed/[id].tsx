import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RidgelineArt } from '@/components/ridgeline-art';
import { Stamp } from '@/components/stamp';
import { Button } from '@/components/ui';
import { Colors, Type } from '@/constants/theme';
import { formatDate, useStore } from '@/lib/store';
import { useCountUp } from '@/lib/use-count-up';

const c = Colors.dark;

/**
 * The moment of signing: the mountain draws itself in, the stamp slams down,
 * the list count ticks up. `count` > 1 when several summits were signed at once.
 */
export default function SignedScreen() {
  const { id, count } = useLocalSearchParams<{ id: string; count?: string }>();
  const { logs, peakById, peaks, summitedIds } = useStore();
  const { width, height } = useWindowDimensions();
  const log = logs.find((l) => l.id === id);
  const peak = log && peakById.get(log.peakId);
  const n = Number(count ?? 1);

  const listCount = peaks.filter((p) => summitedIds.has(p.id)).length;
  const before = Math.max(0, listCount - n);
  const shown = useCountUp(listCount, { from: before, duration: 900, delay: 1500 });

  const stampScale = useSharedValue(2.8);
  const stampOpacity = useSharedValue(0);
  const shake = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    stampOpacity.set(withDelay(900, withTiming(1, { duration: 80 })));
    stampScale.set(withDelay(900, withSpring(1, { damping: 9, stiffness: 260, mass: 0.6 })));
    shake.set(withDelay(1000, withSequence(withTiming(6, { duration: 40 }), withTiming(-5, { duration: 50 }), withTiming(3, { duration: 50 }), withTiming(0, { duration: 60 }))));
    textOpacity.set(withDelay(1300, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })));
    const t = setTimeout(() => {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }, 980);
    const t2 = setTimeout(() => {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 2300);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [stampOpacity, stampScale, shake, textOpacity]);

  const stampStyle = useAnimatedStyle(() => ({
    opacity: stampOpacity.get(),
    transform: [{ translateX: shake.get() }, { scale: stampScale.get() }, { rotate: '-11deg' }],
  }));
  const fadeIn = useAnimatedStyle(() => ({ opacity: textOpacity.get(), transform: [{ translateY: (1 - textOpacity.get()) * 14 }] }));

  if (!log || !peak) return null;
  const stampDate = log.date ? log.date.slice(5).replace('-', '.') + '.' + log.date.slice(2, 4) : 'Summit';

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={StyleSheet.absoluteFill}>
        <RidgelineArt peakId={peak.id} lit width={width} height={height} count={44} top={0.16} bottom={0.78} amplitude={0.22} reveal />
        <LinearGradient colors={['transparent', 'rgba(251,250,247,0.92)', c.background]} locations={[0, 0.45, 1]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: height * 0.5 }} />
      </View>
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Animated.View style={stampStyle}>
            <Stamp name={peak.name} elevationFt={peak.elevationFt} date={stampDate} size={Math.min(250, width * 0.62)} />
          </Animated.View>
        </View>
        <Animated.View style={[styles.bottom, fadeIn]}>
          <Text style={styles.kicker}>{n > 1 ? `${n} summits signed` : formatDate(log.date)}</Text>
          <Text style={styles.title}>{n > 1 ? 'Your register is open.' : peak.name}</Text>
          <View style={styles.countRow}>
            <Text style={styles.count}>{shown}</Text>
            <Text style={styles.of}> / {peaks.length}</Text>
            <Text style={styles.list}>  Colorado fourteeners</Text>
          </View>
          <View style={styles.segments}>
            {peaks.map((p, i) => (
              <View key={p.id} style={[styles.seg, { backgroundColor: i < shown ? c.accent : c.backgroundSelected }]} />
            ))}
          </View>
          <View style={{ gap: 10, marginTop: 18 }}>
            <Button title="Share the card" onPress={() => router.replace(`/share/${log.id}`)} />
            <Button title="Back to my register" variant="ghost" onPress={() => router.dismissTo('/')} />
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 22 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 30 },
  bottom: { paddingBottom: 18 },
  kicker: { color: c.text, fontFamily: Type.bodyMedium, fontSize: 17 },
  title: { color: c.text, fontFamily: Type.display, fontSize: 44, lineHeight: 46, marginTop: 4 },
  countRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 12 },
  count: { color: c.accent, fontFamily: Type.display, fontSize: 56 },
  of: { color: c.textSecondary, fontFamily: Type.display, fontSize: 26 },
  list: { color: c.textSecondary, fontFamily: Type.body, fontSize: 16 },
  segments: { flexDirection: 'row', gap: 2, marginTop: 10 },
  seg: { flex: 1, height: 8, borderRadius: 2 },
});
