import { Text as NativeText, TextProps, StyleSheet } from 'react-native';
import { colors, typography } from '@/constants/theme';

type Variant = 'hero' | 'h1' | 'h2' | 'h3' | 'title' | 'body' | 'bodySmall' | 'caption' | 'overline';

interface AppTextProps extends TextProps {
  variant?: Variant;
  muted?: boolean;
}

export function Text({ variant = 'body', muted, style, ...props }: AppTextProps) {
  return (
    <NativeText
      {...props}
      style={[styles.base, styles[variant], muted && styles.muted, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
    letterSpacing: 0,
  },
  hero: {
    fontSize: typography.hero,
    lineHeight: 44,
    fontWeight: '700',
  },
  h1: {
    fontSize: typography.h1,
    lineHeight: 36,
    fontWeight: '700',
  },
  h2: {
    fontSize: typography.h2,
    lineHeight: 30,
    fontWeight: '700',
  },
  h3: {
    fontSize: typography.h3,
    lineHeight: 25,
    fontWeight: '700',
  },
  title: {
    fontSize: typography.title,
    lineHeight: 24,
    fontWeight: '700',
  },
  body: {
    fontSize: typography.body,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: typography.bodySmall,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontSize: typography.caption,
    lineHeight: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  overline: {
    fontSize: typography.overline,
    lineHeight: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: colors.textSubtle,
  },
  muted: {
    color: colors.textMuted,
  },
});
