import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { APP_NAME } from '@/constants/brand';
import { Colors, Type } from '@/constants/theme';

const c = Colors.dark;

/** The product's mark: the topo map's summit symbol, inked, with the name beside it. */
export function Mark({ color = c.text, size = 20 }: { color?: string; size?: number }) {
  return (
    <View style={styles.row}>
      <Icon name="summit" size={size * 1.1} filled color={color === c.text ? c.accent : color} weight={1.2} />
      <Text style={[styles.name, { color, fontSize: size, marginTop: size * 0.05 }]}>{APP_NAME}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: Type.display },
});
