import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import { Text } from './Text';

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Loading Tera...' }: LoadingStateProps) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.accent} />
      <Text muted>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
});
