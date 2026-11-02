import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PeakPoster } from '@/components/peak-poster';
import { RidgelineArt } from '@/components/ridgeline-art';
import { Icon } from '@/components/icon';
import { Avatar } from '@/components/social';
import { Tilt } from '@/components/tilt';
import { SectionHeader } from '@/components/ui';
import { BottomTabInset, Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { success } from '@/lib/haptics';
import { ME, useStore } from '@/lib/store';
import type { Ascent } from '@/lib/types';
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
  const partners = new Set(list.flatMap((a) => a.withIds)).size;
  const shownCount = useCountUp(listCount, { duration: 1100, delay: 250 });

  if (!u) return null;
  const hero = list[0] ? peakById.get(list[0].peakId) : peakById.get('co-longs-peak');
  const range = peaks.slice().sort((a, b) => a.lon - b.lon);
  const common = isMe ? null : inCommon(userId);
  const byYear = new Map<string, Ascent[]>();
  for (const l of list) {
    const y = l.date?.slice(0, 4) ?? 'Undated';
    byYear.set(y, [...(byYear.get(y) ?? []), l]);
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.six }}>
      <View style={{ height: 420 }}>
        {hero && <RidgelineArt peakId={hero.id} lit={list.length > 0} width={width} height={420} count={38} top={0.1} bottom={0.72} amplitude={0.24} reveal />}
        {topRight && <View style={styles.topRight}>{topRight}</View>}
        <View style={styles.heroBottom}>
          <View style={styles.idRow}>
            <Avatar user={u} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.handle}>@{u.handle || 'you'}{u.home ? `, ${u.home}` : ''}</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{isMe ? u.name || 'You' : u.name}</Text>
        </View>
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
        <View style={styles.statsRow}>
          <Mini value={String(list.length)} label="summits" />
          <Mini value={String(partners)} label="partners" />
          <Mini value={String(wants.length)} label="want to climb" />
        </View>

        <SectionHeader title="The range" action="All peaks" onAction={() => router.push('/peaks')} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: 3 }}>
        {range.map((p) => {
          const lit = done.has(p.id);
          return (
            <Pressable key={p.id} onPress={() => router.push(`/peak/${p.id}`)} style={{ alignItems: 'center', gap: 6 }}>
              <View style={[styles.rangeTile, lit && { backgroundColor: '#F6F7F3' }]}>
                <RidgelineArt peakId={p.id} lit={lit} width={62} height={96} count={11} top={0.25} bottom={0.95} amplitude={0.35} paper={lit ? '#F6F7F3' : c.backgroundElement} marker={false} />
              </View>
              <Text numberOfLines={1} style={[styles.rangeLabel, lit && { color: c.accent }]}>
                {p.name.replace(/^Mount /, 'Mt. ').replace(/ Peak$/, '').replace(/ Mountain$/, '')}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: c.text, fontFamily: Type.display, fontSize: 28 }}>{value}</Text>
      <Text style={{ color: c.textSecondary, fontFamily: Type.body, fontSize: 13 }}>{label}</Text>
    </View>
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
        <Text style={styles.diaryDay}>{d ? Number(d) : '?'}</Text>
      </View>
      <PeakPoster peak={peak} width={44} climbed photoId={log.userId === ME ? (log.photoId ?? photoFor.get(peak.id)) : undefined} showTitle={false} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.diaryName}>{peak.name}</Text>
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
  topRight: { position: 'absolute', top: 54, right: Spacing.three },
  heroBottom: { position: 'absolute', left: Spacing.three, right: Spacing.three, bottom: Spacing.two, gap: 8 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  handle: { color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 15 },
  heroName: { color: c.text, fontFamily: Type.display, fontSize: 48, lineHeight: 50, letterSpacing: -1.6 },
  followBtn: { backgroundColor: c.accent, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  following: { backgroundColor: c.backgroundElement },
  followText: { color: c.accentText, fontFamily: Type.bodyBold, fontSize: 16, marginTop: 2 },
  common: { color: c.textSecondary, fontFamily: Type.body, fontSize: 16, lineHeight: 23 },
  planTogether: { alignSelf: 'flex-start' },
  planTogetherText: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 16, textDecorationLine: 'underline' },
  bigCount: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: Spacing.three },
  bigNum: { color: c.accent, fontFamily: Type.displayBlack, fontSize: 96, lineHeight: 96, letterSpacing: -4, fontVariant: ['tabular-nums'] },
  bigOf: { color: c.text, fontFamily: Type.bodyMedium, fontSize: 16, lineHeight: 20, maxWidth: 150, paddingBottom: 14 },
  bigLabel: { color: c.textSecondary, fontFamily: Type.body, fontSize: 13 },
  segments: { flexDirection: 'row', gap: 2 },
  seg: { flex: 1, height: 12 },
  statsRow: { flexDirection: 'row', paddingVertical: Spacing.two, marginTop: Spacing.one },
  rangeTile: { width: 62, height: 96, overflow: 'hidden', backgroundColor: c.backgroundElement },
  rangeLabel: { width: 62, color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 10, textAlign: 'center' },
  favs: { flexDirection: 'row', gap: Spacing.two },
  emptyFav: { backgroundColor: c.backgroundElement, alignItems: 'center', justifyContent: 'center' },
  year: { color: c.text, fontFamily: Type.display, fontSize: 26, letterSpacing: -0.6, marginTop: Spacing.three, marginBottom: 4 },
  diaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 10 },
  diaryDate: { width: 36, alignItems: 'center' },
  diaryMonth: { color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 12 },
  diaryDay: { color: c.text, fontFamily: Type.display, fontSize: 26, lineHeight: 28, fontVariant: ['tabular-nums'] },
  diaryName: { color: c.text, fontFamily: Type.bodyBold, fontSize: 17 },
  diaryMeta: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14 },
});
