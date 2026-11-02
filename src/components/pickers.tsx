import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/social';
import { Colors, Type } from '@/constants/theme';
import { tap } from '@/lib/haptics';
import type { Beta, User } from '@/lib/types';

const c = Colors.dark;

export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value?: T; onChange: (v: T | undefined) => void }) {
  return (
    <View style={styles.seg}>
      {options.map((o) => {
        const on = value === o;
        return (
          <Pressable
            key={o}
            onPress={() => {
              tap();
              onChange(on ? undefined : o);
            }}
            style={[styles.segItem, on && styles.segOn]}>
            <Text style={[styles.segText, on && { color: c.accentText }]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Quick conditions report: four taps and it's useful to the next person. */
export function BetaPicker({ beta, onChange }: { beta: Beta; onChange: (b: Beta) => void }) {
  return (
    <View style={{ gap: 14 }}>
      <Field label="Surface">
        <Segmented options={['Dry', 'Patchy snow', 'Snow', 'Ice'] as const} value={beta.surface} onChange={(v) => onChange({ ...beta, surface: v })} />
      </Field>
      <Field label="Traction you needed">
        <Segmented options={['None', 'Microspikes', 'Crampons'] as const} value={beta.traction} onChange={(v) => onChange({ ...beta, traction: v })} />
      </Field>
      <Field label="Wind on top">
        <Segmented options={['Calm', 'Breezy', 'Howling'] as const} value={beta.wind} onChange={(v) => onChange({ ...beta, wind: v })} />
      </Field>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Field label="On top at" style={{ width: 110 }}>
          <TextInput
            value={beta.summitTime ?? ''}
            onChangeText={(t) => onChange({ ...beta, summitTime: t })}
            placeholder="09:45"
            placeholderTextColor={c.textMuted}
            style={styles.input}
          />
        </Field>
        <Field label="Route" style={{ flex: 1 }}>
          <TextInput value={beta.route ?? ''} onChangeText={(t) => onChange({ ...beta, route: t })} placeholder="Standard" placeholderTextColor={c.textMuted} style={styles.input} />
        </Field>
      </View>
    </View>
  );
}

/** Pick friends. People who want this peak float to the top with a tag. */
export function FriendPicker({ friends, selected, onToggle, wantsIds = [] }: { friends: User[]; selected: string[]; onToggle: (id: string) => void; wantsIds?: string[] }) {
  const sorted = [...friends].sort((a, b) => Number(wantsIds.includes(b.id)) - Number(wantsIds.includes(a.id)));
  return (
    <View style={{ gap: 6 }}>
      {sorted.map((f) => {
        const on = selected.includes(f.id);
        return (
          <Pressable
            key={f.id}
            onPress={() => {
              tap();
              onToggle(f.id);
            }}
            style={[styles.friend, on && { borderColor: c.accent, backgroundColor: 'rgba(255,122,69,0.08)' }]}>
            <Avatar user={f} size={32} />
            <View style={{ flex: 1 }}>
              <Text style={styles.friendName}>{f.name}</Text>
              {wantsIds.includes(f.id) && <Text style={styles.wants}>WANTS THIS PEAK</Text>}
            </View>
            <View style={[styles.check, on && { backgroundColor: c.accent, borderColor: c.accent }]}>{on && <Text style={{ color: c.accentText, fontSize: 13 }}>✓</Text>}</View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ gap: 7 }, style]}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  segItem: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: c.border, backgroundColor: c.backgroundElement },
  segOn: { backgroundColor: c.accent, borderColor: c.accent },
  segText: { color: c.text, fontFamily: Type.bodyMedium, fontSize: 13 },
  label: { color: c.textMuted, fontFamily: Type.mono, fontSize: 10, letterSpacing: 1 },
  input: { backgroundColor: c.backgroundElement, color: c.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontFamily: Type.mono, fontSize: 14, borderWidth: 1, borderColor: c.border },
  friend: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: c.border },
  friendName: { color: c.text, fontFamily: Type.bodyMedium, fontSize: 15 },
  wants: { color: c.accent, fontFamily: Type.mono, fontSize: 9, letterSpacing: 0.8, marginTop: 2 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
});
