import { StyleSheet, View } from 'react-native';
import { colors, radii, spacing } from '@/constants/theme';
import { Message } from '@/types/domain';
import { Text } from '@/components/ui';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser && styles.userRow]}>
      {!isUser ? <View style={styles.assistantRail} /> : null}
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <View style={styles.meta}>
          <Text variant="overline" style={isUser ? styles.userMeta : styles.assistantMeta}>
            {isUser ? 'You' : 'Tera'}
          </Text>
          {message.status === 'streaming' ? (
            <Text variant="overline" style={styles.streamingText}>Thinking</Text>
          ) : null}
        </View>
        <Text variant="body" style={isUser && styles.userText}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRail: {
    width: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignSelf: 'stretch',
    opacity: 0.7,
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  userBubble: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: radii.sm,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radii.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  assistantMeta: {
    color: colors.accentSoft,
  },
  userMeta: {
    color: colors.black,
  },
  streamingText: {
    color: colors.textSubtle,
  },
  userText: {
    color: colors.black,
    fontWeight: '500',
  },
});
