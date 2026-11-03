import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PeakPoster } from '@/components/peak-poster';
import { PeakImage } from '@/components/peak-photo';
import { Icon } from '@/components/icon';
import { Avatar } from '@/components/social';
import { StatsCard } from '@/components/stats-card';
import { Stars } from '@/components/log-bits';
import { Tilt } from '@/components/tilt';
import { SectionHeader } from '@/components/ui';
import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { success } from '@/lib/haptics';
import { ME, useStore } from '@/lib/store';
import type { Ascent } from '@/lib/types';
import { climberStats } from '@/lib/stats';
import { useCountUp } from '@/lib/use-count-up';

const c = Colors.dark;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Anyone's mountain life: hero, list progress, the range, favorites, want list, diary. */
export function Passport({ userId, topRight, footer }: { userId: string; topRight?: ReactNode; footer?: ReactNode }) {
  const { width } = useWindowDimensions();
  const store = useStore();
  const { peaks, peakById, user, ascentsOf, summitedBy, wantsOf, isFollowing, follow, unfollow, inCommon, photoFor } = store;
  const u = user(userId);
  const isMe = userId === ME;
  const list = ascentsOf(userId);
  const done = summitedBy(userId);
  const wants = wantsOf(userId);

  const pageW = Math.min(width, MaxContentWidth);
  const contentW = pageW - Spacing.three * 2;
  const favW = (contentW - Spacing.two * 3) / 4;
  const listCount = peaks.filter((p) => done.has(p.id)).length;
  const shownCount = useCountUp(listCount, { duration: 1100, delay: 250 });

  if (!u) return null;
  const hero = list[0] ? peakById.get(list[0].peakId) : peakById.get('co-longs-peak');
  const range = peaks.slice().sort((a, b) => a.lon - b.lon);
  const climbedPeaks = [...new Set(list.map((a) => a.peakId))].map((id) => peakById.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
  const tileW = (contentW - 8 * 2) / 3;
  const common = isMe ? null : inCommon(userId);
  const byYear = new Map<string, Ascent[]>();
  for (const l of list) {
    const y = l.date?.slice(0, 4) ?? 'Undated';
    byYear.set(y, [...(byYear.get(y) ?? []), l]);
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.six }}>
      <View style={{ height: 300 }}>
        {hero && <PeakImage peakId={hero.id} photoId={list[0]?.photoId} width={width} height={300} credit />}
        <LinearGradient colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)']} style={styles.topShade} pointerEvents="none" />
        {topRight && <View style={styles.topRight}>{topRight}</View>}
      </View>
      <View style={styles.idBlock}>
        <View style={styles.avatarRing}>
          <Avatar user={u} size={84} />
        </View>
        <Text style={styles.heroName}>{isMe ? u.name || 'You' : u.name}</Text>
        <Text style={styles.handle}>@{u.handle || 'you'}{u.home ? `, ${u.home}` : ''}</Text>
      </View>

      <View style={styles.page}>
        {!isMe && (
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={() => {
                success();
                if (isFollowing(userId)) unfollow(userId);
                else follow(userId);
              }}
              style={[styles.followBtn, isFollowing(userId) && styles.following]}>
              <Text style={[styles.followText, isFollowing(userId) && { color: c.text }]}>{isFollowing(userId) ? 'Following' : 'Follow'}</Text>
            </Pressable>
            {common && (common.climbed.length > 0 || common.want.length > 0) && (
              <Text style={styles.common}>
                {common.climbed.length > 0 && `You've both stood on ${common.climbed.length} of the same summits. `}
                {common.want.length > 0 && (
                  <Text style={{ color: c.accent }}>
                    You both want {common.want.map((p) => peakById.get(p)?.name).slice(0, 2).join(' and ')}.
                  </Text>
                )}
              </Text>
            )}
            {common && common.want.length > 0 && (
              <Pressable onPress={() => router.push({ pathname: '/plan/new', params: { peakId: common.want[0], invite: userId } })} style={styles.planTogether}>
                <Text style={styles.planTogetherText}>Plan {peakById.get(common.want[0])?.name} together</Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.bigCount}>
          <Text style={styles.bigNum}>{shownCount}</Text>
          <View style={{ paddingBottom: 12 }}>
            <Text style={styles.bigOf}>of {peaks.length} Colorado fourteeners</Text>
          </View>
        </View>
        <View style={styles.segments}>
          {range.map((p) => (
            <View key={p.id} style={[styles.seg, { backgroundColor: done.has(p.id) ? c.accent : c.backgroundSelected }]} />
          ))}
        </View>
        <StatsCard s={climberStats(list, peaks, peakById)} isMe={isMe} />
        {isMe && (
          <Pressable onPress={() => router.push('/backfill')} style={styles.addPast}>
            <Icon name="plus" size={18} color={c.accent} weight={2.2} />
            <Text style={styles.addPastText}>Add peaks you&apos;ve climbed before</Text>
          </Pressable>
        )}

        {climbedPeaks.length > 0 && <SectionHeader title={isMe ? 'Your summits' : 'Summits'} action="All peaks" onAction={() => router.push('/peaks')} />}
        {climbedPeaks.length > 0 && (
          <View style={styles.summitGrid}>
            {climbedPeaks.slice(0, 9).map((p) => (
              <Pressable key={p.id} onPress={() => router.push(`/peak/${p.id}`)}>
                <PeakImage peakId={p.id} photoId={isMe ? photoFor.get(p.id) : undefined} width={tileW} height={tileW} radius={Radius.sm} />
                <Text numberOfLines={1} style={[styles.tileLabel, { width: tileW }]}>
                  {p.name.replace(/^Mount /, 'Mt. ')}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.page}>
        {u.favorites.length > 0 || isMe ? <SectionHeader title="Four favorites" /> : null}
        {(u.favorites.length > 0 || isMe) && (
          <View style={styles.favs}>
            {[0, 1, 2, 3].map((i) => {
              const peak = peakById.get(u.favorites[i] ?? '');
              return peak ? (
                <Tilt key={i} width={favW} height={favW * 1.5} onPress={() => router.push(`/peak/${peak.id}`)}>
                  <PeakPoster peak={peak} width={favW} climbed={done.has(peak.id)} photoId={isMe ? photoFor.get(peak.id) : undefined} />
                </Tilt>
              ) : (
                <Pressable key={i} onPress={() => isMe && router.push('/peaks')} style={[styles.emptyFav, { width: favW, height: favW * 1.5 }]}>
                  {isMe ? <Icon name="plus" size={24} color={c.textSecondary} /> : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {wants.length > 0 && (
          <>
            <SectionHeader title={isMe ? 'Want to climb' : 'Wants to climb'} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
              {wants.map((pid) => {
                const p = peakById.get(pid);
                return p ? (
                  <Tilt key={pid} width={92} height={138} onPress={() => router.push(`/peak/${pid}`)}>
                    <PeakPoster peak={p} width={92} climbed={false} />
                  </Tilt>
                ) : null;
              })}
            </ScrollView>
          </>
        )}

        {footer}

        {list.length > 0 && <SectionHeader title="Diary" />}
        {[...byYear.entries()].map(([year, items]) => (
          <View key={year}>
            <Text style={styles.year}>{year}</Text>
            {items.map((l) => (
              <DiaryRow key={l.id} log={l} />
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function DiaryRow({ log }: { log: Ascent }) {
  const { peakById, photoFor, user } = useStore();
  const peak = peakById.get(log.peakId);
  if (!peak) return null;
  const [, m, d] = (log.date ?? '').split('-');
  const names = log.withIds.map((id) => user(id)?.name.split(' ')[0]).filter(Boolean);
  return (
    <Pressable onPress={() => router.push(`/ascent/${log.id}`)} style={({ pressed }) => [styles.diaryRow, pressed && { opacity: 0.6 }]}>
      <View style={styles.diaryDate}>
        <Text style={styles.diaryMonth}>{m ? MONTHS[Number(m) - 1] : ''}</Text>
        <Text style={styles.diaryDay}>{d ? Number(d) : '-'}</Text>
      </View>
      <PeakImage peakId={peak.id} photoId={log.userId === ME ? (log.photoId ?? photoFor.get(peak.id)) : undefined} uri={log.photos?.[0]} index={1} width={60} height={60} radius={Radius.sm} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.diaryName}>{peak.name}</Text>
          {log.winter ? <Icon name="snow" size={15} color="#3E6A8A" weight={2.2} /> : null}
        </View>
        {log.rating ? <Stars value={log.rating} size={13} /> : null}
        <Text style={styles.diaryMeta} numberOfLines={1}>
          {peak.elevationFt.toLocaleString()} ft
          {names.length ? `, with ${names.join(' and ')}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.three },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
  topRight: { position: 'absolute', top: 54, right: Spacing.three },
  idBlock: { alignItems: 'center', marginTop: -46, gap: 2, paddingHorizontal: Spacing.three, marginBottom: Spacing.two },
  avatarRing: { borderRadius: 50, borderWidth: 4, borderColor: c.background, marginBottom: 6 },
  handle: { color: c.textSecondary, fontFamily: Type.body, fontSize: 15 },
  heroName: { color: c.text, fontFamily: Type.display, fontSize: 34, lineHeight: 40 },
  followBtn: { backgroundColor: c.accent, minHeight: 48, borderRadius: 99, alignItems: 'center', justifyContent: 'center' },
  following: { backgroundColor: c.backgroundElement },
  followText: { color: c.accentText, fontFamily: Type.bodyBold, fontSize: 16 },
  common: { color: c.textSecondary, fontFamily: Type.body, fontSize: 16, lineHeight: 23, textAlign: 'center' },
  planTogether: { alignSelf: 'center' },
  planTogetherText: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 16 },
  bigCount: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: Spacing.two },
  bigNum: { color: c.accent, fontFamily: Type.display, fontSize: 88, lineHeight: 92 },
  bigOf: { color: c.text, fontFamily: Type.bodyMedium, fontSize: 16, lineHeight: 21, maxWidth: 160, paddingBottom: 10 },
  bigLabel: { color: c.textSecondary, fontFamily: Type.body, fontSize: 13 },
  segments: { flexDirection: 'row', gap: 2 },
  seg: { flex: 1, height: 10, borderRadius: 2 },
  addPast: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 6 },
  addPastText: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 16 },
  statsRow: { flexDirection: 'row', paddingVertical: Spacing.two, marginTop: Spacing.one },
  summitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tileLabel: { color: c.text, fontFamily: Type.bodyMedium, fontSize: 13, marginTop: 5 },
  favs: { flexDirection: 'row', gap: Spacing.two },
  emptyFav: { backgroundColor: c.backgroundElement, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  year: { color: c.text, fontFamily: Type.display, fontSize: 26, marginTop: Spacing.three, marginBottom: 4 },
  diaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 },
  diaryDate: { width: 36, alignItems: 'center' },
  diaryMonth: { color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 12 },
  diaryDay: { color: c.text, fontFamily: Type.display, fontSize: 24, lineHeight: 28 },
  diaryName: { color: c.text, fontFamily: Type.bodyBold, fontSize: 17 },
  diaryMeta: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14 },
});
