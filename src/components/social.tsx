import { router } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { PeakImage, photosFor, pickIndex } from '@/components/peak-photo';
import { Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { success, tap } from '@/lib/haptics';
import { Stars } from '@/components/log-bits';
import { routeById } from '@/data/routes';
import { ago, daysSince, formatDate, formatPlanDate, ME, useStore } from '@/lib/store';
import type { Ascent, Beta, Plan, User } from '@/lib/types';

const c = Colors.dark;

function mix(hex: string, into: string, t: number) {
  const a = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(into.slice(i, i + 2), 16));
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

/** Each person: a stable initial on a pale tint of their own hue. */
export function Avatar({ user, size = 32, ring }: { user?: User; size?: number; ring?: string }) {
  const hue = user?.color ?? '#7A827C';
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
        backgroundColor: mix(hue, c.background, 0.62),
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: ring ? 2 : 0,
        borderColor: ring,
      }}>
      <Text style={{ color: mix(hue, '#000000', 0.55), fontFamily: Type.bodyBold, fontSize: size * 0.38, marginTop: size * 0.06 }}>{initials}</Text>
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
        <View key={id} style={{ marginLeft: i === 0 ? 0 : -size * 0.28 }}>
          <Avatar user={user(id)} size={size} ring={c.background} />
        </View>
      ))}
      {extra > 0 && <Text style={{ color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 13, marginLeft: 6 }}>+{extra}</Text>}
    </Pressable>
  );
}

/** Good, heads up, careful. Colour says which, like a map legend. */
const GOOD = c.success;
const CAREFUL = c.gold;
const BAD = c.danger;
const SURFACE: Record<string, string> = { Dry: GOOD, 'Patchy snow': CAREFUL, Snow: CAREFUL, Ice: BAD };
const WIND: Record<string, string> = { Calm: GOOD, Breezy: CAREFUL, Howling: BAD };

export function BetaChips({ beta, compact }: { beta?: Beta; compact?: boolean }) {
  if (!beta) return null;
  const items: [string, string | null][] = [];
  if (beta.surface) items.push([beta.surface, SURFACE[beta.surface]]);
  if (beta.traction && beta.traction !== 'None') items.push([beta.traction, null]);
  if (beta.traction === 'None' && !compact) items.push(['No traction needed', null]);
  if (beta.wind) items.push([`${beta.wind} wind`, WIND[beta.wind]]);
  if (beta.summitTime && !compact) items.push([`On top ${beta.summitTime.replace(/^0/, '')}`, null]);
  if (!items.length) return null;
  return (
    <View style={styles.chips}>
      {items.map(([label, color]) => (
        <View key={label} style={styles.chip}>
          {color && <View style={[styles.swatch, { backgroundColor: color }]} />}
          <Text style={styles.chipText}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

export function KudosButton({ ascent }: { ascent: Ascent }) {
  const { toggleKudos } = useStore();
  const mine = ascent.kudos.includes(ME);
  const pop = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.get() }, { translateY: (1 - pop.get()) * 8 }] }));
  const own = ascent.userId === ME;
  return (
    <Pressable
      disabled={own}
      accessibilityLabel={mine ? 'Remove kudos' : 'Give kudos'}
      onPress={() => {
        if (!mine) {
          success();
          pop.set(withSequence(withTiming(1.35, { duration: 110 }), withSpring(1, { damping: 7, stiffness: 300 })));
        } else tap();
        toggleKudos(ascent.id);
      }}
      hitSlop={10}
      style={styles.action}>
      <Animated.View style={style}>
        <Icon name="summit" filled={mine} color={mine ? c.accent : c.text} />
      </Animated.View>
      <Text style={[styles.actionText, mine && { color: c.accent }]}>{ascent.kudos.length || ''}</Text>
    </Pressable>
  );
}

/** "19th fourteener" or "Again". The milestone is what people react to. */
function milestone(a: Ascent, all: Ascent[]) {
  const prior = all.filter((x) => x.userId === a.userId && (x.date ?? '') < (a.date ?? ''));
  if (prior.some((x) => x.peakId === a.peakId)) return 'Again';
  const n = new Set(prior.map((x) => x.peakId)).size + 1;
  if (n === 1) return 'First fourteener';
  if (n === 58) return 'Finished the 58';
  const suf = n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th';
  return `${n}${suf} fourteener`;
}

