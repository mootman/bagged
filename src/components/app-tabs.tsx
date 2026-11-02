import { NativeTabs } from 'expo-router/native-tabs';

import { Colors } from '@/constants/theme';

const c = Colors.dark;

export default function AppTabs() {
  return (
    <NativeTabs backgroundColor={c.background} indicatorColor={c.backgroundSelected} labelStyle={{ selected: { color: c.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Feed</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2.fill" md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="peaks">
        <NativeTabs.Trigger.Label>Peaks</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="mountain.2.fill" md="landscape" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="plans">
        <NativeTabs.Trigger.Label>Plans</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="event" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="you">
        <NativeTabs.Trigger.Label>You</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
