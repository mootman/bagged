import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

/** A small set drawn for this app, one stroke weight. The summit is the map symbol. */
const PATHS = {
  summit: 'M3 19.5 L10 7 L13.2 12.4 L15.6 9.2 L21 19.5 Z',
  comment: 'M4.5 5.5 H19.5 V15.5 H10.5 L6.5 19 V15.5 H4.5 Z',
  bookmark: 'M6.5 3.5 H17.5 V20.5 L12 16.5 L6.5 20.5 Z',
  heart: 'M12 19.5 C6 15.2 3.5 12.4 3.5 9.2 C3.5 6.7 5.4 5 7.6 5 C9.4 5 10.9 6.1 12 7.8 C13.1 6.1 14.6 5 16.4 5 C18.6 5 20.5 6.7 20.5 9.2 C20.5 12.4 18 15.2 12 19.5 Z',
  check: 'M5 12.5 L10 17.5 L19 7',
  plus: 'M12 5 V19 M5 12 H19',
  arrow: 'M5 12 H19 M13.5 6.5 L19 12 L13.5 17.5',
  person: 'M12 12 A4 4 0 1 0 12 4 A4 4 0 1 0 12 12 Z M4.5 20.5 C5.5 16.5 8.5 14.5 12 14.5 C15.5 14.5 18.5 16.5 19.5 20.5',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, color = Colors.dark.text, filled = false, weight = 1.8 }: { name: IconName; size?: number; color?: string; filled?: boolean; weight?: number }) {
  const closed = name === 'summit' || name === 'comment' || name === 'bookmark' || name === 'heart';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={PATHS[name]}
        stroke={color}
        strokeWidth={weight}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill={filled && closed ? color : 'none'}
      />
    </Svg>
  );
}
