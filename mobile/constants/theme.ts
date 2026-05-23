export const colors = {
  background: '#0B0F0E',
  backgroundElevated: '#101614',
  surface: '#141C19',
  surfaceMuted: '#1B2521',
  surfacePressed: '#22302B',
  surfaceStrong: '#18211D',
  border: '#26352F',
  borderMuted: '#1C2824',
  text: '#F4F7F5',
  textMuted: '#A8B4AE',
  textSubtle: '#748079',
  accent: '#6EE7B7',
  accentStrong: '#34D399',
  accentMuted: '#14382B',
  accentSoft: '#C8F5E3',
  danger: '#F87171',
  warning: '#FBBF24',
  white: '#FFFFFF',
  black: '#020403',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  hero: 38,
  h1: 30,
  h2: 24,
  h3: 19,
  title: 17,
  body: 16,
  bodySmall: 14,
  caption: 12,
  overline: 11,
} as const;

export const layout = {
  screenPadding: 20,
  minTouchTarget: 44,
} as const;

export const shadow = {
  card: {
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  layout,
  shadow,
} as const;
