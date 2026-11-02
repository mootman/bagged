import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

import { PassportMap } from '@/components/passport-map';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, ProgressBar, Screen, SectionTitle } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, useStore } from '@/lib/store';

export default function PassportScreen() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const { logs, peaks, peakById, summitedIds, profile, setProfile } = useStore();
  const [nameDraft, setNameDraft] = useState('');

  const mapWidth = Math.min(width, MaxContentWidth) - Spacing.three * 2 - Spacing.three * 2;
  const listCount = peaks.filter((p) => summitedIds.has(p.id)).length;
  const totalFt = logs.reduce((sum, l) => sum + (peakById.get(l.peakId)?.elevationFt ?? 0), 0);

  if (!profile.name) {
    return (
      <Screen tabs>
        <View style={styles.hero}>
          <ThemedText type="title">Bagged</ThemedText>
          <ThemedText themeColor="textSecondary">
            Your summit passport. It fills itself in from your photos, and your friends fill it in when they tag you.
          </ThemedText>
        </View>
        <Card>
          <ThemedText type="smallBold">What should your crew call you?</ThemedText>
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="First name"
            placeholderTextColor={t.textSecondary}
            autoFocus
            style={[styles.input, { color: t.text, borderColor: t.border }]}
            onSubmitEditing={() => nameDraft.trim() && setProfile({ name: nameDraft.trim() })}
          />
          <Button title="Start my passport" disabled={!nameDraft.trim()} onPress={() => setProfile({ name: nameDraft.trim() })} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen tabs>
      <View style={styles.header}>
        <ThemedText type="subtitle">{profile.name}</ThemedText>
        <ThemedText themeColor="textSecondary">
          {logs.length} {logs.length === 1 ? 'summit' : 'summits'} logged
        </ThemedText>
      </View>

      <Card style={{ alignItems: 'center' }}>
        <PassportMap peaks={peaks} summited={summitedIds} colors={t} width={mapWidth} />
      </Card>

      <Card>
        <View style={styles.row}>
          <ThemedText type="smallBold">Colorado 14ers</ThemedText>
          <ThemedText type="smallBold" style={{ color: t.accent }}>
            {listCount}/{peaks.length}
          </ThemedText>
        </View>
        <ProgressBar value={listCount} total={peaks.length} />
        <ThemedText type="small" themeColor="textSecondary">
          {totalFt.toLocaleString()} ft of summits stacked up
        </ThemedText>
      </Card>

      <SectionTitle>Four favorites</SectionTitle>
      <View style={styles.favs}>
        {[0, 1, 2, 3].map((i) => {
          const peak = peakById.get(profile.favorites[i] ?? '');
          return (
            <Pressable
              key={i}
              onPress={() => (peak ? router.push(`/peak/${peak.id}`) : router.push('/peaks'))}
              style={[styles.fav, { borderColor: peak ? t.accent : t.border, backgroundColor: t.backgroundElement }]}>
              <ThemedText type="smallBold" numberOfLines={2} style={{ textAlign: 'center', color: peak ? t.text : t.textSecondary }}>
                {peak ? peak.name.replace(/^Mount /, 'Mt. ') : '+'}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {logs.length === 0 ? (
        <Card>
          <ThemedText type="smallBold">Your map is empty</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Scan your camera roll and we&apos;ll find the summits you&apos;ve already done.
          </ThemedText>
          <Button title="Find my summits" onPress={() => router.push('/scan')} />
        </Card>
      ) : (
        <>
          <SectionTitle>Diary</SectionTitle>
          {logs
            .slice()
            .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.createdAt - a.createdAt)
            .map((log) => {
              const peak = peakById.get(log.peakId);
              return (
                <Pressable key={log.id} onPress={() => router.push(`/log/${log.id}`)}>
                  <Card style={styles.logRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="smallBold">{peak?.name ?? log.peakId}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatDate(log.date)}
                        {log.partners.length ? ` · with ${log.partners.map((p) => p.name).join(', ')}` : ''}
                        {log.taggedBy ? ` · tagged by ${log.taggedBy}` : ''}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      {peak ? `${peak.elevationFt.toLocaleString()}'` : ''}
                    </ThemedText>
                  </Card>
                </Pressable>
              );
            })}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: Spacing.two, marginTop: Spacing.five },
  header: { gap: Spacing.one },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  input: { borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.three, fontSize: 16 },
  favs: { flexDirection: 'row', gap: Spacing.two },
  fav: {
    flex: 1,
    aspectRatio: 0.75,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.one,
  },
  logRow: { flexDirection: 'row', alignItems: 'center' },
});
