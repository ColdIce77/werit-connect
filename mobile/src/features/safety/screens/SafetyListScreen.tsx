import type { TFunction } from 'i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MoreScreenProps } from '../../../app/navigation/types';
import { ListRow } from '../../../shared/components/ListRow';
import { EmptyState, LoadingState } from '../../../shared/components/StateViews';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { colors } from '../../../shared/theme/colors';
import { CONTENT_MAX_WIDTH, spacing } from '../../../shared/theme/tokens';
import { useSafetyList, type SafetyItem } from '../api';

export function statusLabel(item: SafetyItem, t: TFunction) {
  if (item.status === 'acknowledged') return { label: t('safety.statusAcknowledged'), tone: 'success' as const };
  if (item.status === 'updated') return { label: t('safety.statusUpdated'), tone: 'warning' as const };
  return { label: t('safety.statusOpen'), tone: 'danger' as const };
}

export function SafetyListScreen({ navigation }: MoreScreenProps<'SafetyList'>) {
  const { t } = useTranslation();
  const { data, isPending, isRefetching, refetch } = useSafetyList();

  if (isPending) return <LoadingState />;

  return (
    <View style={styles.root}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title={t('safety.emptyTitle')}
            message={t('safety.emptyMessage')}
            icon="shield-checkmark-outline"
          />
        }
        renderItem={({ item }) => {
          const { label, tone } = statusLabel(item, t);
          return (
            <ListRow
              title={item.title}
              subtitle={item.summary}
              right={<StatusBadge label={label} tone={tone} />}
              onPress={() => navigation.navigate('SafetyDetail', { instructionId: item.id })}
            />
          );
        }}
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
});
