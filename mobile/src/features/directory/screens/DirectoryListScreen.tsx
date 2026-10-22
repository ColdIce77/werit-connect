import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { DirectoryScreenProps } from '../../../app/navigation/types';
import { ApiError } from '../../../shared/api/client';
import { Avatar } from '../../../shared/components/Avatar';
import { ListRow } from '../../../shared/components/ListRow';
import { SearchField } from '../../../shared/components/SearchField';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { colors } from '../../../shared/theme/colors';
import { useLayout } from '../../../shared/theme/responsive';
import { spacing } from '../../../shared/theme/tokens';
import { useDebouncedValue } from '../../../shared/utils/useDebouncedValue';
import { useDirectorySearch } from '../api';
import { EmployeeDetailView } from '../components/EmployeeDetailView';

const LIST_PANE_WIDTH = 380;

export function DirectoryListScreen({ navigation, route }: DirectoryScreenProps<'DirectoryList'>) {
  const { t } = useTranslation();
  const { isTablet } = useLayout();
  const [text, setText] = useState('');
  const query = useDebouncedValue(text.trim(), 300);
  const selectedUserId = route.params?.selectedUserId;

  const { data, error, isPending, isRefetching, refetch } = useDirectorySearch(query);

  // Tablet: Auswahl bleibt auf diesem Bildschirm (Master/Detail). Smartphone: eigener Bildschirm.
  const select = (userId: string) =>
    isTablet
      ? navigation.setParams({ selectedUserId: userId })
      : navigation.navigate('EmployeeDetail', { userId });

  const list = (
    <View style={[styles.listPane, isTablet && styles.listPaneTablet]}>
      <View style={styles.search}>
        <SearchField value={text} onChangeText={setText} placeholder={t('directory.searchPlaceholder')} />
      </View>

      {isPending ? (
        <LoadingState />
      ) : !data ? (
        <ErrorState
          offline={error instanceof ApiError && error.isNetworkError}
          onRetry={() => void refetch()}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(employee) => employee.id}
          keyboardShouldPersistTaps="handled"
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState title={t('directory.noResults')} icon="people-outline" />}
          renderItem={({ item }) => (
            <ListRow
              title={item.displayName}
              subtitle={[item.jobTitle, item.departmentName].filter(Boolean).join(' · ')}
              left={<Avatar name={item.displayName} />}
              selected={isTablet && item.id === selectedUserId}
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
        {selectedUserId ? (
          <EmployeeDetailView userId={selectedUserId} onOpenEmployee={select} />
        ) : (
          <EmptyState title={t('directory.selectPrompt')} icon="person-outline" />
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
  search: { padding: spacing.md },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
});
