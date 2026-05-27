import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ListRow, Text } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';
import { Conversation } from '@/types/domain';
import { formatRelativeTime } from './chat-data';

interface ConversationPreviewProps {
  conversation: Conversation;
}

export function ConversationPreview({ conversation }: ConversationPreviewProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.metaRow}>
        <Text variant="overline">{conversation.mode}</Text>
        <Text variant="overline" style={styles.time}>{formatRelativeTime(conversation.updatedAt)}</Text>
      </View>
      <ListRow
        title={conversation.title}
        subtitle={conversation.summary}
        onPress={() => router.push(`/conversation/${conversation.id}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  time: {
    color: colors.textSubtle,
  },
});
