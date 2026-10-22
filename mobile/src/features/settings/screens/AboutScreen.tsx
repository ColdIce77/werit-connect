import Constants from 'expo-constants';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '../../../shared/components/Card';
import { Screen } from '../../../shared/components/Screen';
import { config } from '../../../shared/config';
import { colors } from '../../../shared/theme/colors';
import { font, spacing } from '../../../shared/theme/tokens';
import { useAuthStore } from '../../auth/authStore';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} selectable>
        {value}
      </Text>
    </View>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function AboutScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);

  const roleNames = roles.length > 0 ? roles.map((role) => t(`about.role.${role}`)).join(', ') : t('about.role.employee');

  return (
    <Screen>
      <Card title={t('auth.title')}>
        <Row label={t('about.version')} value={Constants.expoConfig?.version ?? '-'} />
        <Row label={t('about.platform')} value={`${Platform.OS} ${String(Platform.Version)}`} />
        <Row label={t('about.server')} value={hostOf(config.apiBaseUrl)} />
      </Card>

      {user ? (
        <Card title={t('about.account')}>
          <Row label={t('about.name')} value={user.displayName} />
          <Row label={t('about.email')} value={user.email} />
          <Row label={t('about.roles')} value={roleNames} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { gap: 2, paddingVertical: spacing.xs },
  label: { fontSize: font.caption, color: colors.textSecondary },
  value: { fontSize: font.bodyLarge, color: colors.textPrimary },
});
