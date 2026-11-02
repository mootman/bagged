import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Add partner names as chips. */
export function PartnerEditor({ names, onChange }: { names: string[]; onChange: (n: string[]) => void }) {
  const t = useTheme();
  const [draft, setDraft] = useState('');

  const add = () => {
    const n = draft.trim();
    if (n && !names.includes(n) && names.length < 20) onChange([...names, n]);
    setDraft('');
  };

  return (
    <View style={{ gap: Spacing.two }}>
      <View style={styles.chips}>
        {names.map((n) => (
          <Pressable key={n} onPress={() => onChange(names.filter((x) => x !== n))} style={[styles.chip, { backgroundColor: t.backgroundSelected }]}>
            <ThemedText type="small">{n}  ×</ThemedText>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={add}
        onBlur={add}
        returnKeyType="done"
        submitBehavior="submit"
        placeholder="Add a name, then press return"
        placeholderTextColor={t.textSecondary}
        style={[styles.input, { color: t.text, borderColor: t.border }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2, borderRadius: 99 },
  input: { borderWidth: 1, borderRadius: Radius.sm, padding: Spacing.three, fontSize: 16 },
});
