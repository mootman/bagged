import { Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Passport } from '@/components/passport';
import { Colors } from '@/constants/theme';

export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      <Stack.Screen options={{ title: '', headerTransparent: true, headerStyle: { backgroundColor: 'transparent' } }} />
      <Passport userId={id} />
    </View>
  );
}
