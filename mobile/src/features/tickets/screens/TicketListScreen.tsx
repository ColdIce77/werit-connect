import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MoreScreenProps, RootStackParamList } from '../../../app/navigation/types';
import { ApiError } from '../../../shared/api/client';
import { AppButton } from '../../../shared/components/AppButton';
import { ListRow } from '../../../shared/components/ListRow';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { colors } from '../../../shared/theme/colors';
import { CONTENT_MAX_WIDTH, spacing } from '../../../shared/theme/tokens';
import { formatDate } from '../../../shared/utils/format';
import { useSyncStore } from '../../../shared/offline/syncStore';
import { ticketStatusTone } from '../status';
import { useTickets } from '../api';

export function TicketListScreen({ navigation }: MoreScreenProps<'TicketList'>) {
  const { t, i18n } = useTranslation();
  const root = useNavigation<NavigationProp<RootStackParamList>>();
  const { data, error, isPending, isRefetching, refetch } = useTickets();
  const pending = useSyncStore((state) => state.pending);

  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <AppButton
          title={t('tickets.report')}
          icon="add-circle-outline"
          onPress={() => root.navigate('TicketCreate')}
        />
        {pending > 0 ? <StatusBadge label={t('tickets.waitingToSend', { count: pending })} tone="warning" /> : null}
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
          keyExtractor={(ticket) => ticket.id}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title={t('tickets.empty')} icon="construct-outline" />}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={formatDate(item.updatedAt, i18n.language)}
              right={<StatusBadge label={t(`tickets.status.${item.status}`)} tone={ticketStatusTone(item.status)} />}
              onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  top: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  list: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
});
