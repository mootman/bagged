import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { ClipPath, Defs, Path, Rect } from 'react-native-svg';

import { Icon } from '@/components/icon';
import { Colors, Radius, Type } from '@/constants/theme';
import { OTHER_ROUTE_ID, type Route } from '@/data/routes';
import { tap } from '@/lib/haptics';

const c = Colors.dark;
const STAR = 'M12 2.8 L14.7 8.9 L21.3 9.5 L16.3 13.9 L17.8 20.4 L12 17 L6.2 20.4 L7.7 13.9 L2.7 9.5 L9.3 8.9 Z';

/** One star, filled 0, half or whole. */
function Star({ fill, size, color }: { fill: 0 | 0.5 | 1; size: number; color: string }) {
  const id = `half-${size}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <ClipPath id={id}>
          <Rect x={0} y={0} width={12} height={24} />
        </ClipPath>
      </Defs>
      <Path d={STAR} fill={c.backgroundSelected} />
      {fill > 0 && <Path d={STAR} fill={color} clipPath={fill === 0.5 ? `url(#${id})` : undefined} />}
    </Svg>
  );
}

/** Read-only stars, like Letterboxd's: half steps. */
export function Stars({ value, size = 14, color = c.gold }: { value: number; size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} color={color} fill={value >= i ? 1 : value >= i - 0.5 ? 0.5 : 0} />
      ))}
    </View>
  );
}

/** Tap the left half of a star for a half, the right half for a whole. Tap the same value to clear. */
export function StarInput({ value, onChange, size = 38 }: { value?: number; onChange: (v: number | undefined) => void; size?: number }) {
  const v = value ?? 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={{ width: size, height: size }}>
          <Star size={size} color={c.gold} fill={v >= i ? 1 : v >= i - 0.5 ? 0.5 : 0} />
          <View style={StyleSheet.absoluteFill}>
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {[i - 0.5, i].map((n) => (
                <Pressable
                  key={n}
                  accessibilityLabel={`${n} stars`}
                  style={{ flex: 1 }}
                  onPress={() => {
                    tap();
                    onChange(n === value ? undefined : n);
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      ))}
      {value ? <Text style={styles.ratingText}>{value % 1 ? value.toFixed(1) : value}</Text> : null}
    </View>
  );
}

export function routeLine(r: Pick<Route, 'miles' | 'gainFt' | 'cls'>) {
  return `${r.miles} mi round trip, ${r.gainFt.toLocaleString()} ft gain, class ${r.cls}`;
}

/** Pick the way you went. Combo routes show which summits they take in. "Other" takes your own numbers. */
export function RoutePicker({
  routes,
  value,
  onChange,
  miles,
  gain,
  onMiles,
  onGain,
  peakName,
}: {
  routes: Route[];
  value?: string;
  onChange: (id: string) => void;
  miles: string;
  gain: string;
  onMiles: (s: string) => void;
  onGain: (s: string) => void;
  peakName: (id: string) => string;
}) {
  return (
    <View style={{ gap: 8 }}>
      {routes.map((r) => {
        const on = value === r.id;
        return (
          <Pressable
            key={r.id}
            onPress={() => {
              tap();
              onChange(r.id);
            }}
            style={[styles.route, on && styles.routeOn]}>
            <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.routeName}>{r.name}</Text>
              <Text style={styles.routeMeta}>{routeLine(r)}</Text>
              {r.peaks ? <Text style={styles.routeMeta}>{r.peaks.map(peakName).join(', ')}</Text> : null}
            </View>
          </Pressable>
        );
      })}
      <Pressable
        onPress={() => {
          tap();
          onChange(OTHER_ROUTE_ID);
        }}
        style={[styles.route, value === OTHER_ROUTE_ID && styles.routeOn]}>
        <View style={[styles.radio, value === OTHER_ROUTE_ID && styles.radioOn]}>{value === OTHER_ROUTE_ID && <View style={styles.radioDot} />}</View>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={styles.routeName}>Another route</Text>
          {value === OTHER_ROUTE_ID && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput value={miles} onChangeText={onMiles} placeholder="Miles" keyboardType="decimal-pad" placeholderTextColor={c.textMuted} style={styles.small} />
              <TextInput value={gain} onChangeText={onGain} placeholder="Feet of gain" keyboardType="number-pad" placeholderTextColor={c.textMuted} style={styles.small} />
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

/** Calendar winter is Dec 21 to Mar 20. Suggested from the date, but the climber decides. */
export function WinterToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onChange(!value);
      }}
      style={[styles.winter, value && styles.winterOn]}>
      <Icon name="snow" size={18} color={value ? '#fff' : c.text} weight={2} />
      <Text style={[styles.winterText, value && { color: '#fff' }]}>Winter ascent</Text>
    </Pressable>
  );
}

/** Add photos from the camera roll. They show on your post and the peak's page. */
export function PhotoPicker({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 10, quality: 0.8 });
    if (!res.canceled) onChange([...photos, ...res.assets.map((a) => a.uri)].slice(0, 10));
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      <Pressable onPress={pick} style={styles.addPhoto}>
        <Icon name="camera" size={26} color={c.text} />
        <Text style={styles.addPhotoText}>{photos.length ? 'Add more' : 'Add photos'}</Text>
      </Pressable>
      {photos.map((uri) => (
        <Pressable key={uri} onLongPress={() => onChange(photos.filter((p) => p !== uri))}>
          <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ratingText: { color: c.textSecondary, fontFamily: Type.bodyBold, fontSize: 16, marginLeft: 8 },
  route: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: Radius.md, backgroundColor: c.backgroundElement },
  routeOn: { backgroundColor: '#E3ECE6' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.line, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  radioOn: { borderColor: c.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent },
  routeName: { color: c.text, fontFamily: Type.bodyBold, fontSize: 16 },
  routeMeta: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14 },
  small: { flex: 1, backgroundColor: c.background, color: c.text, borderRadius: Radius.sm, paddingHorizontal: 12, minHeight: 42, fontFamily: Type.body, fontSize: 15 },
  winter: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 16, minHeight: 42, borderRadius: 99, backgroundColor: c.backgroundElement },
  winterOn: { backgroundColor: '#3E6A8A' },
  winterText: { color: c.text, fontFamily: Type.bodyBold, fontSize: 15 },
  addPhoto: { width: 96, height: 96, borderRadius: Radius.md, backgroundColor: c.backgroundElement, alignItems: 'center', justifyContent: 'center', gap: 4 },
  addPhotoText: { color: c.text, fontFamily: Type.bodyMedium, fontSize: 13 },
  thumb: { width: 96, height: 96, borderRadius: Radius.md },
});
