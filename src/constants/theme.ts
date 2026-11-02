import '@/global.css';

import { Platform } from 'react-native';

/**
 * Dark-first, like Letterboxd: tinted slate neutrals (never pure black or white) so the
 * artwork and photos are the brightest thing on screen.
 *
 * Color has one job each:
 *   accent (alpenglow)  = action and summits you've earned
 *   link (glacier)      = links and secondary actions
 *   gold                = list completion and milestones
 */
const palette = {
  text: '#DCE3E8',
  background: '#12161A',
  backgroundElement: '#1B2127',
  backgroundSelected: '#252D34',
  textSecondary: '#93A1AC',
  textMuted: '#5E6B75',
  border: '#2B343C',
  accent: '#FF6B3D',
  accentText: '#FFFFFF',
  link: '#6CC4F0',
  gold: '#F2C14E',
  unclimbed: '#3A444D',
  success: '#4FB07A',
} as const;

export const Colors = { light: palette, dark: palette } as const;

export type ThemeColor = keyof typeof palette;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = { xs: 4, sm: 8, md: 14, lg: 22 } as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 640;
