import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { PassportMap } from '@/components/passport-map';
import { PeakArtwork, PeakPoster } from '@/components/peak-poster';
import { Body, Button, Card, Display, Label, ProgressBar, Screen, SectionHeader, Stats } from '@/components/ui';
import { APP_NAME, TAGLINE } from '@/constants/brand';
import { Colors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { success } from '@/lib/haptics';
import { useStore } from '@/lib/store';
import type { SummitLog } from '@/lib/types';

const c = Colors.dark;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export default function PassportScreen() {
  const { width } = useWindowDimensions();
  const { logs, peaks, peakById, summitedIds, photoFor, profile, setProfile } = useStore();
  const [nameDraft, setNameDraft] = useState('');

  const contentW = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const favW = (contentW - Spacing.two * 3) / 4;
  const listCount = peaks.filter((p) => summitedIds.has(p.id)).length;
  const crew = new Set(logs.flatMap((l) => l.partners.map((p) => p.name))).size;

  if (!profile.name) {
    const save = () => {
      if (!nameDraft.trim()) return;
      success();
      setProfile({ name: nameDraft.trim() });
    };
    return <Welcome name={nameDraft} setName={setNameDraft} onSave={save} contentW={contentW} />;
  }

  const sorted = logs.slice().sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.createdAt - a.createdAt);
  const byYear = new Map<string, SummitLog[]>();
  for (const l of sorted) {
    const y = l.date?.slice(0, 4) ?? 'Undated';
    byYear.set(y, [...(byYear.get(y) ?? []), l]);
  }

  return (
    <Screen tabs>
      <View style={styles.topbar}>
        <View style={styles.wordmark}>
          <View style={styles.dot} />
          <Text style={styles.wordmarkText}>{APP_NAME.toUpperCase()}</Text>
        </View>
        <Pressable onPress={() => router.push('/peaks')} style={styles.plus} hitSlop={8}>
          <Text style={styles.plusText}>+</Text>
        </Pressable>
      </View>

      <View style={{ gap: Spacing.one }}>
        <Display size={38}>{profile.name}</Display>
        <Body muted>{logs.length ? `Since ${sorted[sorted.length - 1]?.date?.slice(0, 4) ?? 'day one'}` : 'Fresh passport'}</Body>
      </View>

      <Stats
        items={[
          { value: String(logs.length), label: 'Summits' },
          { value: `${listCount}`, label: '14ers', color: c.accent },
          { value: String(crew), label: 'Partners' },
        ]}
      />

      <SectionHeader title="Four favorites" />
      <View style={styles.favs}>
        {[0, 1, 2, 3].map((i) => {
          const peak = peakById.get(profile.favorites[i] ?? '');
          return peak ? (
            <Pressable key={i} onPress={() => router.push(`/peak/${peak.id}`)}>
              <PeakPoster peak={peak} width={favW} climbed={summitedIds.has(peak.id)} photoId={photoFor.get(peak.id)} />
            </Pressable>
          ) : (
            <Pressable key={i} onPress={() => router.push('/peaks')} style={[styles.emptyFav, { width: favW, height: favW * 1.5 }]}>
              <Text style={{ color: c.textMuted, fontSize: 22 }}>+</Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={{ gap: Spacing.three, marginTop: Spacing.two }}>
        <View style={styles.listHead}>
          <View style={{ gap: 2 }}>
            <Label>List</Label>
            <Text style={styles.listName}>Colorado 14ers</Text>
          </View>
          <Text style={styles.listCount}>
            <Text style={{ color: listCount === peaks.length ? c.gold : c.accent }}>{listCount}</Text>
            <Text style={{ color: c.textMuted }}> / {peaks.length}</Text>
          </Text>
        </View>
        <ProgressBar value={listCount} total={peaks.length} color={listCount === peaks.length ? c.gold : c.accent} />
        <View style={{ alignItems: 'center' }}>
          <PassportMap peaks={peaks} summited={summitedIds} colors={c} width={contentW - Spacing.three * 2} maxHeight={300} showFrame={false} />
        </View>
      </Card>

      {logs.length === 0 ? (
        <Card style={{ gap: Spacing.three, marginTop: Spacing.two }}>
          <Display size={22}>Your register is empty.</Display>
          <Body muted>Let&apos;s fix that. We&apos;ll look through your photos for every summit you&apos;ve already stood on.</Body>
          <Button title="Find my summits" onPress={() => router.push('/scan')} />
        </Card>
      ) : (
        <>
          <SectionHeader title="Recently signed" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
            {sorted.slice(0, 10).map((l) => {
              const peak = peakById.get(l.peakId);
              return peak ? (
                <Pressable key={l.id} onPress={() => router.push(`/log/${l.id}`)}>
                  <PeakPoster peak={peak} width={104} climbed photoId={l.photoId ?? photoFor.get(peak.id)} />
                </Pressable>
              ) : null;
            })}
          </ScrollView>

          <SectionHeader title="Diary" />
          {[...byYear.entries()].map(([year, items]) => (
            <View key={year} style={{ gap: 0 }}>
              <Text style={styles.year}>{year}</Text>
              {items.map((l) => (
                <DiaryRow key={l.id} log={l} />
              ))}
            </View>
          ))}
        </>
      )}
      <Body muted style={{ textAlign: 'center', fontSize: 12, marginTop: Spacing.four }}>
        {TAGLINE}
      </Body>
    </Screen>
  );
}

function DiaryRow({ log }: { log: SummitLog }) {
  const { peakById, photoFor } = useStore();
  const peak = peakById.get(log.peakId);
  if (!peak) return null;
  const [, m, d] = (log.date ?? '').split('-');
  return (
    <Pressable onPress={() => router.push(`/log/${log.id}`)} style={({ pressed }) => [styles.diaryRow, pressed && { opacity: 0.7 }]}>
      <View style={styles.diaryDate}>
        <Text style={styles.diaryMonth}>{m ? MONTHS[Number(m) - 1] : ''}</Text>
        <Text style={styles.diaryDay}>{d ? Number(d) : '?'}</Text>
      </View>
      <PeakPoster peak={peak} width={40} climbed photoId={log.photoId ?? photoFor.get(peak.id)} showTitle={false} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.diaryName}>{peak.name}</Text>
        <Text style={styles.diaryMeta} numberOfLines={1}>
          {peak.elevationFt.toLocaleString()} ft
          {log.partners.length ? `  ·  with ${log.partners.map((p) => p.name).join(', ')}` : ''}
          {log.taggedBy ? `  ·  tagged by ${log.taggedBy}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

function Welcome({ name, setName, onSave, contentW }: { name: string; setName: (s: string) => void; onSave: () => void; contentW: number }) {
  const { peaks } = useStore();
  const tileW = (contentW - Spacing.two * 2) / 3;
  const featured = ['co-longs-peak', 'co-maroon-peak', 'co-mount-sneffels', 'co-capitol-peak', 'co-quandary-peak', 'co-wetterhorn-peak']
    .map((id) => peaks.find((p) => p.id === id)!)
    .filter(Boolean);
  return (
    <Screen tabs>
      <View style={[styles.wordmark, { marginTop: Spacing.three }]}>
        <View style={styles.dot} />
        <Text style={styles.wordmarkText}>{APP_NAME.toUpperCase()}</Text>
      </View>
      <View style={styles.collage}>
        {featured.map((p, i) => (
          <View key={p.id} style={[styles.collageTile, { width: tileW, height: tileW * 1.5, marginTop: i % 3 === 1 ? 18 : 0 }]}>
            <PeakArtwork id={p.id} />
          </View>
        ))}
      </View>
      <Display size={34}>Every summit you&apos;ve ever stood on.</Display>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.accent },
  wordmarkText: { color: c.text, fontSize: 13, fontWeight: '900', letterSpacing: 3 },
  plus: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  plusText: { color: c.accentText, fontSize: 24, fontWeight: '600', lineHeight: 26, marginTop: -2 },
  favs: { flexDirection: 'row', gap: Spacing.two },
  emptyFav: {
    borderRadius: Radius.xs,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  listName: { color: c.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  listCount: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  year: { color: c.text, fontSize: 22, fontWeight: '800', marginTop: Spacing.two, marginBottom: Spacing.one },
  diaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.border,
  },
  diaryDate: { width: 34, alignItems: 'center' },
  diaryMonth: { color: c.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  diaryDay: { color: c.text, fontSize: 22, fontWeight: '800', lineHeight: 24 },
  diaryName: { color: c.text, fontSize: 16, fontWeight: '700' },
  diaryMeta: { color: c.textSecondary, fontSize: 13 },
  collage: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two, marginBottom: Spacing.two },
  collageTile: { borderRadius: Radius.xs, overflow: 'hidden' },
  input: {
    backgroundColor: c.backgroundElement,
    color: c.text,
    borderRadius: Radius.md,
    padding: Spacing.three,
    fontSize: 16,
  },
});
