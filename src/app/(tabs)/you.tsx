import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Passport } from '@/components/passport';
import { Welcome } from '@/components/welcome';
import { Colors, Type } from '@/constants/theme';
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
              <Text style={styles.demoText}>The friends, plans and conditions here are a sample crew until accounts go live.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scan: { backgroundColor: c.text, paddingHorizontal: 14, minHeight: 38, justifyContent: 'center' },
  scanText: { color: c.background, fontFamily: Type.bodyBold, fontSize: 14, marginTop: 2 },
  demo: { backgroundColor: c.backgroundElement, padding: 14, marginTop: 8 },
  demoText: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14, lineHeight: 20 },
});
