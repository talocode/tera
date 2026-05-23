import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '@/constants/theme';
import { Text } from './Text';

interface EmptyStateProps {
  title: string;
  body: string;
}

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <Text variant="caption" style={styles.markText}>Tera</Text>
      </View>
      <View style={styles.copy}>
        <Text variant="h3">{title}</Text>
        <Text muted style={styles.body}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.surface,
  },
  mark: {
    minWidth: 68,
    minHeight: 68,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  markText: {
    color: colors.accentSoft,
  },
  copy: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  body: {
    textAlign: 'center',
  },
});
