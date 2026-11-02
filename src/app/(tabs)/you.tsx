import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Passport } from '@/components/passport';
import { Welcome } from '@/components/welcome';
import { Colors, Radius, Type } from '@/constants/theme';
import { ME, useStore } from '@/lib/store';

const c = Colors.dark;

export default function YouScreen() {
  const { me, demo } = useStore();
  if (!me.name) return <Welcome />;
  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: c.background }}>
      <Passport
        userId={ME}
        topRight={
          <Pressable onPress={() => router.push('/scan')} style={styles.scan}>
            <Text style={styles.scanText}>Find old summits</Text>
          </Pressable>
        }
        footer={
          demo ? (
            <View style={styles.demo}>
              <Text style={styles.demoText}>DEMO CREW · Friends, plans and beta here are sample data until accounts go live.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scan: { backgroundColor: 'rgba(10,15,19,0.7)', borderWidth: 1, borderColor: c.border, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  scanText: { color: c.text, fontFamily: Type.bodyMedium, fontSize: 13 },
  demo: { borderWidth: 1, borderColor: c.border, borderRadius: Radius.sm, padding: 12, marginTop: 8 },
  demoText: { color: c.textMuted, fontFamily: Type.mono, fontSize: 10, lineHeight: 15 },
});
