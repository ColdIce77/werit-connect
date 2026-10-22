import { Ionicons } from '@expo/vector-icons';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { DocumentsScreenProps } from '../../../app/navigation/types';
import { ListRow } from '../../../shared/components/ListRow';
import { EmptyState, LoadingState } from '../../../shared/components/StateViews';
import { colors } from '../../../shared/theme/colors';
import { CONTENT_MAX_WIDTH, spacing } from '../../../shared/theme/tokens';
import { formatDateTime } from '../../../shared/utils/format';
import { formatBytes } from '../../../shared/utils/text';
import { useRecentDocuments } from '../api';

/** Zuletzt gelesene Dokumente, auch ohne Verbindung verfügbar. */
export function RecentDocumentsScreen({ navigation }: DocumentsScreenProps<'RecentDocuments'>) {
  const { t, i18n } = useTranslation();
  const { data, isPending } = useRecentDocuments();

  if (isPending) return <LoadingState />;

  return (
    <View style={styles.root}>
      <FlatList
        data={data ?? []}
        keyExtractor={(doc) => doc.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title={t('documents.recentEmptyTitle')}
            message={t('documents.recentEmptyMessage')}
            icon="time-outline"
          />
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.title}
            subtitle={[formatBytes(item.sizeBytes), formatDateTime(item.lastReadAt, i18n.language)]
              .filter(Boolean)
              .join(' · ')}
            left={<Ionicons name="document-text-outline" size={28} color={colors.brandPrimary} />}
            onPress={() => navigation.navigate('DocumentViewer', { documentId: item.id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', padding: spacing.md },
});
