import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootScreenProps } from '../../../app/navigation/types';
import { ApiError } from '../../../shared/api/client';
import { AppButton } from '../../../shared/components/AppButton';
import { Screen } from '../../../shared/components/Screen';
import { ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { colors } from '../../../shared/theme/colors';
import { font, radius, spacing } from '../../../shared/theme/tokens';
import { formatDateTime } from '../../../shared/utils/format';
import { useMarkRead, useNotification } from '../api';

/** Vollbild-Anzeige einer Sicherheitswarnung. Lässt sich nur über "Verstanden" schließen. */
export function SecurityAlertScreen({ route, navigation }: RootScreenProps<'SecurityAlert'>) {
  const { t, i18n } = useTranslation();
  const { data, error, isPending, refetch } = useNotification(route.params.notificationId);
  const markRead = useMarkRead();

  const close = () => {
    markRead.mutate(route.params.notificationId);
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.replace('Main', { screen: 'HomeTab', params: { screen: 'Dashboard' } });
  };

  return (
    <Screen>
      <View style={styles.banner}>
        <Ionicons name="warning" size={48} color={colors.brandOnPrimary} />
        <Text style={styles.bannerText} accessibilityRole="header">
          {t('nav.securityAlert')}
        </Text>
      </View>

      {isPending ? (
        <LoadingState />
      ) : !data ? (
        <ErrorState
          offline={error instanceof ApiError && error.isNetworkError}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.time}>{formatDateTime(data.createdAt, i18n.language)}</Text>
          <Text style={styles.body} selectable>
            {data.body}
          </Text>
        </>
      )}

      <AppButton
        title={t('securityAlert.emergency')}
        icon="call-outline"
        variant="danger"
        onPress={() => navigation.navigate('Emergency')}
      />
      <AppButton title={t('securityAlert.understood')} onPress={close} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerText: { fontSize: font.headline, fontWeight: '700', color: colors.brandOnPrimary },
  title: { fontSize: font.headline, fontWeight: '700', color: colors.textPrimary },
  time: { fontSize: font.body, color: colors.textSecondary },
  body: { fontSize: font.bodyLarge, lineHeight: 28, color: colors.textPrimary },
});
