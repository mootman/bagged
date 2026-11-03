import { router } from 'expo-router';
import { Fragment } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Mark } from '@/components/mark';
import { PeakImage } from '@/components/peak-photo';
import { AscentCard, Avatar, PlanCard } from '@/components/social';
import { Welcome } from '@/components/welcome';
import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { success } from '@/lib/haptics';
import { daysSince, ME, useStore } from '@/lib/store';

const c = Colors.dark;

function whenWas(date: string) {
  const d = daysSince(date);
  return d === 1 ? 'yesterday' : d === 0 ? 'today' : `${d} days ago`;
}

export default function FeedScreen() {
  const { width } = useWindowDimensions();
  const store = useStore();
  const { me, feed, upcomingPlans, toLog, peakById, user, suggestions, follow, ascents, following } = store;
  if (!me.name) return <Welcome />;

  const items = feed().filter((i) => i.kind === 'ascent');
  const { mine, crew, open } = upcomingPlans();
  const soon = [...mine, ...crew, ...open].filter((p) => daysSince(p.date) >= -14).slice(0, 6);
  const pending = toLog();
  const fresh = ascents.filter((a) => a.beta?.surface && daysSince(a.date) <= 7 && (a.userId === ME || following.includes(a.userId))).length;
  const people = suggestions();
  const cardW = Math.min(width, MaxContentWidth) - Spacing.three * 2;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.six }}>
        <View style={styles.header}>
          <Mark />
          <Pressable onPress={() => router.push('/peaks')} style={styles.signBtn} accessibilityLabel="Log a summit" hitSlop={6}>
            <Icon name="plus" size={20} color={c.accentText} weight={2.2} />
            <Text style={styles.signText}>Log a summit</Text>
          </Pressable>
        </View>

        {/* You climbed with friends and nobody has logged it. One tap logs it for all of you. */}
        {pending.map((p) => {
          const peak = peakById.get(p.peakId);
          const others = p.memberIds.filter((m) => m !== ME).map((m) => user(m)?.name.split(' ')[0]);
          return (
            <Pressable key={p.id} onPress={() => router.push(`/plan/${p.id}`)} style={styles.prompt}>
              <PeakImage peakId={p.peakId} width={cardW} height={300} />
              <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />
              <View style={styles.promptText}>
                <Text style={styles.promptKicker}>{whenWas(p.date)[0].toUpperCase() + whenWas(p.date).slice(1)} with {others.join(' and ')}</Text>
                <Text style={styles.promptTitle}>How was {peak?.name}?</Text>
                <Text style={styles.promptBody}>Log it once for everyone, and tell the next crew what the snow was like.</Text>
                <View style={styles.promptBtn}>
                  <Text style={styles.promptBtnText}>We made it up</Text>
                  <Icon name="arrow" size={18} color={c.text} weight={2.2} />
                </View>
              </View>
            </Pressable>
          );
        })}

        <View style={styles.page}>
          <View style={styles.sectionRow}>
            <Text style={styles.section}>Going soon</Text>
            <Pressable onPress={() => router.push('/plans')} hitSlop={10}>
              <Text style={styles.link}>All plans</Text>
            </Pressable>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: Spacing.two }}>
          {soon.map((p) => (
            <View key={p.id} style={{ width: 300 }}>
              <PlanCard plan={p} compact width={300} />
            </View>
          ))}
          <Pressable onPress={() => router.push('/plan/new')} style={styles.newPlan}>
            <Icon name="plus" size={26} color={c.text} />
            <Text style={styles.newPlanText}>Start a plan</Text>
          </Pressable>
        </ScrollView>

        <View style={[styles.page, { marginTop: Spacing.five, marginBottom: Spacing.two }]}>
          <Text style={styles.section}>Your crew</Text>
          {fresh > 0 && <Text style={styles.freshLine}>{fresh} people reported conditions this week</Text>}
        </View>

        <View style={styles.feed}>
          {items.map((item, i) =>
            item.kind === 'ascent' ? (
              <Fragment key={item.ascent.id}>
                <AscentCard ascent={item.ascent} climbers={item.climbers} />
                {i === 2 && people.length > 0 && (
                  <View style={styles.suggest}>
                    <Text style={[styles.section, { paddingHorizontal: Spacing.three, fontSize: 20 }]}>People who climb near you</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: Spacing.two }}>
                      {people.map((u) => (
                        <Pressable key={u.id} onPress={() => router.push(`/user/${u.id}`)} style={styles.person}>
                          <Avatar user={u} size={52} />
                          <Text style={styles.personName} numberOfLines={1}>
                            {u.name}
                          </Text>
                          <Text style={styles.personMeta}>
                            {store.summitedBy(u.id).size} fourteeners, {u.home}
                          </Text>
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
  signBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.accent, paddingHorizontal: 16, minHeight: 40, borderRadius: 99 },
  signText: { color: c.accentText, fontFamily: Type.bodyBold, fontSize: 15 },
  page: { paddingHorizontal: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: Spacing.four, marginBottom: Spacing.two },
  section: { color: c.text, fontFamily: Type.display, fontSize: 26 },
  link: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 15 },
  freshLine: { color: c.success, fontFamily: Type.bodyBold, fontSize: 14, marginTop: 4 },
  prompt: { marginHorizontal: Spacing.three, marginTop: Spacing.two, borderRadius: Radius.lg, overflow: 'hidden', alignSelf: 'center' },
  promptText: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: Spacing.four, gap: 6 },
  promptKicker: { color: 'rgba(255,255,255,0.9)', fontFamily: Type.bodyBold, fontSize: 15 },
  promptTitle: { color: '#fff', fontFamily: Type.display, fontSize: 30, lineHeight: 34 },
  promptBody: { color: 'rgba(255,255,255,0.88)', fontFamily: Type.body, fontSize: 16, lineHeight: 22 },
  promptBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 18, minHeight: 44, borderRadius: 99, marginTop: 8 },
  promptBtnText: { color: c.text, fontFamily: Type.bodyBold, fontSize: 16 },
  newPlan: { width: 130, borderRadius: Radius.md, backgroundColor: c.backgroundElement, alignItems: 'center', justifyContent: 'center', gap: 6 },
  newPlanText: { color: c.text, fontFamily: Type.bodyBold, fontSize: 14 },
  feed: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  suggest: { gap: Spacing.three, paddingVertical: Spacing.four, marginBottom: Spacing.four, backgroundColor: c.backgroundElement },
  person: { width: 156, padding: 14, borderRadius: Radius.md, backgroundColor: c.background, alignItems: 'flex-start', gap: 6 },
  personName: { color: c.text, fontFamily: Type.bodyBold, fontSize: 15, marginTop: 4 },
  personMeta: { color: c.textSecondary, fontFamily: Type.body, fontSize: 13 },
  followSmall: { marginTop: 6, backgroundColor: c.accent, paddingHorizontal: 18, minHeight: 36, borderRadius: 99, justifyContent: 'center' },
  followSmallText: { color: c.accentText, fontFamily: Type.bodyBold, fontSize: 14 },
});
