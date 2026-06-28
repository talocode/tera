import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState, LoadingState, Screen, Text, TextField } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { ConversationPreview } from '@/features/chat/ConversationPreview';
import { teraApi } from '@/lib/api/client';

export default function HistoryScreen() {
  const [query, setQuery] = useState('');
  const conversations = useQuery({
    queryKey: ['conversations'],
    queryFn: teraApi.getConversations,
  });

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return conversations.data ?? [];
    return (conversations.data ?? []).filter((conversation) =>
      `${conversation.title} ${conversation.summary}`.toLowerCase().includes(normalized),
    );
  }, [conversations.data, query]);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="overline">Library</Text>
        <Text variant="h1">History</Text>
        <Text variant="body" muted>Return to explanations, research threads, and build plans.</Text>
      </View>
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder="Search conversations"
      />
      {conversations.isLoading ? (
        <LoadingState label="Loading history..." />
      ) : filtered.length ? (
        <View style={styles.list}>
          {filtered.map((conversation) => (
            <ConversationPreview key={conversation.id} conversation={conversation} />
          ))}
        </View>
      ) : (
        <EmptyState title="Nothing found" body="Try a different search or start a new conversation." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  list: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
});
