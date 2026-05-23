import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { EmptyState, ListRow, LoadingState, Screen, Text } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { formatRelativeTime } from '@/features/chat/chat-data';
import { teraApi } from '@/lib/api/client';

export default function SavedScreen() {
  const saved = useQuery({
    queryKey: ['saved-items'],
    queryFn: teraApi.getSavedItems,
  });

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="overline">Pinned</Text>
        <Text variant="h1">Saved</Text>
        <Text variant="body" muted>Keep the conversations and outputs worth returning to.</Text>
      </View>
      {saved.isLoading ? (
        <LoadingState label="Loading saved items..." />
      ) : saved.data?.length ? (
        <View style={styles.list}>
          {saved.data.map((item) => (
            <ListRow
              key={item.id}
              title={item.title}
              subtitle={item.excerpt}
              meta={formatRelativeTime(item.savedAt)}
            />
          ))}
        </View>
      ) : (
        <EmptyState title="No saved work yet" body="Saved conversations and outputs will appear here." />
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
  },
});
