import { Linking, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiError } from '../../../shared/api/client';
import type { NotificationCategory } from '../../../shared/api/types';
import { AppButton } from '../../../shared/components/AppButton';
import { Card } from '../../../shared/components/Card';
import { Screen } from '../../../shared/components/Screen';
import { ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { colors } from '../../../shared/theme/colors';
import { font, MIN_TOUCH, spacing } from '../../../shared/theme/tokens';
import { useHasPermission } from '../../auth/authStore';
import { useNotificationPreferences, useSetNotificationPreference } from '../api';

export function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const canDecide = useHasPermission('approval.decide');
  const { data, error, isPending, refetch } = useNotificationPreferences();
  const setPreference = useSetNotificationPreference();

  if (isPending) return <LoadingState />;
  if (!data) {
    return (
      <ErrorState
        offline={error instanceof ApiError && error.isNetworkError}
        onRetry={() => void refetch()}
      />
    );
  }

  const label = (category: NotificationCategory) => {
    switch (category) {
      case 'news':
        return t('settings.categoryNews');
      case 'it_incident':
        return t('settings.categoryIncident');
      case 'approval':
        return t('settings.categoryApproval');
      case 'security_alert':
        return t('settings.categorySecurity');
    }
  };

  // Freigaben sind nur für Rollen mit Freigaberecht relevant
  const visible = data.filter((entry) => entry.category !== 'approval' || canDecide);

  return (
    <Screen>
      <Card>
        {visible.map((entry) => {
          const locked = entry.category === 'security_alert';
          return (
            <View key={entry.category} style={styles.row}>
              <View style={styles.texts}>
                <Text style={styles.title}>{label(entry.category)}</Text>
                {locked ? <Text style={styles.hint}>{t('settings.securityLocked')}</Text> : null}
              </View>
              <Switch
                value={locked ? true : entry.enabled}
                disabled={locked}
                onValueChange={(enabled) => setPreference.mutate({ category: entry.category, enabled })}
                trackColor={{ true: colors.brandPrimary }}
                accessibilityLabel={label(entry.category)}
              />
            </View>
          );
        })}
      </Card>

      <Text style={styles.hint}>{t('settings.systemPermissionHint')}</Text>
      <AppButton
        title={t('settings.openSystemSettings')}
        variant="secondary"
        icon="settings-outline"
        onPress={() => void Linking.openSettings()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: MIN_TOUCH + 16, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: font.bodyLarge, color: colors.textPrimary, fontWeight: '500' },
  hint: { fontSize: font.caption, color: colors.textSecondary },
});
