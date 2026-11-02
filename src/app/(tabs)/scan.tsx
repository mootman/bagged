import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, Screen, SectionTitle } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { detectSummits, PHOTO_OPTIONS, TRACK_OPTIONS } from '@/lib/detect';
import { parseGpx } from '@/lib/gpx';
import { ensurePhotoPermission, photoUri, scanPhotoLocations, type ScanProgress } from '@/lib/scan-photos';
import { candidateKey, formatDate, useStore } from '@/lib/store';
import type { SummitCandidate } from '@/lib/types';

type Found = SummitCandidate & { source: 'photo' | 'gpx' };

export default function ScanScreen() {
  const t = useTheme();
  const { peaks, peakById, logs, dismissed, addLogs, dismissCandidate } = useStore();
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [found, setFound] = useState<Found[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const signal = useRef({ cancelled: false });

  const logged = useMemo(() => new Set(logs.map((l) => candidateKey(l.peakId, l.date))), [logs]);
  const fresh = found.filter((c) => {
    const k = candidateKey(c.peakId, c.date);
    return !logged.has(k) && !dismissed.includes(k);
  });

  function show(cands: Found[]) {
    setFound((prev) => {
      const map = new Map(prev.map((c) => [candidateKey(c.peakId, c.date), c]));
      for (const c of cands) map.set(candidateKey(c.peakId, c.date), c);
      return [...map.values()].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    });
    // Preselect high-confidence finds.
    setSelected((prev) => {
      const next = new Set(prev);
      for (const c of cands) if (c.confidence === 'high') next.add(candidateKey(c.peakId, c.date));
      return next;
    });
  }

  async function scanPhotos() {
    const perm = await ensurePhotoPermission();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Allow photo access in Settings so Bagged can find your summit photos.');
      return;
    }
    signal.current = { cancelled: false };
    setProgress({ scanned: 0, located: 0, done: false });
    try {
      const points = await scanPhotoLocations(setProgress, signal.current);
      show(detectSummits(points, peaks, PHOTO_OPTIONS).map((c) => ({ ...c, source: 'photo' })));
      if (perm.limited) {
        Alert.alert('Limited photo access', 'Bagged can only see the photos you picked. Allow full access to find every summit.');
      }
    } catch (e) {
      Alert.alert('Scan failed', String(e));
      setProgress(null);
    }
  }

  async function importGpx() {
    const res = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, type: '*/*' });
    if (res.canceled) return;
    let total = 0;
    for (const asset of res.assets) {
      try {
        const xml = Platform.OS === 'web' && asset.file ? await asset.file.text() : await new File(asset.uri).text();
        const cands = detectSummits(parseGpx(xml), peaks, TRACK_OPTIONS).map((c) => ({ ...c, source: 'gpx' as const }));
        total += cands.length;
        show(cands);
      } catch {
        Alert.alert('Could not read file', `${asset.name} doesn't look like a GPX track.`);
      }
    }
    if (total === 0) Alert.alert('No summits found', 'None of those tracks reached a 14er summit.');
  }

  function toggle(k: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function save() {
    const chosen = fresh.filter((c) => selected.has(candidateKey(c.peakId, c.date)));
    addLogs(chosen.map((c) => ({ peakId: c.peakId, date: c.date, partners: [], note: '', source: c.source })));
    fresh
      .filter((c) => !selected.has(candidateKey(c.peakId, c.date)))
      .forEach((c) => dismissCandidate(candidateKey(c.peakId, c.date)));
    setFound([]);
    setSelected(new Set());
    setProgress(null);
    router.navigate('/');
  }

  const scanning = progress != null && !progress.done;
  const chosenCount = fresh.filter((c) => selected.has(candidateKey(c.peakId, c.date))).length;

  return (
    <Screen tabs>
      <ThemedText type="subtitle">Find your summits</ThemedText>
      <ThemedText themeColor="textSecondary">
        Most phone photos save where they were taken. We check each one against the summit of every 14er. Nothing
        leaves your phone.
      </ThemedText>

      {Platform.OS !== 'web' && (
        <Card>
          {scanning ? (
            <>
              <ThemedText type="smallBold">
                Checked {progress.scanned.toLocaleString()} photos · {progress.located.toLocaleString()} with location
              </ThemedText>
              <ActivityIndicator color={t.accent} />
              <Button title="Stop" variant="secondary" onPress={() => (signal.current.cancelled = true)} />
            </>
          ) : (
            <Button title={progress?.done ? 'Scan again' : 'Scan my camera roll'} onPress={scanPhotos} />
          )}
          {progress?.done && progress.located === 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              None of your photos have a location. Turn on Location for the Camera app so future climbs get picked up.
            </ThemedText>
          )}
        </Card>
      )}

      <Button title="Import GPX files (Garmin, Gaia, CalTopo)" variant="secondary" onPress={importGpx} />

      {fresh.length > 0 && (
        <>
          <SectionTitle>
            Found {fresh.length} {fresh.length === 1 ? 'summit' : 'summits'}
          </SectionTitle>
          {fresh.map((c) => {
            const k = candidateKey(c.peakId, c.date);
            const on = selected.has(k);
            const peak = peakById.get(c.peakId);
            return (
              <Pressable key={k} onPress={() => toggle(k)}>
                <Card style={[styles.cand, { borderColor: on ? t.accent : 'transparent' }]}>
                  {c.source === 'photo' && c.sourceIds[0] ? <Thumb assetId={c.sourceIds[0]} /> : <View style={[styles.thumb, { backgroundColor: t.backgroundSelected }]} />}
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText type="smallBold">{peak?.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatDate(c.date)} · {c.source === 'photo' ? `${c.pointCount} photo${c.pointCount > 1 ? 's' : ''}` : 'GPS track'} ·{' '}
                      {c.bestDistanceM} m from top
                    </ThemedText>
                    {c.confidence === 'medium' && (
                      <ThemedText type="small" style={{ color: t.accent }}>
                        Close but not on top. Double check.
                      </ThemedText>
                    )}
                  </View>
                  <View style={[styles.check, { borderColor: on ? t.accent : t.border, backgroundColor: on ? t.accent : 'transparent' }]}>
                    {on && <ThemedText style={{ color: t.accentText, fontSize: 14, lineHeight: 16 }}>✓</ThemedText>}
                  </View>
                </Card>
              </Pressable>
            );
          })}
          <Button title={`Add ${chosenCount} to my passport`} disabled={chosenCount === 0} onPress={save} />
        </>
      )}

      {progress?.done && fresh.length === 0 && found.length === 0 && progress.located > 0 && (
        <Card>
          <ThemedText type="smallBold">No 14er summits in your photos yet</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Log one by hand from the Peaks tab, or import a GPX track.
          </ThemedText>
        </Card>
      )}
    </Screen>
  );
}

function Thumb({ assetId }: { assetId: string }) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    photoUri(assetId).then((u) => live && setUri(u));
    return () => {
      live = false;
    };
  }, [assetId]);
  return <Image source={uri ? { uri } : undefined} style={styles.thumb} contentFit="cover" />;
}

const styles = StyleSheet.create({
  cand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderWidth: 1.5 },
  thumb: { width: 56, height: 56, borderRadius: Radius.sm },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
