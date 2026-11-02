import type { ReactNode } from 'react';
import { Pressable, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { tap } from '@/lib/haptics';

const SPRING = { damping: 14, stiffness: 180 };

/**
 * Press-and-hold tilt, like picking up a card: the side you press dips toward you.
 * Moves with your finger while held, springs back on release.
 */
export function Tilt({
  children,
  width,
  height,
  onPress,
  style,
  max = 14,
}: {
  children: ReactNode;
  width: number;
  height: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  max?: number;
}) {
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const scale = useSharedValue(1);

  const aim = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const nx = Math.max(-1, Math.min(1, (locationX / width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, (locationY / height) * 2 - 1));
    ry.set(withSpring(nx * max, SPRING));
    rx.set(withSpring(-ny * max, SPRING));
  };

  const animated = useAnimatedStyle(() => ({
    transform: [{ perspective: 600 }, { rotateX: `${rx.get()}deg` }, { rotateY: `${ry.get()}deg` }, { scale: scale.get() }],
  }));

  return (
    <Pressable
      onPressIn={(e) => {
        scale.set(withSpring(1.04, SPRING));
        aim(e);
      }}
      onTouchMove={aim}
      onPressOut={() => {
        rx.set(withSpring(0, SPRING));
        ry.set(withSpring(0, SPRING));
        scale.set(withSpring(1, SPRING));
      }}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={style}>
      <Animated.View style={animated}>{children}</Animated.View>
    </Pressable>
  );
}
