import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';

import { Colors, Type } from '@/constants/theme';
import { tap } from '@/lib/haptics';
import { SKY_STOPS, skyAt } from '@/lib/sky';

const c = Colors.dark;

/** Scrub the sun across the day. The track is painted with the sky it controls. */
export function TimeSlider({ value, onChange }: { value: number; onChange: (t: number) => void }) {
  const [width, setWidth] = useState(1);
  const startVal = useRef(value);
  const lastLabel = useRef('');

  const pan = useMemo(
    () =>
      // Refs are only read inside the gesture callbacks, never during render.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          const t = Math.max(0, Math.min(1, e.nativeEvent.locationX / width));
          startVal.current = t;
          onChange(t);
        },
        onPanResponderMove: (_, g) => {
          const t = Math.max(0, Math.min(1, startVal.current + g.dx / width));
          const label = skyAt(t).label;
          if (label !== lastLabel.current) {
            lastLabel.current = label;
            tap();
          }
          onChange(t);
        },
      }),
    [width, onChange],
  );

  const s = skyAt(value);
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.row}>
        <Text style={styles.label}>LIGHT</Text>
        <Text style={[styles.value, { color: s.horizon }]}>{s.label}</Text>
      </View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.hit} {...pan.panHandlers}>
        <LinearGradient
          colors={SKY_STOPS.map((k) => k.horizon) as [string, string, ...string[]]}
          locations={SKY_STOPS.map((k) => k.t) as [number, number, ...number[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.track}
        />
        <View pointerEvents="none" style={[styles.knob, { left: value * width - 13, backgroundColor: s.sun, shadowColor: s.sun }]} />
      </View>
      <View style={styles.row}>
        {SKY_STOPS.filter((_, i) => i % 2 === 0 || i === SKY_STOPS.length - 1).map((k) => (
          <Text key={k.label} style={styles.tick}>
            {k.label.toUpperCase()}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { color: c.textMuted, fontFamily: Type.mono, fontSize: 11, letterSpacing: 1 },
  value: { fontFamily: Type.displayItalic, fontSize: 20 },
  hit: { height: 34, justifyContent: 'center' },
  track: { height: 6, borderRadius: 3 },
  knob: {
    position: 'absolute',
    top: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: c.background,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  tick: { color: c.textMuted, fontFamily: Type.mono, fontSize: 9, letterSpacing: 0.8 },
});
