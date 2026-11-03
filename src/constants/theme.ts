import '@/global.css';

import { Platform } from 'react-native';

/**
 * Trailhead morning. Warm white like a paper trail map, dark spruce for the one action on a
 * screen and for peaks you've climbed. The colour in the app comes from the photographs.
 */
const palette = {
  text: '#1D211C',
  background: '#FBFAF7',
  backgroundElement: '#F1EFE9',
  backgroundSelected: '#E5E2DA',
  textSecondary: '#5C6159',
  textMuted: '#757A72',
  border: '#E5E2DA',
  accent: '#24563F',
  glow: '#24563F',
  accentText: '#FFFFFF',
  link: '#24563F',
  gold: '#A86A12',
  unclimbed: '#A9ADA5',
  line: '#9AA096',
  success: '#2F7A4D',
  danger: '#B4412F',
} as const;

export const Colors = { light: palette, dark: palette } as const;

export type ThemeColor = keyof typeof palette;

/**
 * Source Serif for names of places and headlines, like a field guide. Nunito Sans for
 * everything you read or tap: round, friendly, easy at trailhead-glare sizes.
 */
export const Type = {
  display: 'SourceSerif4_700Bold',
  displayItalic: 'SourceSerif4_600SemiBold',
  displayBlack: 'NunitoSans_800ExtraBold',
  body: 'NunitoSans_400Regular',
  bodyMedium: 'NunitoSans_600SemiBold',
  bodyBold: 'NunitoSans_700Bold',
  mono: 'NunitoSans_600SemiBold',
  monoBold: 'NunitoSans_700Bold',
} as const;

/** Five sizes, far apart. */
export const Size = { small: 13, body: 16, lead: 20, head: 26, display: 44 } as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;
/** Soft corners, like a printed photo. */
export const Radius = { xs: 6, sm: 10, md: 14, lg: 20 } as const;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 640;
