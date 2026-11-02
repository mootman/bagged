import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PeakPoster } from '@/components/peak-poster';
import { RidgelineArt } from '@/components/ridgeline-art';
import { Avatar } from '@/components/social';
import { Tilt } from '@/components/tilt';
import { SectionHeader } from '@/components/ui';
import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { success } from '@/lib/haptics';
import { ME, useStore } from '@/lib/store';
import type { Ascent } from '@/lib/types';
import { useCountUp } from '@/lib/use-count-up';

const c = Colors.dark;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

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
        {hero && <RidgelineArt peakId={hero.id} lit={list.length > 0} width={width} height={420} count={38} top={0.16} bottom={0.84} amplitude={0.24} reveal />}
        {topRight && <View style={styles.topRight}>{topRight}</View>}
        <View style={styles.heroBottom}>
          <View style={styles.idRow}>
            <Avatar user={u} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.handle}>@{u.handle || 'you'} · {u.home ? u.home.toUpperCase() : 'COLORADO'}</Text>
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
                <Text style={styles.planTogetherText}>Plan {peakById.get(common.want[0])?.name} together →</Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.bigCount}>
          <Text style={styles.bigNum}>{shownCount}</Text>
          <View style={{ paddingBottom: 12 }}>
            <Text style={styles.bigOf}>of {peaks.length}</Text>
            <Text style={styles.bigLabel}>COLORADO 14ERS</Text>
          </View>
        </View>
        <View style={styles.segments}>
          {range.map((p) => (
            <View key={p.id} style={[styles.seg, { backgroundColor: done.has(p.id) ? c.accent : 'rgba(237,230,214,0.1)' }]} />
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
              <View style={[styles.rangeTile, lit && { borderColor: 'rgba(255,122,69,0.5)' }]}>
                <RidgelineArt peakId={p.id} lit={lit} width={62} height={96} count={11} top={0.25} bottom={0.95} amplitude={0.35} sun={false} />
              </View>
              <Text numberOfLines={1} style={[styles.rangeLabel, lit && { color: c.accent }]}>
                {p.name.replace(/^Mount /, 'Mt ').replace(/ Peak$/, '').toUpperCase()}
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
                  <Text style={{ color: c.textMuted, fontFamily: Type.display, fontSize: 26 }}>{isMe ? '+' : ''}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {wants.length > 0 && (
          <>
            <SectionHeader title={isMe ? 'Your want-to-climb list' : 'Wants to climb'} />
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
      <Text style={{ color: c.textMuted, fontFamily: Type.mono, fontSize: 10, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
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
          {peak.elevationFt.toLocaleString()} FT
          {names.length ? `  ·  ${names.join(', ')}` : ''}
          {log.kudos.length ? `  ·  ▲${log.kudos.length}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.three },
  topRight: { position: 'absolute', top: 54, right: Spacing.three },
  heroBottom: { position: 'absolute', left: Spacing.three, right: Spacing.three, bottom: Spacing.two, gap: 6 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  handle: { color: c.textSecondary, fontFamily: Type.mono, fontSize: 11, letterSpacing: 0.6 },
  heroName: { color: c.text, fontFamily: Type.display, fontSize: 50, lineHeight: 54, letterSpacing: -1 },
  followBtn: { backgroundColor: c.accent, borderRadius: 99, paddingVertical: 12, alignItems: 'center' },
  following: { backgroundColor: 'transparent', borderWidth: 1, borderColor: c.border },
  followText: { color: c.accentText, fontFamily: Type.bodyBold, fontSize: 15 },
  common: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14, lineHeight: 20 },
  planTogether: { alignSelf: 'flex-start' },
  planTogetherText: { color: c.link, fontFamily: Type.bodyMedium, fontSize: 14 },
  bigCount: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: Spacing.two },
  bigNum: { color: c.accent, fontFamily: Type.displayBlack, fontSize: 88, lineHeight: 92, letterSpacing: -3 },
  bigOf: { color: c.text, fontFamily: Type.displayItalic, fontSize: 24 },
  bigLabel: { color: c.textMuted, fontFamily: Type.mono, fontSize: 10, letterSpacing: 1.4 },
  segments: { flexDirection: 'row', gap: 2 },
  seg: { flex: 1, height: 10, borderRadius: 1.5 },
  statsRow: { flexDirection: 'row', paddingVertical: Spacing.three, borderBottomWidth: 1, borderColor: c.border, marginTop: Spacing.one },
  rangeTile: { width: 62, height: 96, borderRadius: Radius.xs, overflow: 'hidden', borderWidth: 1, borderColor: c.border },
  rangeLabel: { width: 62, color: c.textMuted, fontFamily: Type.mono, fontSize: 7.5, textAlign: 'center', letterSpacing: 0.3 },
  favs: { flexDirection: 'row', gap: Spacing.two },
  emptyFav: { borderRadius: Radius.xs, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  year: { color: c.text, fontFamily: Type.displayItalic, fontSize: 28, marginTop: Spacing.two, marginBottom: 2 },
  diaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  diaryDate: { width: 36, alignItems: 'center' },
  diaryMonth: { color: c.textMuted, fontFamily: Type.mono, fontSize: 9, letterSpacing: 1 },
  diaryDay: { color: c.text, fontFamily: Type.display, fontSize: 26, lineHeight: 28 },
  diaryName: { color: c.text, fontFamily: Type.display, fontSize: 18 },
  diaryMeta: { color: c.textSecondary, fontFamily: Type.mono, fontSize: 10.5, letterSpacing: 0.3 },
});
