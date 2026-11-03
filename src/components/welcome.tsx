import { router } from 'expo-router';
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
  const [email, setEmail] = useState('');
  const [home, setHome] = useState('');
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const save = () => {
    if (!name.trim() || !emailOk) return;
    success();
    setProfile({ name: name.trim(), email: email.trim().toLowerCase(), home: home.trim(), privacy: 'public' });
    router.push({ pathname: '/backfill', params: { first: '1' } });
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
          <Text style={styles.title}>Every summit, in one place.</Text>
          <Body muted>
            Log the peaks you&apos;ve climbed, rate them, and see your feet and miles add up. Read what conditions were like this week from everyone on the mountain.
          </Body>
          <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={c.textMuted} style={styles.input} autoComplete="name" />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={c.textMuted}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput value={home} onChangeText={setHome} placeholder="Where you live (optional)" placeholderTextColor={c.textMuted} style={styles.input} onSubmitEditing={save} />
          <Text style={styles.fine}>We only email you when a friend tags you on a climb.</Text>
          <Button title="Next: add your peaks" disabled={!name.trim() || !emailOk} onPress={save} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: Spacing.three },
  page: { paddingHorizontal: Spacing.three, alignSelf: 'center', gap: Spacing.three },
  title: { color: c.text, fontFamily: Type.display, fontSize: 40, lineHeight: 46, marginTop: Spacing.two },
  fine: { color: c.textSecondary, fontFamily: Type.body, fontSize: 13, marginTop: -4 },
  input: { backgroundColor: c.backgroundElement, color: c.text, paddingHorizontal: 20, paddingVertical: 15, borderRadius: 99, fontSize: 16, fontFamily: Type.body },
});
