import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/social';
import { Body, Chip, Screen } from '@/components/ui';
import { Colors, Radius, Type } from '@/constants/theme';
import { ME, useStore } from '@/lib/store';

const c = Colors.dark;

/** Feet climbed in the last 30 days. Rolling, so old climbs fall off and anyone can move up. */
export default function LeaderboardScreen() {
  const { leaderboard, displayName, user } = useStore();
  const [scope, setScope] = useState<'everyone' | 'friends'>('everyone');
  const rows = leaderboard(scope);
  const myRank = rows.findIndex((r) => r.userId === ME) + 1;
  const ahead = myRank > 1 ? rows[myRank - 2] : null;
  const mine = rows[myRank - 1];
  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Text style={styles.title}>Feet climbed, last 30 days</Text>
        <Body muted>Counts the route you logged, or the standard route. Climbs drop off after 30 days.</Body>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="Everyone in Colorado" active={scope === 'everyone'} onPress={() => setScope('everyone')} />
        <Chip label="Friends" active={scope === 'friends'} onPress={() => setScope('friends')} />
      </View>
      {ahead && mine && (
        <View style={styles.chase}>
          <Text style={styles.chaseText}>
            {(ahead.feet - mine.feet + 1).toLocaleString()} ft to pass {displayName(ahead.userId)} for #{myRank - 1}
          </Text>
        </View>
      )}
      {rows.map((r, i) => (
        <Pressable key={r.userId} onPress={() => r.userId !== ME && router.push(`/user/${r.userId}`)} style={[styles.row, r.userId === ME && styles.me]}>
          <Text style={[styles.rank, i < 3 && { color: c.gold }]}>{i + 1}</Text>
          <Avatar user={user(r.userId)} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{displayName(r.userId)}</Text>
            <Text style={styles.meta}>
              {r.ascents} {r.ascents === 1 ? 'summit' : 'summits'}
            </Text>
          </View>
          <Text style={styles.feet}>{r.feet.toLocaleString()} ft</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: c.text, fontFamily: Type.display, fontSize: 30, lineHeight: 36 },
  chase: { padding: 14, borderRadius: Radius.md, backgroundColor: '#F3EBDD' },
  chaseText: { color: '#7A5410', fontFamily: Type.bodyBold, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 14 },
  me: { backgroundColor: '#E8EFEA' },
  rank: { width: 22, textAlign: 'center', color: c.textSecondary, fontFamily: Type.display, fontSize: 18 },
  name: { color: c.text, fontFamily: Type.bodyBold, fontSize: 16 },
  meta: { color: c.textSecondary, fontFamily: Type.body, fontSize: 13 },
  feet: { color: c.text, fontFamily: Type.display, fontSize: 18 },
});
