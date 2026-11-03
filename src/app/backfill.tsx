import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { PeakImage } from '@/components/peak-photo';
import { Button } from '@/components/ui';
import { Colors, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { success, tap } from '@/lib/haptics';
import { badgesFor, newlyEarned } from '@/lib/badges';
import { isWinter, useStore, type NewAscent } from '@/lib/store';

const c = Colors.dark;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
type Draft = { date: string; winter: boolean };

/**
 * First run: tick off every 14er you've already climbed, as many times as you've climbed it.
 * Dates are optional. This is what makes the app worth opening on day one.
 */
export default function BackfillScreen() {
  const { first } = useLocalSearchParams<{ first?: string }>();
  const { peaks, peakById, setProfile, addLogs, summitedIds, logs, notify } = useStore();
  const [q, setQ] = useState('');
  const [drafts, setDrafts] = useState<Record<string, Draft[]>>({});
  const [open, setOpen] = useState<string | null>(null);

  const list = useMemo(
    () =>
      peaks
        .filter((p) => !q || `${p.name} ${p.range}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.elevationFt - a.elevationFt),
    [peaks, q],
  );
  const total = Object.values(drafts).reduce((n, d) => n + d.length, 0);
  const peakCount = Object.values(drafts).filter((d) => d.length).length;
  const bad = Object.values(drafts).flat().some((d) => d.date && !DATE_RE.test(d.date));

  const setFor = (id: string, next: Draft[]) => setDrafts((s) => ({ ...s, [id]: next }));
  const add = (id: string) => {
    tap();
    setFor(id, [...(drafts[id] ?? []), { date: '', winter: false }]);
    setOpen(id);
  };

  function finish(skip = false) {
    if (!skip && total) {
      const rows: NewAscent[] = Object.entries(drafts).flatMap(([peakId, ds]) =>
        ds.map((d) => ({ peakId, date: d.date && DATE_RE.test(d.date) ? d.date : null, winter: d.winter, source: 'manual' as const })),
      );
      const created = addLogs(rows);
      success();
      const now = Date.now();
      for (const b of newlyEarned(badgesFor(logs, peaks, peakById), badgesFor([...logs, ...created], peaks, peakById))) notify({ kind: 'badge', at: now, text: b.name });
      if (first) {
        // Demo: a climber with overlapping peaks finds you. Real version: suggested follows.
        notify({ kind: 'follow', at: now + 1, userId: 'u_jess' });
      }
    }
    setProfile({ onboarded: true });
    if (first) router.replace('/you');
    else router.back();
  }

  return (
    <SafeAreaView edges={first ? ['top', 'bottom'] : ['bottom']} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page}>
        <View style={{ gap: 6 }}>
          <Text style={styles.title}>Which 14ers have you climbed?</Text>
          <Text style={styles.sub}>Tap a peak to add it, and add it again for every time you went back. Dates are optional.</Text>
        </View>
        <TextInput value={q} onChangeText={setQ} placeholder="Search peaks or ranges" placeholderTextColor={c.textMuted} style={styles.search} />

        {list.map((p) => {
          const ds = drafts[p.id] ?? [];
          const expanded = open === p.id && ds.length > 0;
          return (
            <View key={p.id} style={[styles.row, ds.length > 0 && styles.rowOn]}>
              <Pressable onPress={() => (ds.length ? setOpen(expanded ? null : p.id) : add(p.id))} style={styles.rowHead}>
                <PeakImage peakId={p.id} width={56} height={56} radius={Radius.sm} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.meta}>
                    {p.elevationFt.toLocaleString()} ft, {p.range}
                    {summitedIds.has(p.id) ? ', already logged' : ''}
                  </Text>
                </View>
                {ds.length ? (
                  <View style={styles.count}>
                    <Text style={styles.countText}>{ds.length}x</Text>
                  </View>
                ) : (
                  <View style={styles.plus}>
                    <Icon name="plus" size={20} color={c.text} weight={2.2} />
                  </View>
                )}
              </Pressable>

              {expanded && (
                <View style={styles.drafts}>
                  {ds.map((d, i) => (
                    <View key={i} style={styles.draft}>
                      <Text style={styles.draftN}>{i + 1}</Text>
                      <TextInput
                        value={d.date}
                        onChangeText={(t) => setFor(p.id, ds.map((x, j) => (j === i ? { date: t, winter: DATE_RE.test(t) ? isWinter(t) : x.winter } : x)))}
                        placeholder="Date (optional)"
                        placeholderTextColor={c.textMuted}
                        autoCapitalize="none"
                        style={[styles.dateInput, d.date && !DATE_RE.test(d.date) ? { borderColor: c.danger, borderWidth: 1 } : null]}
                      />
                      <Pressable
                        onPress={() => {
                          tap();
                          setFor(p.id, ds.map((x, j) => (j === i ? { ...x, winter: !x.winter } : x)));
                        }}
                        accessibilityLabel="Winter ascent"
                        style={[styles.snow, d.winter && styles.snowOn]}>
                        <Icon name="snow" size={18} color={d.winter ? '#fff' : c.text} weight={2} />
                      </Pressable>
                      <Pressable onPress={() => setFor(p.id, ds.filter((_, j) => j !== i))} hitSlop={8} accessibilityLabel="Remove">
                        <Text style={styles.remove}>Remove</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable onPress={() => add(p.id)} hitSlop={6}>
                    <Text style={styles.again}>Add another time I climbed it</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        {bad && <Text style={styles.warn}>Dates go as YYYY-MM-DD, or leave them blank.</Text>}
        <Button
          title={total ? `Add ${total} ${total === 1 ? 'ascent' : 'ascents'} of ${peakCount} ${peakCount === 1 ? 'peak' : 'peaks'}` : "I haven't climbed one yet"}
          disabled={bad}
          onPress={() => finish(!total)}
        />
        {total > 0 && (
          <Pressable onPress={() => finish(true)} hitSlop={8} style={{ alignSelf: 'center' }}>
            <Text style={styles.skip}>Skip for now</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { padding: Spacing.three, gap: 10, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingBottom: 160 },
  title: { color: c.text, fontFamily: Type.display, fontSize: 32, lineHeight: 38 },
  sub: { color: c.textSecondary, fontFamily: Type.body, fontSize: 16, lineHeight: 22 },
  search: { backgroundColor: c.backgroundElement, color: c.text, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 99, fontSize: 16, fontFamily: Type.body, marginVertical: 6 },
  row: { borderRadius: Radius.md, backgroundColor: c.background },
  rowOn: { backgroundColor: '#E8EFEA' },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8 },
  name: { color: c.text, fontFamily: Type.bodyBold, fontSize: 17 },
  meta: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14 },
  plus: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.backgroundElement, alignItems: 'center', justifyContent: 'center' },
  count: { minWidth: 40, height: 40, borderRadius: 20, paddingHorizontal: 10, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  countText: { color: c.accentText, fontFamily: Type.bodyBold, fontSize: 15 },
  drafts: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  draft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  draftN: { width: 16, color: c.textSecondary, fontFamily: Type.bodyBold, fontSize: 14, textAlign: 'center' },
  dateInput: { flex: 1, backgroundColor: c.background, color: c.text, borderRadius: Radius.sm, paddingHorizontal: 12, minHeight: 42, fontFamily: Type.body, fontSize: 15 },
  snow: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.background, alignItems: 'center', justifyContent: 'center' },
  snowOn: { backgroundColor: '#3E6A8A' },
  remove: { color: c.textSecondary, fontFamily: Type.bodyMedium, fontSize: 13 },
  again: { color: c.accent, fontFamily: Type.bodyBold, fontSize: 15, marginTop: 4, marginLeft: 24 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: Spacing.three, paddingBottom: Spacing.four, gap: 10, backgroundColor: 'rgba(251,250,247,0.96)' },
  warn: { color: c.danger, fontFamily: Type.bodyMedium, fontSize: 14, textAlign: 'center' },
  skip: { color: c.textSecondary, fontFamily: Type.bodyBold, fontSize: 15 },
});
