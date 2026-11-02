import { router } from 'expo-router';
import { Fragment } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AscentCard, Avatar, PlanCard } from '@/components/social';
import { Welcome } from '@/components/welcome';
import { APP_NAME } from '@/constants/brand';
import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { success } from '@/lib/haptics';
import { daysSince, formatPlanDate, ME, useStore } from '@/lib/store';

const c = Colors.dark;

export default function FeedScreen() {
  const store = useStore();
  const { me, feed, upcomingPlans, toLog, peakById, user, suggestions, follow, ascents, following } = store;
  if (!me.name) return <Welcome />;

  const items = feed().filter((i) => i.kind === 'ascent');
  const { mine, crew, open } = upcomingPlans();
  const weekend = [...mine, ...crew, ...open].filter((p) => daysSince(p.date) >= -14).slice(0, 6);
  const pending = toLog();
  const freshReports = ascents.filter((a) => a.beta?.surface && daysSince(a.date) <= 7 && (a.userId === ME || following.includes(a.userId))).length;
  const people = suggestions();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.six }}>
        <View style={styles.header}>
          <View style={styles.wordmarkRow}>
            <View style={styles.dot} />
            <Text style={styles.wordmark}>{APP_NAME.toUpperCase()}</Text>
          </View>
          <Pressable onPress={() => router.push('/peaks')} style={styles.signBtn} accessibilityLabel="Sign a summit">
            <Text style={styles.signText}>+ Summit</Text>
          </Pressable>
        </View>

        {/* The plan-to-log loop: you climbed with friends, one tap logs it for everyone. */}
        {pending.map((p) => {
          const peak = peakById.get(p.peakId);
          const others = p.memberIds.filter((m) => m !== ME).map((m) => user(m)?.name.split(' ')[0]);
          return (
            <Pressable key={p.id} onPress={() => router.push(`/plan/${p.id}`)} style={styles.prompt}>
              <Text style={styles.promptKicker}>{formatPlanDate(p.date).toUpperCase()} · {peak?.name.toUpperCase()}</Text>
              <Text style={styles.promptTitle}>How did it go up there?</Text>
              <Text style={styles.promptBody}>Log it once for you, {others.join(' and ')}. Add the conditions so the next crew knows.</Text>
              <View style={styles.promptBtn}>
                <Text style={styles.promptBtnText}>We summited</Text>
              </View>
            </Pressable>
          );
        })}

        <View style={styles.page}>
          <View style={styles.sectionRow}>
            <Text style={styles.section}>Going soon</Text>
            <Pressable onPress={() => router.push('/plans')} hitSlop={8}>
              <Text style={styles.link}>All plans</Text>
            </Pressable>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: Spacing.two }}>
          {weekend.map((p) => (
            <View key={p.id} style={{ width: 318 }}>
              <PlanCard plan={p} compact />
            </View>
          ))}
          <Pressable onPress={() => router.push('/plan/new')} style={styles.newPlan}>
            <Text style={styles.newPlanPlus}>+</Text>
            <Text style={styles.newPlanText}>Plan a climb</Text>
          </Pressable>
        </ScrollView>

        <View style={[styles.page, { marginTop: Spacing.four }]}>
          <Text style={[styles.section, { marginTop: Spacing.three }]}>From your crew</Text>
          {freshReports > 0 && <Text style={[styles.pulse, { marginTop: 4, marginBottom: Spacing.two }]}>● {freshReports} FRESH CONDITIONS REPORTS THIS WEEK</Text>}
        </View>

        <View style={styles.feed}>
          {items.map((item, i) =>
            item.kind === 'ascent' ? (
              <Fragment key={item.ascent.id}>
                <AscentCard ascent={item.ascent} climbers={item.climbers} />
                {i === 2 && people.length > 0 && (
                  <View style={styles.suggest}>
                    <Text style={[styles.section, { paddingHorizontal: Spacing.three }]}>People climbing near you</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: Spacing.two }}>
                      {people.map((u) => (
                        <Pressable key={u.id} onPress={() => router.push(`/user/${u.id}`)} style={styles.person}>
                          <Avatar user={u} size={52} />
                          <Text style={styles.personName} numberOfLines={1}>
                            {u.name}
                          </Text>
                          <Text style={styles.personMeta}>{store.summitedBy(u.id).size} 14ERS · {u.home.toUpperCase()}</Text>
                          <Pressable
                            onPress={() => {
                              success();
                              follow(u.id);
                            }}
                            style={styles.followSmall}>
                            <Text style={styles.followSmallText}>Follow</Text>
                          </Pressable>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </Fragment>
            ) : null,
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: c.accent },
  wordmark: { color: c.text, fontFamily: Type.monoBold, fontSize: 12, letterSpacing: 4 },
  signBtn: { backgroundColor: c.accent, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  signText: { color: c.accentText, fontFamily: Type.bodyBold, fontSize: 14 },
  page: { paddingHorizontal: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: Spacing.three, marginBottom: Spacing.two },
  section: { color: c.text, fontFamily: Type.display, fontSize: 22 },
  link: { color: c.link, fontFamily: Type.bodyMedium, fontSize: 13 },
  pulse: { color: c.success, fontFamily: Type.mono, fontSize: 10 },
  prompt: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    backgroundColor: '#1E1418',
    borderWidth: 1,
    borderColor: 'rgba(255,122,69,0.45)',
    gap: 6,
  },
  promptKicker: { color: c.accent, fontFamily: Type.monoBold, fontSize: 10, letterSpacing: 1.2 },
  promptTitle: { color: c.text, fontFamily: Type.display, fontSize: 24 },
  promptBody: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14, lineHeight: 20 },
  promptBtn: { alignSelf: 'flex-start', backgroundColor: c.accent, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 9, marginTop: 6 },
  promptBtnText: { color: c.accentText, fontFamily: Type.bodyBold, fontSize: 14 },
  newPlan: { width: 120, borderRadius: Radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, alignItems: 'center', justifyContent: 'center', gap: 4 },
  newPlanPlus: { color: c.accent, fontFamily: Type.display, fontSize: 30 },
  newPlanText: { color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 13 },
  feed: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  suggest: { gap: Spacing.two, paddingVertical: Spacing.three, marginBottom: Spacing.two, borderBottomWidth: 1, borderBottomColor: c.border },
  person: { width: 150, padding: 14, borderRadius: Radius.md, backgroundColor: c.backgroundElement, borderWidth: 1, borderColor: c.border, alignItems: 'center', gap: 6 },
  personName: { color: c.text, fontFamily: Type.bodyBold, fontSize: 14 },
  personMeta: { color: c.textMuted, fontFamily: Type.mono, fontSize: 9.5 },
  followSmall: { marginTop: 4, backgroundColor: c.accent, borderRadius: 99, paddingHorizontal: 18, paddingVertical: 6 },
  followSmallText: { color: c.accentText, fontFamily: Type.bodyBold, fontSize: 13 },
});
