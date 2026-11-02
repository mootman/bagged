import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlanCard } from '@/components/social';
import { Chip } from '@/components/ui';
import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { useStore } from '@/lib/store';

const c = Colors.dark;
type Tab = 'crew' | 'open' | 'mine';

/** Who's going where, and where there's room for you. */
export default function PlansScreen() {
  const { upcomingPlans, toLog } = useStore();
  const { mine, crew, open } = upcomingPlans();
  const [tab, setTab] = useState<Tab>(crew.length ? 'crew' : 'open');
  const list = tab === 'crew' ? crew : tab === 'open' ? open : mine;
  const pending = toLog();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.six }}>
        <View style={styles.page}>
          <Text style={styles.title}>Plans</Text>
          <Text style={styles.sub}>Find a seat, or fill yours. Nobody should have to climb a 14er alone.</Text>

          <Pressable onPress={() => router.push('/plan/new')} style={styles.cta}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitle}>Plan a climb</Text>
              <Text style={styles.ctaSub}>Pick a peak and a day. We&apos;ll suggest friends who want it too.</Text>
            </View>
            <Text style={styles.ctaArrow}>→</Text>
          </Pressable>

          <View style={styles.tabs}>
            <Chip label={`Your crew ${crew.length}`} active={tab === 'crew'} onPress={() => setTab('crew')} />
            <Chip label={`Open seats ${open.length}`} active={tab === 'open'} onPress={() => setTab('open')} />
            <Chip label={`Yours ${mine.length + pending.length}`} active={tab === 'mine'} onPress={() => setTab('mine')} />
          </View>

          {tab === 'open' && <Text style={styles.hint}>Public plans from climbers you don&apos;t follow yet. Ask to join and the host says yes or no.</Text>}
          {tab === 'mine' &&
            pending.map((p) => (
              <View key={p.id} style={{ gap: 6 }}>
                <Text style={styles.needs}>NEEDS LOGGING</Text>
                <PlanCard plan={p} />
              </View>
            ))}
          {list.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
          {list.length === 0 && (tab !== 'mine' || pending.length === 0) && (
            <Text style={styles.empty}>
              {tab === 'mine' ? 'Nothing on the calendar. Start one, or ask to join a crew plan.' : tab === 'crew' ? 'No crew plans yet. Be the one who starts it.' : 'No open seats right now.'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: Spacing.three, gap: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingTop: Spacing.three },
  title: { color: c.text, fontFamily: Type.display, fontSize: 40 },
  sub: { color: c.textSecondary, fontFamily: Type.body, fontSize: 15, lineHeight: 21, marginTop: -8 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.three, borderRadius: Radius.md, backgroundColor: c.accent },
  ctaTitle: { color: c.accentText, fontFamily: Type.display, fontSize: 22 },
  ctaSub: { color: 'rgba(20,11,7,0.75)', fontFamily: Type.body, fontSize: 13, marginTop: 2 },
  ctaArrow: { color: c.accentText, fontSize: 26 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.two },
  hint: { color: c.textMuted, fontFamily: Type.body, fontSize: 13 },
  needs: { color: c.accent, fontFamily: Type.monoBold, fontSize: 10, letterSpacing: 1.2 },
  empty: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14, textAlign: 'center', marginTop: Spacing.four },
});
