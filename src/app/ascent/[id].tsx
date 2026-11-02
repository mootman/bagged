import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Backdrop } from '@/components/backdrop';
import { Avatar, FacePile, KudosButton } from '@/components/social';
import { Button } from '@/components/ui';
import { Colors, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { ago, formatDate, ME, useStore } from '@/lib/store';

const c = Colors.dark;

export default function AscentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ascents, peakById, user, addComment, removeAscent, photoFor } = useStore();
  const [draft, setDraft] = useState('');
  const a = ascents.find((x) => x.id === id);
  const peak = a && peakById.get(a.peakId);
  if (!a || !peak) return null;

  const who = user(a.userId);
  const mine = a.userId === ME;
  const crew = [a.userId, ...a.withIds];
  const b = a.beta;
  const rows: [string, string | undefined][] = [
    ['Route', b?.route],
    ['Surface', b?.surface],
    ['Traction', b?.traction],
    ['Wind', b?.wind],
    ['On top', b?.summitTime],
  ];

  const remove = () => {
    const go = () => {
      removeAscent(a.id);
      router.back();
    };
    if (Platform.OS === 'web') go();
    else Alert.alert('Remove this summit?', undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: go }]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: '', headerTransparent: true, headerStyle: { backgroundColor: 'transparent' } }} />
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.six }} keyboardShouldPersistTaps="handled">
        <Backdrop peakId={peak.id} photoId={mine ? (a.photoId ?? photoFor.get(peak.id)) : undefined} height={360}>
          <Pressable onPress={() => router.push(`/peak/${peak.id}`)}>
            <Text style={styles.title}>{peak.name}</Text>
          </Pressable>
          <Text style={styles.kicker}>{formatDate(a.date)}</Text>
        </Backdrop>

        <View style={styles.page}>
          <Pressable onPress={() => router.push(`/user/${a.userId}`)} style={styles.whoRow}>
            <FacePile ids={crew} size={36} max={4} />
            <Text style={styles.who}>
              {mine ? 'You' : who?.name}
              {a.withIds.length ? <Text style={{ color: c.textSecondary, fontFamily: Type.body }}> with {a.withIds.map((u) => (u === ME ? 'you' : user(u)?.name.split(' ')[0])).join(', ')}</Text> : null}
              {a.guests.length ? <Text style={{ color: c.textSecondary, fontFamily: Type.body }}> + {a.guests.map((g) => g.name).join(', ')}</Text> : null}
            </Text>
          </Pressable>

          {a.note ? <Text style={styles.note}>{a.note}</Text> : null}

          {b?.surface && (
            <View style={styles.betaBox}>
              <Text style={styles.betaTitle}>Conditions</Text>
              {rows
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <View key={k} style={styles.betaRow}>
                    <Text style={styles.betaKey}>{k}</Text>
                    <Text style={styles.betaVal}>{v}</Text>
                  </View>
                ))}
            </View>
          )}

          <View style={styles.actions}>
            <KudosButton ascent={a} />
            {a.kudos.length > 0 && (
              <Text style={styles.kudosText}>
                {a.kudos
                  .slice(0, 3)
                  .map((k) => (k === ME ? 'You' : user(k)?.name.split(' ')[0]))
                  .join(', ')}
                {a.kudos.length > 3 ? ` and ${a.kudos.length - 3} more` : ''} gave kudos
              </Text>
            )}
          </View>

          {mine && <Button title="Share summit card" variant="secondary" onPress={() => router.push(`/share/${a.id}`)} />}

          <Text style={styles.section}>Comments</Text>
          {a.comments.length === 0 && <Text style={styles.empty}>{mine ? 'No comments yet.' : `Ask ${who?.name.split(' ')[0]} about the route.`}</Text>}
          {a.comments.map((cm) => (
            <View key={cm.id} style={styles.comment}>
              <Avatar user={user(cm.userId)} size={30} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.cName}>
                  {cm.userId === ME ? 'You' : user(cm.userId)?.name} <Text style={styles.cAgo}>{ago(cm.at)}</Text>
                </Text>
                <Text style={styles.cText}>{cm.text}</Text>
              </View>
            </View>
          ))}
          <View style={styles.inputRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={mine ? 'Reply...' : 'Ask about conditions, the route...'}
              placeholderTextColor={c.textMuted}
              style={styles.input}
              onSubmitEditing={() => {
                addComment(a.id, draft);
                setDraft('');
              }}
              returnKeyType="send"
            />
            <Pressable
              onPress={() => {
                addComment(a.id, draft);
                setDraft('');
              }}
              disabled={!draft.trim()}
              style={[styles.send, !draft.trim() && { opacity: 0.4 }]}>
              <Text style={styles.sendText}>Post</Text>
            </Pressable>
          </View>

          {mine && <Button title="Remove summit" variant="ghost" onPress={remove} style={{ marginTop: Spacing.four }} />}
          <Text style={styles.footer}>Logged {ago(a.createdAt)} ago{a.taggedBy ? `, tagged by ${a.taggedBy === ME ? 'you' : user(a.taggedBy)?.name}` : ''}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: Spacing.three, gap: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  kicker: { color: c.text, fontFamily: Type.bodyMedium, fontSize: 17 },
  title: { color: c.text, fontFamily: Type.display, fontSize: 44, lineHeight: 46, letterSpacing: -1.4 },
  whoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  who: { flex: 1, color: c.text, fontFamily: Type.bodyBold, fontSize: 16 },
  note: { color: c.text, fontFamily: Type.body, fontSize: 18, lineHeight: 27 },
  betaBox: { padding: Spacing.three, gap: 10, backgroundColor: c.backgroundElement },
  betaTitle: { color: c.text, fontFamily: Type.display, fontSize: 20, letterSpacing: -0.4 },
  betaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  betaKey: { color: c.textSecondary, fontFamily: Type.body, fontSize: 15 },
  betaVal: { color: c.text, fontFamily: Type.bodyBold, fontSize: 15, fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kudosText: { color: c.textSecondary, fontFamily: Type.body, fontSize: 15, flex: 1 },
  section: { color: c.text, fontFamily: Type.display, fontSize: 24, letterSpacing: -0.5, marginTop: Spacing.two },
  empty: { color: c.textSecondary, fontFamily: Type.body, fontSize: 16 },
  comment: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  cName: { color: c.text, fontFamily: Type.bodyBold, fontSize: 15 },
  cAgo: { color: c.textSecondary, fontFamily: Type.body, fontSize: 13 },
  cText: { color: c.text, fontFamily: Type.body, fontSize: 16, lineHeight: 23 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, backgroundColor: c.backgroundElement, color: c.text, paddingHorizontal: 14, minHeight: 46, fontFamily: Type.body, fontSize: 16 },
  send: { backgroundColor: c.text, paddingHorizontal: 16, minHeight: 46, justifyContent: 'center' },
  sendText: { color: c.background, fontFamily: Type.bodyBold, fontSize: 15, marginTop: 2 },
  footer: { color: c.textSecondary, fontFamily: Type.body, fontSize: 13, textAlign: 'center' },
});
