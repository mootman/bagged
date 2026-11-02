import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const t = useTheme();
  return (
    <NativeTabs
      backgroundColor={t.background}
      indicatorColor={t.backgroundSelected}
      labelStyle={{ selected: { color: t.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Passport</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="mountain.2.fill" md="landscape" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scan">
        <NativeTabs.Trigger.Label>Find summits</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="photo.stack" md="photo_library" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="peaks">
        <NativeTabs.Trigger.Label>Peaks</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" md="list" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
