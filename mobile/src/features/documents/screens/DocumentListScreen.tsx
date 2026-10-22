import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { DocumentsScreenProps } from '../../../app/navigation/types';
import { ApiError } from '../../../shared/api/client';
import { AppButton } from '../../../shared/components/AppButton';
import { ListRow } from '../../../shared/components/ListRow';
import { SearchField } from '../../../shared/components/SearchField';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { colors } from '../../../shared/theme/colors';
import { useLayout } from '../../../shared/theme/responsive';
import { spacing } from '../../../shared/theme/tokens';
import { formatDate } from '../../../shared/utils/format';
import { formatBytes } from '../../../shared/utils/text';
import { useDebouncedValue } from '../../../shared/utils/useDebouncedValue';
import { useDocumentSearch } from '../api';
import { DocumentDetailView } from '../components/DocumentDetailView';

const LIST_PANE_WIDTH = 380;

export function DocumentListScreen({ navigation, route }: DocumentsScreenProps<'DocumentList'>) {
  const { t, i18n } = useTranslation();
  const { isTablet } = useLayout();
  const [text, setText] = useState('');
  const query = useDebouncedValue(text.trim(), 300);
  const selectedDocumentId = route.params?.selectedDocumentId;

  const { data, error, isPending, isRefetching, refetch } = useDocumentSearch(query);
  const offline = error instanceof ApiError && error.isNetworkError;

  const select = (documentId: string) =>
    isTablet
      ? navigation.setParams({ selectedDocumentId: documentId })
      : navigation.navigate('DocumentViewer', { documentId });

  const list = (
    <View style={[styles.listPane, isTablet && styles.listPaneTablet]}>
      <View style={styles.top}>
        <SearchField value={text} onChangeText={setText} placeholder={t('documents.searchPlaceholder')} />
        <AppButton
          title={t('documents.recent')}
          icon="time-outline"
          variant="secondary"
          onPress={() => navigation.navigate('RecentDocuments')}
        />
      </View>

      {isPending ? (
        <LoadingState />
      ) : !data ? (
        <ErrorState offline={offline} onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(doc) => doc.id}
          keyboardShouldPersistTaps="handled"
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title={t('documents.noResults')} icon="document-outline" />}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={[item.category, formatBytes(item.sizeBytes), formatDate(item.updatedAt, i18n.language)]
                .filter(Boolean)
                .join(' · ')}
              left={<Ionicons name="document-text-outline" size={28} color={colors.brandPrimary} />}
              selected={isTablet && item.id === selectedDocumentId}
              onPress={() => select(item.id)}
            />
          )}
        />
      )}
    </View>
  );

  if (!isTablet) return list;

  return (
    <View style={styles.split}>
      {list}
      <View style={styles.detailPane}>
        {selectedDocumentId ? (
          <DocumentDetailView documentId={selectedDocumentId} />
        ) : (
          <EmptyState title={t('documents.selectPrompt')} icon="document-outline" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  split: { flex: 1, flexDirection: 'row', backgroundColor: colors.background },
  listPane: { flex: 1, backgroundColor: colors.background },
  listPaneTablet: {
    flex: 0,
    width: LIST_PANE_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  detailPane: { flex: 1 },
  top: { padding: spacing.md, gap: spacing.sm },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
});
