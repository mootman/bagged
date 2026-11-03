import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { Mark } from '@/components/mark';
import { AscentCard, Avatar } from '@/components/social';
import { Chip } from '@/components/ui';
import { Welcome } from '@/components/welcome';
import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { success } from '@/lib/haptics';
import { daysSince, useStore } from '@/lib/store';
import type { User } from '@/lib/types';

const c = Colors.dark;

export default function FeedScreen() {
  const store = useStore();
  const { me, feed, suggestions, follow, ascents, following, logs } = store;
  const [scope, setScope] = useState<'everyone' | 'friends'>('everyone');
  if (!me.name) return <Welcome />;

  const items = feed(scope).filter((i) => i.kind === 'ascent');
  const fresh = ascents.filter((a) => a.beta?.surface && daysSince(a.date) <= 7).length;
  const people = suggestions().slice(0, 8);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.six }}>
        <View style={styles.header}>
          <Mark />
          <Pressable onPress={() => router.push('/peaks')} style={styles.signBtn} accessibilityLabel="Log a climb" hitSlop={6}>
            <Icon name="plus" size={20} color={c.accentText} weight={2.2} />
            <Text style={styles.signText}>Log a climb</Text>
          </Pressable>
        </View>

        {!me.onboarded && logs.length === 0 && (
          <Pressable onPress={() => router.push('/backfill')} style={styles.backfill}>
            <Text style={styles.backfillTitle}>Add the peaks you&apos;ve already climbed</Text>
            <Text style={styles.backfillBody}>Tick them off in a minute. Your map, stats and feet climbed fill in right away.</Text>
          </Pressable>
        )}

        <View style={[styles.page, { gap: 10, marginTop: Spacing.two, marginBottom: Spacing.three }]}>
          <View style={styles.scopeRow}>
            <Chip label="Everyone" active={scope === 'everyone'} onPress={() => setScope('everyone')} />
            <Chip label={following.length ? `Friends (${following.length})` : 'Friends'} active={scope === 'friends'} onPress={() => setScope('friends')} />
          </View>
          {scope === 'everyone' && fresh > 0 && <Text style={styles.freshLine}>{fresh} conditions reports this week</Text>}
        </View>

        {scope === 'friends' && following.length === 0 && (
          <View style={[styles.page, { gap: 8, marginBottom: Spacing.three }]}>
            <Text style={styles.section}>No friends yet</Text>
            <Text style={styles.emptyBody}>Follow people below or from the Everyone feed. Their climbs show up here, and you can tag each other on climbs you do together.</Text>
          </View>
        )}

        <View style={styles.feed}>
          {items.map((item, i) =>
            item.kind === 'ascent' ? (
              <Fragment key={item.ascent.id}>
                <AscentCard ascent={item.ascent} climbers={item.climbers} />
                {i === 1 && people.length > 0 && <People people={people} follow={follow} />}
              </Fragment>
            ) : null,
          )}
          {items.length === 0 && people.length > 0 && <People people={people} follow={follow} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function People({ people, follow }: { people: User[]; follow: (id: string) => void }) {
  const { displayName, summitedBy } = useStore();
  return (
    <View style={styles.suggest}>
      <Text style={[styles.section, { paddingHorizontal: Spacing.three, fontSize: 22 }]}>Climbers to follow</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: Spacing.two }}>
        {people.map((u) => (
          <Pressable key={u.id} onPress={() => router.push(`/user/${u.id}`)} style={styles.person}>
            <Avatar user={u} size={52} />
            <Text style={styles.personName} numberOfLines={1}>
              {displayName(u.id)}
            </Text>
            <Text style={styles.personMeta}>{summitedBy(u.id).size} fourteeners</Text>
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
  scopeRow: { flexDirection: 'row', gap: 8 },
  emptyBody: { color: c.textSecondary, fontFamily: Type.body, fontSize: 16, lineHeight: 23 },
  backfill: { marginHorizontal: Spacing.three, marginTop: Spacing.two, padding: Spacing.four, borderRadius: Radius.lg, backgroundColor: c.accent, gap: 6 },
  backfillTitle: { color: '#fff', fontFamily: Type.display, fontSize: 24, lineHeight: 29 },
  backfillBody: { color: 'rgba(255,255,255,0.88)', fontFamily: Type.body, fontSize: 16, lineHeight: 22 },
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
