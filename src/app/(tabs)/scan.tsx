import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { PeakPoster } from '@/components/peak-poster';
import { Body, Button, Card, Display, Label, Screen } from '@/components/ui';
import { APP_NAME } from '@/constants/brand';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { detectSummits, PHOTO_OPTIONS, TRACK_OPTIONS } from '@/lib/detect';
import { parseGpx } from '@/lib/gpx';
import { success, tap } from '@/lib/haptics';
import { ensurePhotoPermission, scanPhotoLocations, type ScanProgress } from '@/lib/scan-photos';
import { candidateKey, formatDate, useStore } from '@/lib/store';
import type { SummitCandidate } from '@/lib/types';

const c = Colors.dark;
type Found = SummitCandidate & { source: 'photo' | 'gpx' };

export default function ScanScreen() {
  const { width } = useWindowDimensions();
  const { peaks, peakById, logs, dismissed, addLogs, dismissCandidate } = useStore();
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [found, setFound] = useState<Found[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const signal = useRef({ cancelled: false });

  const contentW = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const posterW = (contentW - Spacing.two * 2) / 3;

  const logged = useMemo(() => new Set(logs.map((l) => candidateKey(l.peakId, l.date))), [logs]);
  const fresh = found.filter((f) => {
    const k = candidateKey(f.peakId, f.date);
    return !logged.has(k) && !dismissed.includes(k);
  });

  function show(cands: Found[]) {
    setFound((prev) => {
      const map = new Map(prev.map((f) => [candidateKey(f.peakId, f.date), f]));
      for (const f of cands) map.set(candidateKey(f.peakId, f.date), f);
      return [...map.values()].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
    });
    // High-confidence finds start selected.
    setSelected((prev) => {
      const next = new Set(prev);
      for (const f of cands) if (f.confidence === 'high') next.add(candidateKey(f.peakId, f.date));
      return next;
    });
    if (cands.length) success();
  }

  async function scanPhotos() {
    const perm = await ensurePhotoPermission();
    if (!perm.granted) {
      Alert.alert('Photo access needed', `Allow photo access in Settings so ${APP_NAME} can find your summit photos.`);
      return;
    }
    signal.current = { cancelled: false };
    setProgress({ scanned: 0, located: 0, done: false });
    try {
      const points = await scanPhotoLocations(setProgress, signal.current);
      show(detectSummits(points, peaks, PHOTO_OPTIONS).map((f) => ({ ...f, source: 'photo' })));
      if (perm.limited) {
        Alert.alert('Limited photo access', `${APP_NAME} can only see the photos you picked. Allow full access to find every summit.`);
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
        const cands = detectSummits(parseGpx(xml), peaks, TRACK_OPTIONS).map((f) => ({ ...f, source: 'gpx' as const }));
        total += cands.length;
        show(cands);
      } catch {
        Alert.alert('Could not read file', `${asset.name} doesn't look like a GPX track.`);
      }
    }
    if (total === 0) Alert.alert('No summits found', 'None of those tracks reached a 14er summit.');
  }

  function toggle(k: string) {
    tap();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function save() {
    const chosen = fresh.filter((f) => selected.has(candidateKey(f.peakId, f.date)));
    addLogs(
      chosen.map((f) => ({
        peakId: f.peakId,
        date: f.date,
        partners: [],
        note: '',
        source: f.source,
        photoId: f.source === 'photo' ? f.sourceIds[0] : undefined,
      })),
    );
    fresh.filter((f) => !selected.has(candidateKey(f.peakId, f.date))).forEach((f) => dismissCandidate(candidateKey(f.peakId, f.date)));
    success();
    setFound([]);
    setSelected(new Set());
    setProgress(null);
    router.navigate('/');
  }

  const scanning = progress != null && !progress.done;
  const chosenCount = fresh.filter((f) => selected.has(candidateKey(f.peakId, f.date))).length;

  if (fresh.length > 0) {
    return (
      <Screen tabs>
        <View style={{ gap: 4 }}>
          <Label color={c.accent}>Found in your history</Label>
          <Display size={40}>
            {fresh.length} {fresh.length === 1 ? 'summit' : 'summits'}
          </Display>
          <Body muted>Tap to deselect anything that wasn&apos;t a summit.</Body>
        </View>
        <View style={styles.grid}>
          {fresh.map((f) => {
            const k = candidateKey(f.peakId, f.date);
            const on = selected.has(k);
            const peak = peakById.get(f.peakId);
            if (!peak) return null;
            return (
              <Pressable key={k} onPress={() => toggle(k)} style={{ width: posterW, gap: 4 }}>
                <View>
                  <PeakPoster peak={peak} width={posterW} climbed={on} photoId={f.source === 'photo' ? f.sourceIds[0] : undefined} />
                  {f.confidence === 'medium' && (
                    <View style={styles.flag}>
                      <Text style={styles.flagText}>Check</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.candDate}>{formatDate(f.date)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Button title={`Sign ${chosenCount} into my register`} disabled={chosenCount === 0} onPress={save} />
        <Button title="Start over" variant="ghost" onPress={() => { setFound([]); setProgress(null); }} />
      </Screen>
    );
  }

  return (
    <Screen tabs>
      <View style={{ gap: Spacing.two, marginTop: Spacing.three }}>
        <Label color={c.accent}>Backfill</Label>
        <Display size={36}>Find every summit you&apos;ve already done.</Display>
        <Body muted>
          Your phone saves where each photo was taken. We check them against the top of every 14er. Nothing leaves your phone.
        </Body>
      </View>

      {scanning ? (
        <Card style={{ alignItems: 'center', paddingVertical: Spacing.five, gap: Spacing.three }}>
          <ActivityIndicator color={c.accent} size="large" />
          <Display size={44}>{progress.scanned.toLocaleString()}</Display>
          <Label>photos checked · {progress.located.toLocaleString()} with location</Label>
          <Button title="Stop" variant="secondary" onPress={() => (signal.current.cancelled = true)} style={{ alignSelf: 'stretch' }} />
        </Card>
      ) : (
        <View style={{ gap: Spacing.two }}>
          {Platform.OS !== 'web' && <Button title={progress?.done ? 'Scan again' : 'Scan my camera roll'} onPress={scanPhotos} />}
          <Button title="Import GPX tracks" variant="secondary" onPress={importGpx} />
          <Body muted style={{ fontSize: 13, textAlign: 'center' }}>Works with Garmin, Gaia, CalTopo and Strava exports.</Body>
        </View>
      )}

      {progress?.done && (
        <Card>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>
            {progress.located === 0 ? 'None of your photos have a location' : 'No new 14er summits in your photos'}
          </Text>
          <Body muted>
            {progress.located === 0
              ? 'Turn on Location for the Camera app so future climbs get picked up. You can still log any peak by hand.'
              : 'Everything we found is already signed. Log anything else by hand from the Peaks tab.'}
          </Body>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  candDate: { color: c.textSecondary, fontSize: 12, fontWeight: '600' },
  flag: { position: 'absolute', left: 6, top: 6, backgroundColor: c.gold, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  flagText: { color: '#1B1B1B', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
});