export function AscentCard({ ascent, climbers }: { ascent: Ascent; climbers: string[] }) {
  const { width } = useWindowDimensions();
  const { user, peakById, ascents, toggleKudos, wantsOf, toggleWant, displayName } = useStore();
  const peak = peakById.get(ascent.peakId);
  const lastTap = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const burst = useSharedValue(0);
  const burstStyle = useAnimatedStyle(() => ({ opacity: burst.get(), transform: [{ scale: 0.6 + burst.get() * 0.8 }] }));
  if (!peak) return null;

  const cardW = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const photoH = Math.round(cardW * 0.78);
  const others = climbers.filter((u) => u !== ascent.userId).map((u) => (u === ME ? 'you' : (user(u)?.name.split(' ')[0] ?? 'someone')));
  const route = routeById(ascent.routeId);
  const photoCount = ascent.photos?.length ?? 0;
  const wanted = wantsOf(ME).includes(peak.id);
  const fresh = daysSince(ascent.date) <= 7;
  const pick = pickIndex(ascent.id, photosFor(peak.id).length);

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
        <FacePile ids={climbers} size={40} max={3} />
        <View style={{ flex: 1 }}>
          <Text style={styles.who} numberOfLines={1}>
            {displayName(ascent.userId)}
            {others.length ? <Text style={styles.whoWith}> with {others.join(' and ')}</Text> : null}
          </Text>
          <Text style={styles.meta}>{ascent.date ? formatDate(ascent.date) : `${ago(ascent.createdAt)} ago`}</Text>
        </View>
      </Pressable>

      <View style={styles.cardBody}>
        <Pressable onPress={() => router.push(`/peak/${peak.id}`)} style={{ gap: 2 }}>
          <View style={styles.tags}>
            <Text style={styles.milestone}>{milestone(ascent, ascents)}</Text>
            {ascent.winter && (
              <View style={styles.winterTag}>
                <Icon name="snow" size={13} color="#3E6A8A" weight={2.2} />
                <Text style={styles.winterTagText}>Winter</Text>
              </View>
            )}
          </View>
          <Text style={styles.peakName}>{peak.name}</Text>
          <View style={styles.subline}>
            {ascent.rating ? <Stars value={ascent.rating} size={15} /> : null}
            {route ? <Text style={styles.routeText}>{route.name}, {route.miles} mi, {route.gainFt.toLocaleString()} ft</Text> : null}
          </View>
        </Pressable>
        {ascent.note ? (
          <Text style={styles.note} numberOfLines={4}>
            {ascent.note}
          </Text>
        ) : null}
      </View>

      <Pressable onPress={onMediaPress} style={{ paddingHorizontal: Spacing.three }}>
        <PeakImage peakId={peak.id} photoId={ascent.photoId} uri={ascent.photos?.[0]} index={pick} width={cardW} height={photoH} radius={Radius.md} credit />
        {photoCount > 1 && (
          <View style={styles.photoCount}>
            <Text style={styles.photoCountText}>1 of {photoCount}</Text>
          </View>
        )}
        <Animated.View pointerEvents="none" style={[styles.burst, { top: photoH / 2 - 48 }, burstStyle]}>
          <Icon name="summit" size={96} filled color="#fff" />
        </Animated.View>
      </Pressable>

      {ascent.beta?.surface && (
        <View style={[styles.cardBody, { paddingTop: 12, gap: 8 }]}>
          <Text style={[styles.betaLabel, fresh && { color: c.success }]}>
            {fresh ? `Conditions ${daysSince(ascent.date) === 0 ? 'today' : daysSince(ascent.date) === 1 ? 'yesterday' : `${daysSince(ascent.date)} days ago`}` : 'Conditions'}
          </Text>
          <BetaChips beta={ascent.beta} />
        </View>
      )}

      <View style={styles.actions}>
        <KudosButton ascent={ascent} />
        <Pressable onPress={() => router.push(`/ascent/${ascent.id}`)} hitSlop={10} style={styles.action} accessibilityLabel="Comments">
          <Icon name="comment" />
          <Text style={styles.actionText}>{ascent.comments.length || ''}</Text>
        </Pressable>
        {ascent.kudos.length > 0 && <FacePile ids={ascent.kudos} size={24} max={4} />}
        <View style={{ flex: 1 }} />
        {ascent.userId !== ME && (
          <Pressable
            onPress={() => {
              tap();
              toggleWant(peak.id);
            }}
            hitSlop={8}
            style={[styles.want, wanted && { backgroundColor: c.accent }]}>
            <Icon name="bookmark" size={18} filled={wanted} color={wanted ? c.accentText : c.text} />
            <Text style={[styles.wantText, wanted && { color: c.accentText }]}>{wanted ? 'On your list' : 'Want to go'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function seatsLeft(p: Plan) {
  return Math.max(0, p.size - p.memberIds.length);
}

export function PlanCard({ plan, compact, width }: { plan: Plan; compact?: boolean; width?: number }) {
  const { width: screenW } = useWindowDimensions();
  const { user, peakById, requestJoin } = useStore();
  const peak = peakById.get(plan.peakId);
  if (!peak) return null;
  const w = width ?? Math.min(screenW, MaxContentWidth) - Spacing.three * 2;
  const [dow, mon, dnum] = formatPlanDate(plan.date).replace(',', '').split(' ');
  const host = user(plan.hostId);
  const going = plan.memberIds.includes(ME);
  const requested = plan.requestIds.includes(ME);
  const open = seatsLeft(plan);

  return (
    <Pressable onPress={() => router.push(`/plan/${plan.id}`)} style={({ pressed }) => [styles.plan, pressed && { opacity: 0.9 }]}>
      <View>
        <PeakImage peakId={peak.id} index={pickIndex(plan.id, photosFor(peak.id).length)} width={w} height={compact ? 130 : 160} />
        <View style={styles.planDate}>
          <Text style={styles.planDow}>{dow}</Text>
          <Text style={styles.planDay}>{dnum}</Text>
          <Text style={styles.planMon}>{mon}</Text>
        </View>
      </View>
      <View style={styles.planBody}>
        <Text style={styles.planPeak} numberOfLines={1}>
          {peak.name}
        </Text>
        <Text style={styles.planWho}>
          {plan.hostId === ME ? 'Your plan' : `${host?.name.split(' ')[0]} is going`}, at the trailhead by {plan.start.replace(/^0/, '')}
        </Text>
        {!compact && plan.note ? (
          <Text style={styles.planNote} numberOfLines={2}>
            {plan.note}
          </Text>
        ) : null}
        <View style={styles.planFoot}>
          <FacePile ids={plan.memberIds} size={28} max={5} />
          <Text numberOfLines={1} style={[styles.seats, open === 0 && { color: c.textSecondary }]}>
            {open ? `${open} open ${open === 1 ? 'seat' : 'seats'}` : 'Full'}
          </Text>
          <View style={{ flex: 1 }} />
          {going ? (
            <Text style={styles.going}>You&apos;re going</Text>
          ) : requested ? (
            <Text style={styles.requested}>Asked</Text>
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
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 99, backgroundColor: c.backgroundSelected },
  swatch: { width: 8, height: 8, borderRadius: 4 },
  chipText: { color: c.text, fontFamily: Type.bodyMedium, fontSize: 13 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingRight: 4 },
  actionText: { color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 15, minWidth: 8 },
  card: { paddingBottom: Spacing.two, marginBottom: Spacing.four },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.three, paddingBottom: 10 },
  who: { color: c.text, fontFamily: Type.bodyBold, fontSize: 16 },
  whoWith: { color: c.textSecondary, fontFamily: Type.body },
  meta: { color: c.textSecondary, fontFamily: Type.body, fontSize: 13, marginTop: 1 },
  burst: { position: 'absolute', alignSelf: 'center' },
  cardBody: { paddingHorizontal: Spacing.three, paddingBottom: 12, gap: 8 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  winterTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: '#E1EAF1' },
  winterTagText: { color: '#3E6A8A', fontFamily: Type.bodyBold, fontSize: 12 },
  subline: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 2 },
  routeText: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14 },
  photoCount: { position: 'absolute', top: 10, right: Spacing.three + 10, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
  photoCountText: { color: '#fff', fontFamily: Type.bodyBold, fontSize: 12 },
  milestone: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 14 },
  peakName: { color: c.text, fontFamily: Type.display, fontSize: 26, lineHeight: 30 },
  betaLabel: { color: c.textSecondary, fontFamily: Type.bodyBold, fontSize: 14 },
  betaRoute: { color: c.textSecondary, fontFamily: Type.body },
  note: { color: c.text, fontFamily: Type.body, fontSize: 16, lineHeight: 23 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: Spacing.three, paddingTop: 4 },
  want: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, minHeight: 38, borderRadius: 99, backgroundColor: c.backgroundElement },
  wantText: { color: c.text, fontFamily: Type.bodyBold, fontSize: 14 },
  plan: { borderRadius: Radius.md, overflow: 'hidden', backgroundColor: c.backgroundElement },
  planDate: { position: 'absolute', top: 10, left: 10, width: 50, alignItems: 'center', paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: '#fff' },
  planDow: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 12 },
  planDay: { color: c.text, fontFamily: Type.display, fontSize: 24, lineHeight: 27 },
  planMon: { color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 12 },
  planBody: { padding: 14, gap: 4 },
  planPeak: { color: c.text, fontFamily: Type.display, fontSize: 21 },
  planWho: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14 },
  planNote: { color: c.text, fontFamily: Type.body, fontSize: 15, lineHeight: 21, marginTop: 2 },
  planFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  seats: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 14 },
  going: { color: c.success, fontFamily: Type.bodyBold, fontSize: 14 },
  requested: { color: c.gold, fontFamily: Type.bodyBold, fontSize: 14 },
  join: { backgroundColor: c.accent, paddingHorizontal: 16, minHeight: 36, borderRadius: 99, justifyContent: 'center' },
  joinText: { color: c.accentText, fontFamily: Type.bodyBold, fontSize: 14 },
});
