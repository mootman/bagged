import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PeakPoster } from '@/components/peak-poster';
import { RidgelineArt } from '@/components/ridgeline-art';
import { Tilt } from '@/components/tilt';
import { Body, Button, SectionHeader } from '@/components/ui';
import { APP_NAME } from '@/constants/brand';
import { BottomTabInset, Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { success } from '@/lib/haptics';
import { useStore } from '@/lib/store';
import type { SummitLog } from '@/lib/types';
import { useCountUp } from '@/lib/use-count-up';

const c = Colors.dark;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export default function PassportScreen() {
  const { width } = useWindowDimensions();
  const { logs, peaks, peakById, summitedIds, photoFor, profile, setProfile } = useStore();
  const [nameDraft, setNameDraft] = useState('');

  const pageW = Math.min(width, MaxContentWidth);
  const contentW = pageW - Spacing.three * 2;
  const favW = (contentW - Spacing.two * 3) / 4;
  const listCount = peaks.filter((p) => summitedIds.has(p.id)).length;
  const crew = new Set(logs.flatMap((l) => l.partners.map((p) => p.name))).size;
  const vertical = logs.reduce((s, l) => s + (peakById.get(l.peakId)?.elevationFt ?? 0), 0);

  const shownCount = useCountUp(listCount, { duration: 1100, delay: 300 });
  const shownSummits = useCountUp(logs.length, { duration: 900, delay: 450 });
  const shownCrew = useCountUp(crew, { duration: 900, delay: 600 });

  if (!profile.name) {
    const save = () => {
      if (!nameDraft.trim()) return;
      success();
      setProfile({ name: nameDraft.trim() });
    };
    return <Welcome name={nameDraft} setName={setNameDraft} onSave={save} width={pageW} />;
  }

  const sorted = logs.slice().sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.createdAt - a.createdAt);
  const hero = sorted[0] ? peakById.get(sorted[0].peakId) : peakById.get('co-longs-peak');
  const byYear = new Map<string, SummitLog[]>();
  for (const l of sorted) {
    const y = l.date?.slice(0, 4) ?? 'Undated';
    byYear.set(y, [...(byYear.get(y) ?? []), l]);
  }
  // West to east, like standing on the plains and looking at the whole range.
  const range = peaks.slice().sort((a, b) => a.lon - b.lon);

  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.six }}>
        {/* Hero: your latest summit, drawn from real terrain */}
        <Pressable onPress={() => hero && router.push(`/peak/${hero.id}`)}>
          <View style={{ height: 470 }}>
            {hero && <RidgelineArt peakId={hero.id} lit={logs.length > 0} width={width} height={470} count={40} top={0.2} bottom={0.86} amplitude={0.24} reveal />}
            <SafeAreaView edges={['top']} style={styles.heroTop}>
              <View style={styles.wordmark}>
                <View style={styles.dot} />
                <Text style={styles.wordmarkText}>{APP_NAME.toUpperCase()}</Text>
              </View>
              <Pressable onPress={() => router.push('/peaks')} style={styles.plus} hitSlop={8} accessibilityLabel="Sign a summit">
                <Text style={styles.plusText}>+</Text>
              </Pressable>
            </SafeAreaView>
            <View style={styles.heroBottom}>
              <Text style={styles.heroKicker}>{logs.length ? `LATEST · ${hero?.name.toUpperCase()}` : 'YOUR REGISTER'}</Text>
              <Text style={styles.heroName}>{profile.name}</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.page}>
          <View style={styles.bigCount}>
            <Text style={styles.bigNum}>{shownCount}</Text>
            <View style={{ paddingBottom: 12 }}>
              <Text style={styles.bigOf}>of {peaks.length}</Text>
              <Text style={styles.bigLabel}>COLORADO 14ERS</Text>
            </View>
          </View>
          <View style={styles.segments}>
            {range.map((p) => (
              <View key={p.id} style={[styles.seg, { backgroundColor: summitedIds.has(p.id) ? c.accent : 'rgba(237,230,214,0.1)' }]} />
            ))}
          </View>

          <View style={styles.statsRow}>
            <MiniStat value={String(shownSummits)} label="summits" />
            <MiniStat value={String(shownCrew)} label="partners" />
            <MiniStat value={`${Math.round(vertical / 1000)}k`} label="ft stacked" />
          </View>

          <SectionHeader title="The range" action="All peaks" onAction={() => router.push('/peaks')} />
        </View>

        {/* Every 14er, west to east. Scroll the whole range; your summits glow. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: 3 }}>
          {range.map((p) => {
            const lit = summitedIds.has(p.id);
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
          <SectionHeader title="Four favorites" />
          <View style={styles.favs}>
            {[0, 1, 2, 3].map((i) => {
              const peak = peakById.get(profile.favorites[i] ?? '');
              return peak ? (
                <Tilt key={i} width={favW} height={favW * 1.5} onPress={() => router.push(`/peak/${peak.id}`)}>
                  <PeakPoster peak={peak} width={favW} climbed={summitedIds.has(peak.id)} photoId={photoFor.get(peak.id)} />
                </Tilt>
              ) : (
                <Pressable key={i} onPress={() => router.push('/peaks')} style={[styles.emptyFav, { width: favW, height: favW * 1.5 }]}>
                  <Text style={{ color: c.textMuted, fontFamily: Type.display, fontSize: 26 }}>+</Text>
                </Pressable>
              );
            })}
          </View>

          {logs.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Your register is blank.</Text>
              <Body muted>We&apos;ll look through your photos for every summit you&apos;ve already stood on.</Body>
              <Button title="Find my summits" onPress={() => router.push('/scan')} />
            </View>
          ) : (
            <>
              <SectionHeader title="Diary" />
              {[...byYear.entries()].map(([year, items]) => (
                <View key={year}>
                  <Text style={styles.year}>{year}</Text>
                  {items.map((l) => (
                    <DiaryRow key={l.id} log={l} />
                  ))}
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: c.text, fontFamily: Type.display, fontSize: 28 }}>{value}</Text>
      <Text style={{ color: c.textMuted, fontFamily: Type.mono, fontSize: 10, letterSpacing: 1 }}>{label.toUpperCase()}</Text>
    </View>
  );
}

function DiaryRow({ log }: { log: SummitLog }) {
  const { peakById, photoFor } = useStore();
  const peak = peakById.get(log.peakId);
  if (!peak) return null;
  const [, m, d] = (log.date ?? '').split('-');
  return (
    <Pressable onPress={() => router.push(`/log/${log.id}`)} style={({ pressed }) => [styles.diaryRow, pressed && { opacity: 0.6 }]}>
      <View style={styles.diaryDate}>
        <Text style={styles.diaryMonth}>{m ? MONTHS[Number(m) - 1] : ''}</Text>
        <Text style={styles.diaryDay}>{d ? Number(d) : '?'}</Text>
      </View>
      <PeakPoster peak={peak} width={44} climbed photoId={log.photoId ?? photoFor.get(peak.id)} showTitle={false} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.diaryName}>{peak.name}</Text>
        <Text style={styles.diaryMeta} numberOfLines={1}>
          {peak.elevationFt.toLocaleString()} FT
          {log.partners.length ? `  ·  ${log.partners.map((p) => p.name).join(', ')}` : ''}
          {log.taggedBy ? `  ·  via ${log.taggedBy}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

function Welcome({ name, setName, onSave, width }: { name: string; setName: (s: string) => void; onSave: () => void; width: number }) {
  return (
    <SafeAreaView edges={[]} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.five }} keyboardShouldPersistTaps="handled">
        <View style={{ height: 520 }}>
          <RidgelineArt peakId="co-longs-peak" lit width={width} height={520} count={46} top={0.2} bottom={0.9} amplitude={0.26} reveal />
          <SafeAreaView edges={['top']} style={styles.heroTop}>
            <View style={styles.wordmark}>
              <View style={styles.dot} />
              <Text style={styles.wordmarkText}>{APP_NAME.toUpperCase()}</Text>
            </View>
          </SafeAreaView>
          <View style={styles.heroBottom}>
            <Text style={styles.heroKicker}>LONGS PEAK · 40.2550° N · REAL TERRAIN</Text>
          </View>
        </View>
        <View style={[styles.page, { gap: Spacing.three }]}>
          <Text style={styles.welcomeTitle}>
            Every summit <Text style={{ fontFamily: Type.displayItalic, color: c.accent }}>you&apos;ve ever</Text> stood on.
          </Text>
          <Body muted>We find them in your photos. Your friends add the rest when they tag you.</Body>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="What should your crew call you?"
            placeholderTextColor={c.textMuted}
            style={styles.input}
            onSubmitEditing={onSave}
            returnKeyType="go"
          />
          <Button title="Open my register" disabled={!name.trim()} onPress={onSave} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.three },
  heroTop: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  heroBottom: { position: 'absolute', left: Spacing.three, right: Spacing.three, bottom: Spacing.two },
  heroKicker: { color: c.accent, fontFamily: Type.mono, fontSize: 10, letterSpacing: 1.6 },
  heroName: { color: c.text, fontFamily: Type.display, fontSize: 58, lineHeight: 62, letterSpacing: -1 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: c.accent },
  wordmarkText: { color: c.text, fontFamily: Type.monoBold, fontSize: 12, letterSpacing: 4 },
  plus: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  plusText: { color: c.accentText, fontSize: 26, lineHeight: 28, fontFamily: Type.body, marginTop: -2 },
  bigCount: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: Spacing.three },
  bigNum: { color: c.accent, fontFamily: Type.displayBlack, fontSize: 96, lineHeight: 100, letterSpacing: -3 },
  bigOf: { color: c.text, fontFamily: Type.displayItalic, fontSize: 26 },
  bigLabel: { color: c.textMuted, fontFamily: Type.mono, fontSize: 10, letterSpacing: 1.4 },
  segments: { flexDirection: 'row', gap: 2 },
  seg: { flex: 1, height: 10, borderRadius: 1.5 },
  statsRow: { flexDirection: 'row', paddingVertical: Spacing.three, borderBottomWidth: 1, borderColor: c.border, marginTop: Spacing.two },
  rangeTile: { width: 62, height: 96, borderRadius: Radius.xs, overflow: 'hidden', borderWidth: 1, borderColor: c.border },
  rangeLabel: { width: 62, color: c.textMuted, fontFamily: Type.mono, fontSize: 7.5, textAlign: 'center', letterSpacing: 0.3 },
  favs: { flexDirection: 'row', gap: Spacing.two },
  emptyFav: { borderRadius: Radius.xs, borderWidth: 1, borderStyle: 'dashed', borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  empty: { gap: Spacing.three, paddingVertical: Spacing.four, borderTopWidth: 1, borderColor: c.border, marginTop: Spacing.three },
  emptyTitle: { color: c.text, fontFamily: Type.display, fontSize: 30 },
  year: { color: c.text, fontFamily: Type.displayItalic, fontSize: 28, marginTop: Spacing.two, marginBottom: 2 },
  diaryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  diaryDate: { width: 36, alignItems: 'center' },
  diaryMonth: { color: c.textMuted, fontFamily: Type.mono, fontSize: 9, letterSpacing: 1 },
  diaryDay: { color: c.text, fontFamily: Type.display, fontSize: 26, lineHeight: 28 },
  diaryName: { color: c.text, fontFamily: Type.display, fontSize: 18 },
  diaryMeta: { color: c.textSecondary, fontFamily: Type.mono, fontSize: 10.5, letterSpacing: 0.3 },
  welcomeTitle: { color: c.text, fontFamily: Type.display, fontSize: 40, lineHeight: 44, letterSpacing: -0.6 },
  input: { backgroundColor: c.backgroundElement, color: c.text, borderRadius: 99, paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, fontFamily: Type.body, borderWidth: 1, borderColor: c.border },
});
