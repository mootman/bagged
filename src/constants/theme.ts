import '@/global.css';

import { Platform } from 'react-native';

/**
 * Night-sky canvas with warm bone type, like a vintage topo map printed on dark stock.
 * Color has one job each:
 *   alpenglow (accent, glow) = summits you've earned and the main action
 *   glacier (link)           = links and secondary actions
 *   gold                     = finishing a list
 */
const palette = {
  text: '#EDE6D6',
  background: '#0A0F13',
  backgroundElement: '#111920',
  backgroundSelected: '#1A252D',
  textSecondary: '#A8A396',
  textMuted: '#646B6E',
  border: '#1F2B34',
  accent: '#FF7A45',
  glow: '#FF4F7B',
  accentText: '#140B07',
  link: '#7FD0E8',
  gold: '#E9C46A',
  unclimbed: '#3B4A54',
  line: '#C9C2B2',
  success: '#6CCB8E',
} as const;

export const Colors = { light: palette, dark: palette } as const;

export type ThemeColor = keyof typeof palette;

/** Loaded in the root layout. Fallbacks keep things readable before fonts load. */
export const Type = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_400Regular_Italic',
  displayBlack: 'Fraunces_800ExtraBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodyBold: 'Inter_700Bold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;
export const Radius = { xs: 3, sm: 8, md: 14, lg: 22 } as const;
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 640;
