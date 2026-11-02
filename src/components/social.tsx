import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { RidgelineArt } from '@/components/ridgeline-art';
import { Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { success, tap } from '@/lib/haptics';
import { ago, daysSince, formatPlanDate, ME, useStore } from '@/lib/store';
import type { Ascent, Beta, Plan, User } from '@/lib/types';

const c = Colors.dark;

export function Avatar({ user, size = 32, ring }: { user?: User; size?: number; ring?: string }) {
  const initials = (user?.name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: user?.color ?? c.backgroundSelected,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 2 : 0,
        borderColor: ring,
      }}>
      <Text style={{ color: '#0A0F13', fontFamily: Type.bodyBold, fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export function FacePile({ ids, size = 26, max = 4, onPress }: { ids: string[]; size?: number; max?: number; onPress?: () => void }) {
  const { user } = useStore();
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center' }}>
      {shown.map((id, i) => (
        <View key={id} style={{ marginLeft: i === 0 ? 0 : -size * 0.3 }}>
          <Avatar user={user(id)} size={size} ring={c.background} />
        </View>
      ))}
      {extra > 0 && <Text style={{ color: c.textSecondary, fontFamily: Type.mono, fontSize: 11, marginLeft: 6 }}>+{extra}</Text>}
    </Pressable>
  );
}

const SURFACE_COLOR: Record<string, string> = { Dry: c.success, 'Patchy snow': c.gold, Snow: c.link, Ice: '#B9A7FF' };
const WIND_COLOR: Record<string, string> = { Calm: c.success, Breezy: c.gold, Howling: c.accent };

/** Conditions at a glance. Color carries the meaning: green easy, gold heads up, orange careful. */
export function BetaChips({ beta, compact }: { beta?: Beta; compact?: boolean }) {
  if (!beta) return null;
  const chips: [string, string][] = [];
  if (beta.surface) chips.push([beta.surface, SURFACE_COLOR[beta.surface] ?? c.textSecondary]);
  if (beta.traction && beta.traction !== 'None') chips.push([beta.traction, c.text]);
  if (beta.traction === 'None' && !compact) chips.push(['No traction', c.textSecondary]);
  if (beta.wind) chips.push([`${beta.wind} wind`, WIND_COLOR[beta.wind] ?? c.textSecondary]);
  if (beta.summitTime && !compact) chips.push([`Top ${beta.summitTime}`, c.textSecondary]);
  if (!chips.length) return null;
  return (
    <View style={styles.chips}>
      {chips.map(([label, color]) => (
        <View key={label} style={styles.chip}>
          <View style={[styles.chipDot, { backgroundColor: color }]} />
          <Text style={styles.chipText}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Summit kudos. The little peak jumps when you give one. */
export function KudosButton({ ascent }: { ascent: Ascent }) {
  const { toggleKudos } = useStore();
  const mine = ascent.kudos.includes(ME);
  const pop = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }, { translateY: (1 - pop.get()) * 10 }] }));
  const disabled = ascent.userId === ME;
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (!mine) {
          success();
          pop.set(withSequence(withTiming(1.45, { duration: 110 }), withSpring(1, { damping: 6, stiffness: 300 })));
        } else tap();
        toggleKudos(ascent.id);
      }}
      hitSlop={8}
      style={styles.action}>
      <Animated.Text style={[styles.kudosIcon, { color: mine ? c.accent : c.textSecondary }, style]}>▲</Animated.Text>
      <Text style={[styles.actionText, mine && { color: c.accent }]}>{ascent.kudos.length || ''}</Text>
    </Pressable>
  );
}

/** "Jess's 19th 14er" or "Repeat". The milestone is what people actually react to. */
function milestone(a: Ascent, all: Ascent[]) {
  const prior = all.filter((x) => x.userId === a.userId && (x.date ?? '') < (a.date ?? '') );
  if (prior.some((x) => x.peakId === a.peakId)) return 'REPEAT';
  const n = new Set(prior.map((x) => x.peakId)).size + 1;
  const suf = n % 10 === 1 && n % 100 !== 11 ? 'ST' : n % 10 === 2 && n % 100 !== 12 ? 'ND' : n % 10 === 3 && n % 100 !== 13 ? 'RD' : 'TH';
  return `${n}${suf} 14ER`;
}

