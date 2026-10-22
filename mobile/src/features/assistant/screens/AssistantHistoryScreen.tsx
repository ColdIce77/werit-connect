import { Ionicons } from '@expo/vector-icons';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AssistantScreenProps } from '../../../app/navigation/types';
import { ApiError } from '../../../shared/api/client';
import { ListRow } from '../../../shared/components/ListRow';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { colors } from '../../../shared/theme/colors';
import { CONTENT_MAX_WIDTH, MIN_TOUCH, spacing } from '../../../shared/theme/tokens';
import { formatDateTime } from '../../../shared/utils/format';
import { useConversations, useDeleteConversation } from '../api';

export function AssistantHistoryScreen({ navigation }: AssistantScreenProps<'AssistantHistory'>) {
  const { t, i18n } = useTranslation();
  const { data, error, isPending, isRefetching, refetch } = useConversations();
  const remove = useDeleteConversation();

  if (isPending) return <LoadingState />;
  if (!data) {
    return (
      <ErrorState
        offline={error instanceof ApiError && error.isNetworkError}
        onRetry={() => void refetch()}
      />
    );
  }

  const confirmDelete = (id: string) => {
    Alert.alert(t('assistant.deleteTitle'), t('assistant.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('assistant.delete'), style: 'destructive', onPress: () => remove.mutate(id) },
    ]);
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={data}
        keyExtractor={(conversation) => conversation.id}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState title={t('assistant.historyEmpty')} message={t('assistant.retention')} icon="time-outline" />
        }
        ListFooterComponent={
          data.length > 0 ? <ListRow title={t('assistant.retention')} /> : null
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.title ?? t('assistant.untitled')}
            subtitle={formatDateTime(item.updatedAt, i18n.language)}
            right={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('assistant.delete')}
                onPress={() => confirmDelete(item.id)}
                style={styles.delete}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={24} color={colors.danger} />
              </Pressable>
            }
            onPress={() => navigation.navigate('AssistantChat', { conversationId: item.id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    padding: spacing.md,
  },
  delete: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
});
