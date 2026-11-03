import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Icon } from '@/components/icon';
import { Avatar } from '@/components/social';
import { Colors, Radius, Type } from '@/constants/theme';
import type { Badge, BadgeTone } from '@/lib/badges';
import { success } from '@/lib/haptics';
import { ago, ME, useStore } from '@/lib/store';
import type { Question } from '@/lib/types';

const c = Colors.dark;

export const TONE: Record<BadgeTone, string> = { green: '#2F6B4A', blue: '#3E6A8A', gold: '#A86A12', rust: '#A5492E', slate: '#4E5A63' };

/** A round medal. Earned: solid colour. Not yet: grey, with a ring showing how close you are. */
export function BadgeMedal({ badge, size = 64 }: { badge: Badge; size?: number }) {
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const pct = badge.need ? badge.have / badge.need : 0;
  const tone = TONE[badge.tone];
  const fontSize = badge.mark.length > 2 ? size * 0.24 : size * 0.32;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} fill={badge.done ? tone : c.backgroundElement} />
        {!badge.done && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tone}
            strokeWidth={4}
            strokeDasharray={`${circ * pct} ${circ}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
        {badge.done && <Circle cx={size / 2} cy={size / 2} r={r - 5} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />}
      </Svg>
      <Text style={{ color: badge.done ? '#fff' : c.textMuted, fontFamily: Type.display, fontSize }}>{badge.mark}</Text>
    </View>
  );
}

/** Earned badges first, then the ones you're closest to. */
export function BadgeGrid({ badges, limit }: { badges: Badge[]; limit?: number }) {
  const sorted = [...badges].sort((a, b) => Number(b.done) - Number(a.done) || b.have / b.need - a.have / a.need);
  const shown = limit ? sorted.slice(0, limit) : sorted;
  return (
    <View style={styles.grid}>
      {shown.map((b) => (
        <View key={b.id} style={styles.cell}>
          <BadgeMedal badge={b} />
          <Text style={styles.badgeName} numberOfLines={2}>
            {b.name}
          </Text>
          <Text style={styles.badgeProgress}>{b.done ? 'Earned' : b.need > 999 ? `${Math.round((b.have / b.need) * 100)}%` : `${b.have} of ${b.need}`}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Local Legend, Strava's idea for repeat efforts: most ascents of this peak in the last 12 months.
 * Anyone can win it by going back, not by being fastest.
 */
export function LegendCard({ peakId }: { peakId: string }) {
  const { legend, displayName, user } = useStore();
  const { board, mine } = legend(peakId);
  const top = board[0];
  const iAmLegend = top?.userId === ME;
  const need = top ? (iAmLegend ? 0 : top.count - mine + 1) : 1;
  return (
    <View style={styles.legend}>
      <View style={styles.legendHead}>
        <View style={styles.crown}>
          <Icon name="crown" size={20} filled color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.legendKicker}>Local Legend, last 12 months</Text>
          {top ? (
            <Text style={styles.legendName}>
              {iAmLegend ? 'You' : displayName(top.userId)}, {top.count} {top.count === 1 ? 'ascent' : 'ascents'}
            </Text>
          ) : (
            <Text style={styles.legendName}>Nobody yet</Text>
          )}
        </View>
        {top && top.userId !== ME ? <Avatar user={user(top.userId)} size={40} /> : null}
      </View>
      <Text style={styles.legendBody}>
        {iAmLegend
          ? 'The title is yours. Someone has to climb it more often than you to take it.'
          : top
            ? `You have ${mine}. Climb it ${need} more ${need === 1 ? 'time' : 'times'} to take the title.`
            : 'Log a climb here this year and the title is yours.'}
      </Text>
      {board.length > 1 && (
        <View style={{ gap: 6 }}>
          {board.slice(0, 5).map((r, i) => (
            <View key={r.userId} style={styles.rankRow}>
              <Text style={styles.rank}>{i + 1}</Text>
              <Avatar user={user(r.userId)} size={24} />
              <Text style={[styles.rankName, r.userId === ME && { color: c.accent }]}>{displayName(r.userId)}</Text>
              <Text style={styles.rankCount}>{r.count}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/** One question and its answers, with a box to answer it. */
export function QuestionThread({ q, compact }: { q: Question; compact?: boolean }) {
  const { user, displayName, answer, peakById } = useStore();
  const [draft, setDraft] = useState('');
  const shown = compact ? q.answers.slice(0, 1) : q.answers;
  return (
    <View style={styles.q}>
      <View style={styles.qHead}>
        <Avatar user={user(q.userId)} size={30} />
        <View style={{ flex: 1 }}>
          <Text style={styles.qWho}>
            {displayName(q.userId)}
            <Text style={styles.qMeta}>
              {' '}
              asked{compact ? ` about ${peakById.get(q.peakId)?.name}` : ''}, {ago(q.at)}
            </Text>
          </Text>
        </View>
      </View>
      <Text style={styles.qText}>{q.text}</Text>
      {shown.map((a) => (
        <View key={a.id} style={styles.answer}>
          <Avatar user={user(a.userId)} size={24} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.aWho}>{displayName(a.userId)}</Text>
            <Text style={styles.aText}>{a.text}</Text>
          </View>
        </View>
      ))}
      {compact ? (
        <Pressable onPress={() => router.push(`/peak/${q.peakId}`)} hitSlop={6}>
          <Text style={styles.link}>{q.answers.length > 1 ? `See all ${q.answers.length} answers` : q.answers.length ? 'Answer too' : 'Be the first to answer'}</Text>
        </Pressable>
      ) : (
        <View style={styles.inputRow}>
          <TextInput value={draft} onChangeText={setDraft} placeholder="Answer from experience" placeholderTextColor={c.textMuted} style={styles.input} />
          <Pressable
            disabled={!draft.trim()}
            onPress={() => {
              answer(q.id, draft);
              setDraft('');
              success();
            }}
            style={[styles.send, !draft.trim() && { opacity: 0.4 }]}>
            <Text style={styles.sendText}>Reply</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/** Ask the people who were just up there. */
export function AskBox({ peakId, peakName }: { peakId: string; peakName: string }) {
  const { ask } = useStore();
  const [draft, setDraft] = useState('');
  return (
    <View style={styles.inputRow}>
      <TextInput value={draft} onChangeText={setDraft} placeholder={`Ask about ${peakName}`} placeholderTextColor={c.textMuted} style={styles.input} />
      <Pressable
        disabled={!draft.trim()}
        onPress={() => {
          ask(peakId, draft);
          setDraft('');
          success();
        }}
        style={[styles.send, !draft.trim() && { opacity: 0.4 }]}>
        <Text style={styles.sendText}>Ask</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18 },
  cell: { width: '25%', alignItems: 'center', gap: 4, paddingHorizontal: 2 },
  badgeName: { color: c.text, fontFamily: Type.bodyBold, fontSize: 12, textAlign: 'center', lineHeight: 15 },
  badgeProgress: { color: c.textSecondary, fontFamily: Type.body, fontSize: 11 },
  legend: { borderRadius: Radius.lg, padding: 18, gap: 12, backgroundColor: '#F3EBDD' },
  legendHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  crown: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#A86A12', alignItems: 'center', justifyContent: 'center' },
  legendKicker: { color: '#7A5410', fontFamily: Type.bodyBold, fontSize: 13 },
  legendName: { color: c.text, fontFamily: Type.display, fontSize: 21, marginTop: 1 },
  legendBody: { color: c.text, fontFamily: Type.body, fontSize: 15, lineHeight: 21 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rank: { width: 16, color: c.textSecondary, fontFamily: Type.bodyBold, fontSize: 14, textAlign: 'center' },
  rankName: { flex: 1, color: c.text, fontFamily: Type.bodyMedium, fontSize: 15 },
  rankCount: { color: c.text, fontFamily: Type.bodyBold, fontSize: 15 },
  q: { gap: 10, padding: 16, borderRadius: Radius.md, backgroundColor: c.backgroundElement },
  qHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qWho: { color: c.text, fontFamily: Type.bodyBold, fontSize: 15 },
  qMeta: { color: c.textSecondary, fontFamily: Type.body },
  qText: { color: c.text, fontFamily: Type.display, fontSize: 19, lineHeight: 25 },
  answer: { flexDirection: 'row', gap: 10, paddingLeft: 4 },
  aWho: { color: c.text, fontFamily: Type.bodyBold, fontSize: 14 },
  aText: { color: c.text, fontFamily: Type.body, fontSize: 15, lineHeight: 21 },
  link: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 14 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, backgroundColor: c.background, color: c.text, paddingHorizontal: 16, minHeight: 44, borderRadius: 99, fontFamily: Type.body, fontSize: 15 },
  send: { backgroundColor: c.accent, paddingHorizontal: 18, minHeight: 44, borderRadius: 99, justifyContent: 'center' },
  sendText: { color: c.accentText, fontFamily: Type.bodyBold, fontSize: 15 },
});