export function AscentCard({ ascent, climbers }: { ascent: Ascent; climbers: string[] }) {
  const { width } = useWindowDimensions();
  const { user, peakById, ascents, toggleKudos, wantsOf, toggleWant } = useStore();
  const peak = peakById.get(ascent.peakId);
  const lastTap = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burst = useSharedValue(0);
  const burstStyle = useAnimatedStyle(() => ({ opacity: burst.get(), transform: [{ scale: 0.6 + burst.get() * 0.8 }] }));
  if (!peak) return null;

  const cardW = Math.min(width, MaxContentWidth);
  const lead = user(ascent.userId);
  const others = climbers.filter((u) => u !== ascent.userId).map((u) => user(u)?.name.split(' ')[0] ?? 'someone');
  const wanted = wantsOf(ME).includes(peak.id);
  const fresh = daysSince(ascent.date) <= 7;

  const onMediaPress = () => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      if (timer.current) clearTimeout(timer.current);
      if (!ascent.kudos.includes(ME) && ascent.userId !== ME) {
        toggleKudos(ascent.id);
        success();
      }
      burst.set(withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 500 })));
    } else {
      timer.current = setTimeout(() => router.push(`/ascent/${ascent.id}`), 290);
    }
    lastTap.current = now;
  };
  return (
    <View style={styles.card}>
      <Pressable onPress={() => router.push(`/user/${ascent.userId}`)} style={styles.cardHead}>
        <FacePile ids={climbers} size={34} max={3} />
        <View style={{ flex: 1 }}>
          <Text style={styles.who} numberOfLines={1}>
            {ascent.userId === ME ? 'You' : lead?.name}
            {others.length ? <Text style={styles.whoWith}> with {others.join(', ')}</Text> : null}
          </Text>
          <Text style={styles.meta}>
            {ago(ascent.createdAt).toUpperCase()}{lead?.home ? ` · ${lead.home.toUpperCase()}` : ''}
          </Text>
        </View>
        <Text style={styles.milestone}>{milestone(ascent, ascents)}</Text>
      </Pressable>

      <Pressable onPress={onMediaPress}>
        <View style={{ height: 230, overflow: 'hidden' }}>
          <RidgelineArt peakId={peak.id} lit width={cardW} height={230} count={28} top={0.08} bottom={0.8} amplitude={0.3} />
          <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(10,15,19,0.92)']} style={styles.mediaFade} />
          <View style={styles.mediaText}>
            <Text style={styles.peakName}>{peak.name}</Text>
            <Text style={styles.peakMeta}>
              {peak.elevationFt.toLocaleString()} FT{ascent.beta?.route ? `  ·  ${ascent.beta.route.toUpperCase()}` : ''}
            </Text>
          </View>
          <Animated.Text pointerEvents="none" style={[styles.burst, burstStyle]}>▲</Animated.Text>
        </View>
      </Pressable>

      <View style={styles.cardBody}>
        {ascent.beta?.surface && (
          <View style={{ gap: 6 }}>
            <Text style={[styles.betaLabel, fresh && { color: c.success }]}>{fresh ? 'FRESH BETA' : 'CONDITIONS'}</Text>
            <BetaChips beta={ascent.beta} />
          </View>
        )}
        {ascent.note ? (
          <Text style={styles.note} numberOfLines={4}>
            {ascent.note}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <KudosButton ascent={ascent} />
        <Pressable onPress={() => router.push(`/ascent/${ascent.id}`)} hitSlop={8} style={styles.action}>
          <Text style={styles.commentIcon}>◯</Text>
          <Text style={styles.actionText}>{ascent.comments.length || ''}</Text>
        </Pressable>
        {ascent.kudos.length > 0 && <FacePile ids={ascent.kudos} size={20} max={4} />}
        <View style={{ flex: 1 }} />
        {ascent.userId !== ME && (
          <Pressable
            onPress={() => {
              tap();
              toggleWant(peak.id);
            }}
            hitSlop={8}
            style={[styles.want, wanted && { borderColor: c.accent, backgroundColor: 'rgba(255,122,69,0.12)' }]}>
            <Text style={[styles.wantText, wanted && { color: c.accent }]}>{wanted ? '✓ On my list' : '+ Want to climb'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function seatsLeft(p: Plan) {
  return Math.max(0, p.size - p.memberIds.length);
}

/** Date block + peak + crew + seats. Joining is one tap. */
export function PlanCard({ plan, compact }: { plan: Plan; compact?: boolean }) {
  const { user, peakById, requestJoin } = useStore();
  const peak = peakById.get(plan.peakId);
  if (!peak) return null;
  const [dow, mon, dnum] = formatPlanDate(plan.date).replace(',', '').split(' ');
  const host = user(plan.hostId);
  const going = plan.memberIds.includes(ME);
  const requested = plan.requestIds.includes(ME);
  const open = seatsLeft(plan);

  return (
    <Pressable onPress={() => router.push(`/plan/${plan.id}`)} style={({ pressed }) => [styles.plan, pressed && { opacity: 0.85 }]}>
      <View style={styles.planDate}>
        <Text style={styles.planDow}>{dow?.toUpperCase()}</Text>
        <Text style={styles.planDay}>{dnum}</Text>
        <Text style={styles.planMon}>{mon?.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.planKicker}>{plan.hostId === ME ? 'YOUR PLAN' : `${host?.name.split(' ')[0].toUpperCase()} IS GOING`} · {plan.start} START</Text>
        <Text style={styles.planPeak} numberOfLines={1}>
          {peak.name}
        </Text>
        {!compact && plan.note ? (
          <Text style={styles.planNote} numberOfLines={2}>
            {plan.note}
          </Text>
        ) : null}
        <View style={styles.planFoot}>
          <FacePile ids={plan.memberIds} size={24} max={5} />
          <Text numberOfLines={1} style={[styles.seats, open === 0 && { color: c.textMuted }]}>{open ? `${open} open` : 'Full'}</Text>
          <View style={{ flex: 1 }} />
          {going ? (
            <Text style={styles.going}>Going ✓</Text>
          ) : requested ? (
            <Text style={styles.requested}>Requested</Text>
          ) : open > 0 ? (
            <Pressable
              onPress={() => {
                success();
                requestJoin(plan.id);
              }}
              hitSlop={6}
              style={styles.join}>
              <Text style={styles.joinText}>Ask to join</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, backgroundColor: c.backgroundSelected },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { color: c.text, fontFamily: Type.mono, fontSize: 11 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingRight: 6 },
  kudosIcon: { fontSize: 18 },
  commentIcon: { fontSize: 16, color: c.textSecondary },
  actionText: { color: c.textSecondary, fontFamily: Type.mono, fontSize: 13, minWidth: 8 },
  card: { borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: Spacing.two, marginBottom: Spacing.two },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.three, paddingVertical: 12 },
  who: { color: c.text, fontFamily: Type.bodyBold, fontSize: 15 },
  whoWith: { color: c.textSecondary, fontFamily: Type.body },
  meta: { color: c.textMuted, fontFamily: Type.mono, fontSize: 10, letterSpacing: 0.6, marginTop: 2 },
  milestone: { color: c.accent, fontFamily: Type.monoBold, fontSize: 10, letterSpacing: 0.8 },
  mediaFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 },
  mediaText: { position: 'absolute', left: Spacing.three, bottom: 12 },
  peakName: { color: c.text, fontFamily: Type.display, fontSize: 30, lineHeight: 34 },
  peakMeta: { color: c.textSecondary, fontFamily: Type.mono, fontSize: 10, letterSpacing: 0.8, marginTop: 2 },
  burst: { position: 'absolute', alignSelf: 'center', top: 70, fontSize: 80, color: c.accent },
  cardBody: { paddingHorizontal: Spacing.three, paddingTop: 12, gap: 10 },
  betaLabel: { color: c.textMuted, fontFamily: Type.monoBold, fontSize: 9.5, letterSpacing: 1.2 },
  note: { color: c.text, fontFamily: Type.body, fontSize: 15, lineHeight: 22 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: Spacing.three, paddingTop: 12 },
  want: { borderWidth: 1, borderColor: c.border, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  wantText: { color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 12 },
  plan: { flexDirection: 'row', gap: 14, padding: 14, borderRadius: Radius.md, backgroundColor: c.backgroundElement, borderWidth: 1, borderColor: c.border },
  planDate: { width: 50, alignItems: 'center', paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: c.background, borderWidth: 1, borderColor: c.border },
  planDow: { color: c.accent, fontFamily: Type.monoBold, fontSize: 10, letterSpacing: 1 },
  planDay: { color: c.text, fontFamily: Type.display, fontSize: 26, lineHeight: 30 },
  planMon: { color: c.textMuted, fontFamily: Type.mono, fontSize: 9, letterSpacing: 1 },
  planKicker: { color: c.textMuted, fontFamily: Type.mono, fontSize: 9.5, letterSpacing: 0.8 },
  planPeak: { color: c.text, fontFamily: Type.display, fontSize: 21 },
  planNote: { color: c.textSecondary, fontFamily: Type.body, fontSize: 13, lineHeight: 18 },
  planFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  seats: { color: c.accent, fontFamily: Type.mono, fontSize: 11 },
  going: { color: c.success, fontFamily: Type.bodyBold, fontSize: 13 },
  requested: { color: c.gold, fontFamily: Type.bodyBold, fontSize: 13 },
  join: { backgroundColor: c.accent, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  joinText: { color: c.accentText, fontFamily: Type.bodyBold, fontSize: 13 },
});
