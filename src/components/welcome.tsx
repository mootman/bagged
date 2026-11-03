import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { PeakImage } from '@/components/peak-photo';
import { Mark } from '@/components/mark';
import { Body, Button } from '@/components/ui';
import { BottomTabInset, Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { success } from '@/lib/haptics';
import { useStore } from '@/lib/store';

const c = Colors.dark;

export function Welcome() {
  const { width } = useWindowDimensions();
  const { setProfile } = useStore();
  const [name, setName] = useState('');
  const [home, setHome] = useState('');
  const save = () => {
    if (!name.trim()) return;
    success();
    setProfile({ name: name.trim(), home: home.trim() });
  };
  const w = Math.min(width, MaxContentWidth);

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.five }} keyboardShouldPersistTaps="handled">
        <View style={{ height: 520 }}>
          <PeakImage peakId="co-maroon-peak" width={width} height={520} credit />
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <SafeAreaView edges={['top']} style={styles.top}>
            <Mark color="#fff" size={22} />
          </SafeAreaView>
        </View>
        <View style={[styles.page, { width: w }]}>
          <Text style={styles.title}>Climb with your people.</Text>
          <Body muted>
            See who&apos;s heading up this weekend, read what the snow was like yesterday, and log the climb once for everyone in the car.
          </Body>
          <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={c.textMuted} style={styles.input} />
          <TextInput value={home} onChangeText={setHome} placeholder="Where you drive from (Denver, Boulder...)" placeholderTextColor={c.textMuted} style={styles.input} onSubmitEditing={save} />
          <Button title="Join your crew" disabled={!name.trim()} onPress={save} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: Spacing.three },
  page: { paddingHorizontal: Spacing.three, alignSelf: 'center', gap: Spacing.three },
  title: { color: c.text, fontFamily: Type.display, fontSize: 40, lineHeight: 46, marginTop: Spacing.two },
  input: { backgroundColor: c.backgroundElement, color: c.text, paddingHorizontal: 20, paddingVertical: 15, borderRadius: 99, fontSize: 16, fontFamily: Type.body },
});
