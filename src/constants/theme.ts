import '@/global.css';

import { Platform } from 'react-native';

/** Alpine palette: granite neutrals with an alpenglow accent for summits you've bagged. */
export const Colors = {
  light: {
    text: '#1B1F1D',
    background: '#F6F4EF',
    backgroundElement: '#ECE8DF',
    backgroundSelected: '#DED8CB',
    textSecondary: '#6B6F69',
    border: '#D8D2C4',
    accent: '#D9572B',
    accentText: '#FFFFFF',
    unclimbed: '#B9B4A8',
    success: '#2F7D4F',
  },
  dark: {
    text: '#F2EFE8',
    background: '#121513',
    backgroundElement: '#1D211E',
    backgroundSelected: '#2A2F2B',
    textSecondary: '#A3A79F',
    border: '#2E332F',
    accent: '#F06A3B',
    accentText: '#FFFFFF',
    unclimbed: '#4A4F4A',
    success: '#4FB07A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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

export const Radius = { sm: 8, md: 14, lg: 22 } as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 640;
