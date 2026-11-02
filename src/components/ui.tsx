import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { tap } from '@/lib/haptics';

const c = Colors.dark;

export function Screen({
  children,
  tabs = false,
  padded = true,
  header,
}: {
  children: ReactNode;
  tabs?: boolean;
  padded?: boolean;
  /** Full-bleed content above the padded column, e.g. a backdrop. */
  header?: ReactNode;
}) {
  return (
    <SafeAreaView edges={tabs ? ['top'] : []} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: tabs ? BottomTabInset + Spacing.five : Spacing.five }}
        keyboardShouldPersistTaps="handled">
        {header}
        <View style={[styles.inner, padded && { paddingHorizontal: Spacing.three, paddingTop: Spacing.three }]}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Display type. Tracking tightens as size grows. */
export function Display({ children, size = 34, style }: { children: ReactNode; size?: number; style?: StyleProp<TextStyle> }) {
  return <Text style={[{ color: c.text, fontSize: size, lineHeight: size * 1.05, fontFamily: Type.display, letterSpacing: -size * 0.025 }, style]}>{children}</Text>;
}

export function Body({ children, muted, style, numberOfLines }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  return (
    <Text numberOfLines={numberOfLines} style={[{ color: muted ? c.textSecondary : c.text, fontSize: 16, lineHeight: 24, fontFamily: Type.body }, style]}>
      {children}
    </Text>
  );
}

/** Quiet sentence-case label. */
export function Label({ children, style, color }: { children: ReactNode; style?: StyleProp<TextStyle>; color?: string }) {
  return <Text style={[styles.label, color ? { color } : null, style]}>{children}</Text>;
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={{ color: c.link, fontSize: 13, fontFamily: Type.bodyMedium }}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = variant === 'primary' ? c.accent : variant === 'secondary' ? c.backgroundSelected : 'transparent';
  const fg = variant === 'primary' ? c.accentText : variant === 'ghost' ? c.textSecondary : c.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.35 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontSize: 16, fontFamily: Type.bodyBold }}>{title}</Text>}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.chip, { backgroundColor: active ? c.text : c.backgroundElement }]}>
      <Text style={{ color: active ? c.background : c.text, fontSize: 14, fontFamily: Type.bodyMedium }}>{label}</Text>
    </Pressable>
  );
}

/** Big-number stats row, the "Wrapped" look: the number is the hero, the label is quiet. */
export function Stats({ items }: { items: { value: string; label: string; color?: string }[] }) {
  return (
    <View style={styles.stats}>
      {items.map((it, i) => (
        <View key={it.label} style={styles.stat}>
          <Text style={[styles.statValue, it.color ? { color: it.color } : null]}>{it.value}</Text>
          <Text style={styles.statLabel}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function ProgressBar({ value, total, color = c.accent, height = 8 }: { value: number; total: number; color?: string; height?: number }) {
  const pct = total ? Math.min(1, value / total) : 0;
  return (
    <View style={{ height, backgroundColor: c.backgroundSelected, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.three },
  label: { color: c.textSecondary, fontSize: 13, fontFamily: Type.bodyMedium },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: Spacing.four },
  sectionTitle: { color: c.text, fontSize: 20, fontFamily: Type.display, letterSpacing: -0.3 },
  button: { minHeight: 52, borderRadius: Radius.sm, paddingHorizontal: Spacing.four, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: Radius.sm, padding: Spacing.three, gap: Spacing.two, backgroundColor: c.backgroundElement },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.sm },
  stats: { flexDirection: 'row', paddingVertical: Spacing.two },
  stat: { flex: 1, gap: 2 },
  statValue: { color: c.text, fontSize: 34, fontFamily: Type.display, letterSpacing: -0.8 },
  statLabel: { color: c.textSecondary, fontSize: 13, fontFamily: Type.body },
});
