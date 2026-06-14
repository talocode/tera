import { TextInput, TextInputProps, StyleSheet, View } from 'react-native';
import { colors, layout, radii, spacing } from '@/constants/theme';
import { Text } from './Text';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.wrap}>
      {label ? <Text variant="caption" muted>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textSubtle}
        {...props}
        style={[styles.input, props.multiline && styles.multiline, style]}
      />
      {error ? <Text variant="bodySmall" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  input: {
    minHeight: layout.minTouchTarget,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.danger,
  },
});
