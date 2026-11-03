import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { Avatar } from '@/components/social';
import { Body, Screen } from '@/components/ui';
import { Colors, Type } from '@/constants/theme';
import { ago, useStore } from '@/lib/store';
import type { Notif } from '@/lib/types';

const c = Colors.dark;

/** Everything that happened around your climbs and the peaks you care about. */
export default function ActivityScreen() {
  const { activity, notesSeenAt, markSeen, displayName, user, peakById } = useStore();
  // Keep the "new" marks on screen for this visit, clear them for the next.
  const [seenAt] = useState(notesSeenAt);
  useEffect(() => {
    markSeen();
  }, [markSeen]);
  const list = activity();

  const line = (n: Notif): { text: string; icon: IconName; color: string } => {
    const who = n.userId ? displayName(n.userId) : 'Someone';
    const peak = n.peakId ? peakById.get(n.peakId)?.name : '';
    switch (n.kind) {
      case 'kudos':
        return { text: `${who} gave your ${peak} climb a summit`, icon: 'summit', color: c.accent };
      case 'comment':
        return { text: `${who} commented on ${peak}: "${n.text}"`, icon: 'comment', color: c.text };
      case 'follow':
        return { text: `${who} started following you`, icon: 'person', color: c.text };
      case 'answer':
        return { text: `${who} answered your question about ${peak}: "${n.text}"`, icon: 'comment', color: c.accent };
      case 'question':
        return { text: `${who} asked about ${peak}, which you've climbed: "${n.text}"`, icon: 'comment', color: c.gold };
      case 'want-climbed':
        return { text: `${who} just climbed ${peak}, on your want list`, icon: 'bookmark', color: c.text };
      case 'conditions':
        return { text: `New conditions on ${peak}, on your want list, from ${who}`, icon: 'snow', color: '#3E6A8A' };
      case 'badge':
        return { text: `You earned a badge: ${n.text}`, icon: 'crown', color: c.gold };
      case 'legend':
        return { text: n.text ?? `Local Legend update on ${peak}`, icon: 'crown', color: c.gold };
    }
  };

  const open = (n: Notif) => {
    if (n.ascentId) router.push(`/ascent/${n.ascentId}`);
    else if (n.peakId) router.push(`/peak/${n.peakId}`);
    else if (n.kind === 'badge') router.push('/badges');
    else if (n.userId) router.push(`/user/${n.userId}`);
  };

  return (
    <Screen>
      {list.length === 0 && <Body muted>Nothing yet. Log a climb or add peaks to your want list, and this fills up.</Body>}
      {list.map((n) => {
        const l = line(n);
        const fresh = n.at > seenAt;
        return (
          <Pressable key={n.id} onPress={() => open(n)} style={[styles.row, fresh && styles.fresh]}>
            {n.userId ? <Avatar user={user(n.userId)} size={40} /> : <View style={styles.iconDot}><Icon name={l.icon} size={20} color="#fff" filled /></View>}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.text}>{l.text}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={l.icon} size={14} color={l.color} filled={l.icon === 'summit' || l.icon === 'crown'} weight={2} />
                <Text style={styles.ago}>{ago(n.at)}</Text>
              </View>
            </View>
            {fresh && <View style={styles.dot} />}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14 },
  fresh: { backgroundColor: '#E8EFEA' },
  iconDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.gold, alignItems: 'center', justifyContent: 'center' },
  text: { color: c.text, fontFamily: Type.body, fontSize: 15, lineHeight: 21 },
  ago: { color: c.textSecondary, fontFamily: Type.body, fontSize: 13 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: c.accent },
});
