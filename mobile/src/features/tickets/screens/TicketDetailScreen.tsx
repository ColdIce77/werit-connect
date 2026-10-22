import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MoreScreenProps } from '../../../app/navigation/types';
import { ApiError } from '../../../shared/api/client';
import { Card } from '../../../shared/components/Card';
import { Screen } from '../../../shared/components/Screen';
import { ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { colors } from '../../../shared/theme/colors';
import { font, spacing } from '../../../shared/theme/tokens';
import { formatDateTime } from '../../../shared/utils/format';
import { useTicket } from '../api';
import { ticketStatusTone } from '../status';

export function TicketDetailScreen({ route }: MoreScreenProps<'TicketDetail'>) {
  const { t, i18n } = useTranslation();
  const { data, error, isPending, isRefetching, refetch } = useTicket(route.params.ticketId);

  if (isPending) return <LoadingState />;
  if (!data) {
    return (
      <ErrorState
        offline={error instanceof ApiError && error.isNetworkError}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Text style={styles.title} accessibilityRole="header">
        {data.title}
      </Text>
      <View style={styles.badges}>
        <StatusBadge label={t(`tickets.status.${data.status}`)} tone={ticketStatusTone(data.status)} />
        {data.priority === 'high' || data.priority === 'critical' ? (
          <StatusBadge label={t('tickets.urgent')} tone="danger" />
        ) : null}
      </View>

      <Card>
        {data.description ? <Text style={styles.body}>{data.description}</Text> : null}
        <Text style={styles.meta}>
          {[
            data.category,
            t('tickets.created', { date: formatDateTime(data.createdAt, i18n.language) }),
            t('tickets.updated', { date: formatDateTime(data.updatedAt, i18n.language) }),
          ]
            .filter(Boolean)
            .join('\n')}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.headline, fontWeight: '700', color: colors.textPrimary },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  body: { fontSize: font.bodyLarge, color: colors.textPrimary, lineHeight: 26 },
  meta: { fontSize: font.body, color: colors.textSecondary, lineHeight: 22 },
});
