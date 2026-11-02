import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View, type PressableProps, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <TabBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton>Feed</TabButton>
          </TabTrigger>
          <TabTrigger name="peaks" href="/peaks" asChild>
            <TabButton>Peaks</TabButton>
          </TabTrigger>
          <TabTrigger name="plans" href="/plans" asChild>
            <TabButton>Plans</TabButton>
          </TabTrigger>
          <TabTrigger name="you" href="/you" asChild>
            <TabButton>You</TabButton>
          </TabTrigger>
        </TabBar>
      </TabList>
    </Tabs>
  );
}

function TabBar({ children, style, ...props }: ViewProps) {
  const t = useTheme();
  return (
    <View {...props} style={[styles.bar, { backgroundColor: t.background, borderTopColor: t.border }, style]}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const t = useTheme();
  return (
    <Pressable {...(props as PressableProps)} style={styles.button}>
      <ThemedText type="smallBold" style={{ color: isFocused ? t.accent : t.textSecondary }}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: Spacing.two },
  inner: { flexDirection: 'row', justifyContent: 'space-around', maxWidth: MaxContentWidth, width: '100%', alignSelf: 'center' },
  button: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
});
