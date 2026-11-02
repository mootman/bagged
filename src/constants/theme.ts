import '@/global.css';

import { Platform } from 'react-native';

/**
 * Topo sheet. Light stone paper and forest ink, like a USGS quad. One hue, ballpoint blue,
 * for the peaks you've inked in and for the main action. Everything else is ink and pencil.
 * Surfaces are separated by tone, not lines. Corners are square, like a map sheet.
 */
const palette = {
  text: '#15201A',
  background: '#ECEEE8',
  backgroundElement: '#E0E3DB',
  backgroundSelected: '#D2D6CC',
  textSecondary: '#4D5751',
  textMuted: '#646C66',
  border: '#D2D6CC',
  accent: '#1B4FCB',
  glow: '#1B4FCB',
  accentText: '#FFFFFF',
  link: '#1B4FCB',
  gold: '#9A6A00',
  unclimbed: '#A3AAA3',
  line: '#8D958E',
  success: '#2B7148',
  danger: '#B3352A',
} as const;

export const Colors = { light: palette, dark: palette } as const;

export type ThemeColor = keyof typeof palette;

/**
 * One family: Overpass, drawn from Highway Gothic, the lettering on the roads and Forest
 * Service signs on the way to every trailhead. Weight and size carry hierarchy; no second face.
 */
export const Type = {
  display: 'Overpass_800ExtraBold',
  displayItalic: 'Overpass_700Bold',
  displayBlack: 'Overpass_900Black',
  body: 'Overpass_400Regular',
  bodyMedium: 'Overpass_600SemiBold',
  bodyBold: 'Overpass_700Bold',
  mono: 'Overpass_600SemiBold',
  monoBold: 'Overpass_700Bold',
} as const;

/** Five sizes, far apart. */
export const Size = { small: 13, body: 16, lead: 20, head: 26, display: 44 } as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;
/** Square, chosen once. Avatars are the only round things: they're people. */
export const Radius = { xs: 0, sm: 0, md: 0, lg: 0 } as const;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 640;
