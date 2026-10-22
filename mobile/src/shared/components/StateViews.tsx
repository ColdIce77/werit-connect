import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../theme/colors';
import { font, spacing } from '../theme/tokens';
import { AppButton } from './AppButton';

export function LoadingState({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.center} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colors.brandPrimary} />
      <Text style={styles.message}>{message ?? t('common.loading')}</Text>
    </View>
  );
}

interface ErrorStateProps {
  /** true, wenn keine Verbindung besteht */
  offline?: boolean;
  onRetry?: () => void;
}

export function ErrorState({ offline = false, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <Ionicons
        name={offline ? 'cloud-offline-outline' : 'alert-circle-outline'}
        size={44}
        color={colors.textSecondary}
      />
      <Text style={styles.title}>{offline ? t('common.offlineTitle') : t('common.errorTitle')}</Text>
      <Text style={styles.message}>
        {offline ? t('common.offlineMessage') : t('common.errorMessage')}
      </Text>
      {onRetry ? <AppButton title={t('common.retry')} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

export function EmptyState({ title, message, icon = 'file-tray-outline' }: EmptyStateProps) {
  return (
    <View style={styles.center}>
      <Ionicons name={icon} size={44} color={colors.textSecondary} />
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: { fontSize: font.title, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  message: { fontSize: font.body, color: colors.textSecondary, textAlign: 'center' },
});
