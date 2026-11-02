import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Platform, useWindowDimensions, View, type HostInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { SummitCard } from '@/components/summit-card';
import { Body, Button, Screen } from '@/components/ui';
import { success } from '@/lib/haptics';
import { useStore } from '@/lib/store';

export default function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { logs, peakById, peaks, summitedIds, profile } = useStore();
  const { width, height } = useWindowDimensions();
  const ref = useRef<HostInstance>(null);
  const [busy, setBusy] = useState(false);

  const log = logs.find((l) => l.id === id);
  const peak = log && peakById.get(log.peakId);
  if (!log || !peak) return <Screen><Body>Summit not found.</Body></Screen>;

  const cardWidth = Math.min(width - 32, ((height - 230) * 9) / 16, 400);
  const listCount = peaks.filter((p) => summitedIds.has(p.id)).length;

  async function share() {
    if (Platform.OS === 'web') {
      Alert.alert('Use the phone app', 'Card sharing works in the iOS and Android app.');
      return;
    }
    setBusy(true);
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: 1920 });
      success();
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `${peak?.name} summit card` });
    } catch (e) {
      Alert.alert('Could not share', String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <View style={{ alignItems: 'center' }}>
        <SummitCard ref={ref} peak={peak} log={log} listCount={listCount} listTotal={peaks.length} name={profile.name} width={cardWidth} />
      </View>
      <Button title="Share to your story" loading={busy} onPress={share} />
    </Screen>
  );
}
