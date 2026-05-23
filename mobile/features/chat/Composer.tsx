import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, layout, radii, spacing } from '@/constants/theme';
import { Text } from '@/components/ui';

interface ComposerProps {
  placeholder?: string;
  disabled?: boolean;
  onSubmit: (value: string) => void;
}

export function Composer({
  placeholder = 'Ask Tera anything...',
  disabled,
  onSubmit,
}: ComposerProps) {
  const [value, setValue] = useState('');

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue('');
    onSubmit(trimmed);
  }

  return (
    <View style={styles.shell}>
      <View style={styles.tools}>
        <View style={styles.toolDot} />
        <Text variant="overline">Prompt</Text>
      </View>
      <View style={styles.wrap}>
        <TextInput
          value={value}
          onChangeText={setValue}
          editable={!disabled}
          multiline
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          style={styles.input}
        />
        <Pressable
          onPress={submit}
          disabled={!value.trim() || disabled}
          style={({ pressed }) => [
            styles.send,
            pressed && styles.pressed,
            (!value.trim() || disabled) && styles.disabled,
          ]}
        >
          <Text style={styles.sendGlyph}>↑</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    gap: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  tools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  toolDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: layout.minTouchTarget,
    maxHeight: 132,
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceStrong,
    textAlignVertical: 'top',
  },
  send: {
    width: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  sendGlyph: {
    color: colors.black,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.84,
  },
  disabled: {
    opacity: 0.45,
  },
});
