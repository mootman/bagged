import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

/** Animate a number from `from` to `to` once, easing out. Returns the current integer. */
export function useCountUp(to: number, { from = 0, duration = 900, delay = 0 } = {}) {
  const [value, setValue] = useState(from);
  const [anim] = useState(() => new Animated.Value(from));
  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setValue(Math.round(v)));
    anim.setValue(from);
    Animated.timing(anim, { toValue: to, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [to, from, duration, delay, anim]);
  return value;
}
