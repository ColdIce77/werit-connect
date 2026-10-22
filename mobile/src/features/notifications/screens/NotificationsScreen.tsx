import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { notificationToPath } from '../../../app/navigation/linking';
import type { HomeScreenProps } from '../../../app/navigation/types';
import { ApiError } from '../../../shared/api/client';
import type { NotificationCategory, NotificationItem } from '../../../shared/api/types';
import { AppButton } from '../../../shared/components/AppButton';
import { ListRow } from '../../../shared/components/ListRow';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { colors } from '../../../shared/theme/colors';
import { CONTENT_MAX_WIDTH, font, spacing } from '../../../shared/theme/tokens';
import { formatDateTime } from '../../../shared/utils/format';
import { useMarkAllRead, useMarkRead, useNotifications } from '../api';

const ICONS: Record<NotificationCategory, React.ComponentProps<typeof Ionicons>['name']> = {
  news: 'newspaper-outline',
  it_incident: 'construct-outline',
  security_alert: 'warning',
  approval: 'checkmark-done-outline',
};

export function NotificationsScreen(_props: HomeScreenProps<'Notifications'>) {
  const { t, i18n } = useTranslation();
  const { data, error, isPending, isRefetching, refetch } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const open = (item: NotificationItem) => {
    if (!item.readAt) markRead.mutate(item.id);
    const path = notificationToPath({
      category: item.category,
      notificationId: item.id,
      referenceType: item.referenceType ?? undefined,
      referenceId: item.referenceId ?? undefined,
    });
    // Derselbe Weg wie bei einer angetippten Push-Meldung
    void Linking.openURL(Linking.createURL(path)).catch(() => undefined);
  };

  if (isPending) return <LoadingState />;
  if (!data) {
    return (
      <ErrorState
        offline={error instanceof ApiError && error.isNetworkError}
        onRetry={() => void refetch()}
      />
    );
  }

  const hasUnread = data.some((item) => !item.readAt);

  return (
    <View style={styles.root}>
      {hasUnread ? (
        <View style={styles.top}>
          <AppButton
            title={t('notifications.markAllRead')}
            icon="checkmark-done-outline"
            variant="secondary"
            loading={markAllRead.isPending}
            onPress={() => markAllRead.mutate()}
          />
        </View>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState title={t('notifications.empty')} icon="notifications-off-outline" />}
        renderItem={({ item }) => {
          const unread = !item.readAt;
          return (
            <ListRow
              title={item.title}
              subtitle={`${item.body}\n${formatDateTime(item.createdAt, i18n.language)}`}
              accessibilityLabel={`${unread ? t('notifications.unread') + ': ' : ''}${item.title}`}
              left={
                <Ionicons
                  name={ICONS[item.category]}
                  size={26}
                  color={item.category === 'security_alert' ? colors.danger : colors.brandPrimary}
                />
              }
              right={unread ? <View style={styles.dot} accessibilityLabel={t('notifications.unread')} /> : undefined}
              onPress={() => open(item)}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  top: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', padding: spacing.md },
  list: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.brandPrimary },
  hint: { fontSize: font.caption, color: colors.textSecondary },
});
