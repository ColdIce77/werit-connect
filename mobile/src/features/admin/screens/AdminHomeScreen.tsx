import { Alert, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiError } from '../../../shared/api/client';
import { AppButton } from '../../../shared/components/AppButton';
import { Card } from '../../../shared/components/Card';
import { Screen } from '../../../shared/components/Screen';
import { ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { colors } from '../../../shared/theme/colors';
import { font } from '../../../shared/theme/tokens';
import { formatDateTime } from '../../../shared/utils/format';
import { useAdminStatus, useStartReindex, useStartUserSync } from '../api';

/**
 * Leichte Administration für unterwegs: Systemstatus und zwei Wartungsaktionen.
 * Umfangreiche Verwaltung (Benutzer, Inhalte, Quellen) bleibt einem Web-Portal vorbehalten.
 */
export function AdminHomeScreen() {
  const { t, i18n } = useTranslation();
  const { data, error, isPending, isRefetching, refetch } = useAdminStatus();
  const userSync = useStartUserSync();
  const reindex = useStartReindex();

  if (isPending) return <LoadingState />;
  if (!data) {
    return (
      <ErrorState
        offline={error instanceof ApiError && error.isNetworkError}
        onRetry={() => void refetch()}
      />
    );
  }

  const confirm = (title: string, message: string, action: () => void) =>
    Alert.alert(title, message, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('admin.start'), onPress: action },
    ]);

  const started = () => Alert.alert(t('admin.started'));
  const failed = () => Alert.alert(t('admin.failed'));

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Card title={t('admin.status')}>
        <Text style={styles.text}>{t('admin.users', { count: data.userCount })}</Text>
        <Text style={styles.text}>{t('admin.devices', { count: data.deviceCount })}</Text>
        <Text style={styles.text}>
          {data.lastUserSyncAt
            ? t('admin.lastUserSync', { time: formatDateTime(data.lastUserSyncAt, i18n.language) })
            : t('admin.noUserSync')}
        </Text>
      </Card>

      <Card title={t('admin.knowledge')}>
        <Text style={styles.text}>{t('admin.ragDocuments', { count: data.ragDocumentCount })}</Text>
        {data.ragSources.map((source) => (
          <Text key={source.id} style={styles.muted}>
            {source.name}
            {source.isEnabled ? '' : ` (${t('admin.disabled')})`}
            {source.lastSyncedAt ? ` · ${formatDateTime(source.lastSyncedAt, i18n.language)}` : ''}
          </Text>
        ))}
      </Card>

      <Card title={t('admin.actions')}>
        <AppButton
          title={t('admin.syncUsers')}
          icon="people-outline"
          variant="secondary"
          loading={userSync.isPending}
          onPress={() =>
            confirm(t('admin.syncUsers'), t('admin.syncUsersMessage'), () =>
              userSync.mutate(undefined, { onSuccess: started, onError: failed }),
            )
          }
        />
        <AppButton
          title={t('admin.reindex')}
          icon="refresh-outline"
          variant="secondary"
          loading={reindex.isPending}
          onPress={() =>
            confirm(t('admin.reindex'), t('admin.reindexMessage'), () =>
              reindex.mutate(undefined, { onSuccess: started, onError: failed }),
            )
          }
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: font.bodyLarge, color: colors.textPrimary },
  muted: { fontSize: font.body, color: colors.textSecondary },
});
