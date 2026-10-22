import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MoreScreenProps } from '../../../app/navigation/types';
import { ApiError } from '../../../shared/api/client';
import type { Approval, ApprovalStatus } from '../../../shared/api/types';
import { ChoiceChips } from '../../../shared/components/ChoiceChips';
import { ListRow } from '../../../shared/components/ListRow';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { colors } from '../../../shared/theme/colors';
import { CONTENT_MAX_WIDTH, spacing } from '../../../shared/theme/tokens';
import { formatDate } from '../../../shared/utils/format';
import { useApprovals, type ApprovalFilter } from '../api';

export function approvalTone(status: ApprovalStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'danger';
    case 'cancelled':
      return 'neutral';
  }
}

export function ApprovalListScreen({ navigation }: MoreScreenProps<'ApprovalList'>) {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<ApprovalFilter>('pending');
  const { data, error, isPending, isRefetching, refetch } = useApprovals(filter);

  const statusLabel = (approval: Approval) => t(`approvals.status.${approval.status}`);

  return (
    <View style={styles.root}>
      <View style={styles.filters}>
        <ChoiceChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'pending', label: t('approvals.filterPending') },
            { value: 'decided', label: t('approvals.filterDecided') },
          ]}
        />
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
          keyExtractor={(approval) => approval.id}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title={t('approvals.empty')} icon="checkmark-done-outline" />}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={`${item.requesterName} · ${formatDate(item.createdAt, i18n.language)}`}
              right={<StatusBadge label={statusLabel(item)} tone={approvalTone(item.status)} />}
              onPress={() => navigation.navigate('ApprovalDetail', { approvalId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  filters: {
    padding: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  list: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
});
