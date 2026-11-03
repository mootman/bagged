import { Linking, StyleSheet, Text, View } from 'react-native';

import { Body, Screen } from '@/components/ui';
import { Colors, Type } from '@/constants/theme';
import { PEAK_PHOTOS } from '@/data/peak-photos.generated';
import { useStore } from '@/lib/store';

const c = Colors.dark;

const LICENSE_URL: Record<string, string> = {
  'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/',
  'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
  'CC BY-SA 2.5': 'https://creativecommons.org/licenses/by-sa/2.5/',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  CC0: 'https://creativecommons.org/publicdomain/zero/1.0/',
};

/** Every bundled photo, who took it, and its license. The licenses ask for this. */
export default function CreditsScreen() {
  const { peakById } = useStore();
  const rows = Object.entries(PEAK_PHOTOS).sort(([a], [b]) => a.localeCompare(b));
  return (
    <Screen>
      <Body muted>
        Peak photos come from Wikimedia Commons. They are resized and cropped to fit the app. Tap a photo&apos;s name to see the original, or a
        license to read it.
      </Body>
      {rows.map(([id, photos]) => (
        <View key={id} style={{ gap: 6 }}>
          <Text style={styles.peak}>{peakById.get(id)?.name ?? id}</Text>
          {photos.map((p) => (
            <Text key={p.source} style={styles.row}>
              <Text style={styles.link} onPress={() => Linking.openURL(p.source)}>
                {decodeURIComponent(p.source.split('File:')[1] ?? 'Photo').replace(/_/g, ' ')}
              </Text>
              {' by '}
              {p.author}
              {', '}
              {LICENSE_URL[p.license] ? (
                <Text style={styles.link} onPress={() => Linking.openURL(LICENSE_URL[p.license])}>
                  {p.license}
                </Text>
              ) : (
                p.license
              )}
            </Text>
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  peak: { color: c.text, fontFamily: Type.display, fontSize: 20, marginTop: 8 },
  row: { color: c.textSecondary, fontFamily: Type.body, fontSize: 14, lineHeight: 20 },
  link: { color: c.accent, fontFamily: Type.bodyBold },
});
