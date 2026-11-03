import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlanCard } from '@/components/social';
import { Icon } from '@/components/icon';
import { Chip } from '@/components/ui';
import { BottomTabInset, Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
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
          <Text style={styles.sub}>Find a seat in someone&apos;s car, or fill yours.</Text>

          <Pressable onPress={() => router.push('/plan/new')} style={styles.cta}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitle}>Plan a climb</Text>
              <Text style={styles.ctaSub}>Pick a peak and a day. Friends who want that peak come up first.</Text>
            </View>
            <Icon name="arrow" size={26} color={c.accentText} weight={2.2} />
          </Pressable>

          <View style={styles.tabs}>
            <Chip label={`Friends (${crew.length})`} active={tab === 'crew'} onPress={() => setTab('crew')} />
            <Chip label={`Open seats (${open.length})`} active={tab === 'open'} onPress={() => setTab('open')} />
            <Chip label={`Yours (${mine.length + pending.length})`} active={tab === 'mine'} onPress={() => setTab('mine')} />
          </View>

          {tab === 'open' && <Text style={styles.hint}>Public plans from climbers you don&apos;t follow yet. Ask to join and the host says yes or no.</Text>}
          {tab === 'mine' &&
            pending.map((p) => (
              <View key={p.id} style={{ gap: 6 }}>
                <Text style={styles.needs}>Not logged yet</Text>
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
  title: { color: c.text, fontFamily: Type.display, fontSize: 34 },
  sub: { color: c.textSecondary, fontFamily: Type.body, fontSize: 17, lineHeight: 24, marginTop: -8 },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.four, borderRadius: 20, backgroundColor: c.accent },
  ctaTitle: { color: c.accentText, fontFamily: Type.display, fontSize: 24 },
  ctaSub: { color: 'rgba(255,255,255,0.86)', fontFamily: Type.body, fontSize: 15, lineHeight: 21, marginTop: 4 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: Spacing.three },
  hint: { color: c.textSecondary, fontFamily: Type.body, fontSize: 15, lineHeight: 21 },
  needs: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 14 },
  empty: { color: c.textSecondary, fontFamily: Type.body, fontSize: 16, marginTop: Spacing.four },
});
