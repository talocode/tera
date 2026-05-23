import { Pressable, StyleSheet, View } from 'react-native';
import { colors, layout, radii, spacing } from '@/constants/theme';
import { Text } from './Text';

interface ListRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
}

export function ListRow({ title, subtitle, meta, onPress }: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.mark} />
      <View style={styles.content}>
        <Text variant="title" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="bodySmall" muted numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      <View style={styles.side}>
        {meta ? <Text variant="overline">{meta}</Text> : null}
        <Text style={styles.arrow}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: layout.minTouchTarget + 18,
    borderRadius: radii.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mark: {
    width: 10,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    marginTop: 4,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  side: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  arrow: {
    color: colors.textSubtle,
    fontSize: 22,
    lineHeight: 22,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
});
