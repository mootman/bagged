import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RidgelineArt } from '@/components/ridgeline-art';
import { Body, Button } from '@/components/ui';
import { APP_NAME } from '@/constants/brand';
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
        <View style={{ height: 470 }}>
          <RidgelineArt peakId="co-longs-peak" lit width={width} height={470} count={44} top={0.2} bottom={0.9} amplitude={0.26} reveal />
          <SafeAreaView edges={['top']} style={styles.top}>
            <View style={styles.dot} />
            <Text style={styles.wordmark}>{APP_NAME.toUpperCase()}</Text>
          </SafeAreaView>
        </View>
        <View style={[styles.page, { width: w }]}>
          <Text style={styles.title}>
            Know who&apos;s going, <Text style={{ fontFamily: Type.displayItalic, color: c.accent }}>what it&apos;s like up there</Text>, and keep every summit.
          </Text>
          <View style={{ gap: 10 }}>
            <Point n="1" text="See where your friends are climbing and grab an open seat." />
            <Point n="2" text="Fresh conditions from people you trust, on every peak." />
            <Point n="3" text="Climb together, log once. Everyone's register fills in." />
          </View>
          <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={c.textMuted} style={styles.input} />
          <TextInput value={home} onChangeText={setHome} placeholder="Where you drive from (Denver, Boulder...)" placeholderTextColor={c.textMuted} style={styles.input} onSubmitEditing={save} />
          <Button title="Join your crew" disabled={!name.trim()} onPress={save} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Point({ n, text }: { n: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <Text style={{ color: c.accent, fontFamily: Type.monoBold, fontSize: 12, marginTop: 3 }}>{n}</Text>
      <Body muted style={{ flex: 1 }}>
        {text}
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: Spacing.three },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: c.accent },
  wordmark: { color: c.text, fontFamily: Type.monoBold, fontSize: 12, letterSpacing: 4 },
  page: { paddingHorizontal: Spacing.three, alignSelf: 'center', gap: Spacing.three },
  title: { color: c.text, fontFamily: Type.display, fontSize: 34, lineHeight: 39, letterSpacing: -0.5 },
  input: { backgroundColor: c.backgroundElement, color: c.text, borderRadius: 99, paddingHorizontal: 20, paddingVertical: 15, fontSize: 16, fontFamily: Type.body, borderWidth: 1, borderColor: c.border },
});
