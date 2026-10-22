import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MoreScreenProps } from '../../../app/navigation/types';
import { AppButton } from '../../../shared/components/AppButton';
import { Card } from '../../../shared/components/Card';
import { ListRow } from '../../../shared/components/ListRow';
import { Screen } from '../../../shared/components/Screen';
import { LANGUAGE_NAMES } from '../../../shared/i18n/languages';
import { getLanguagePreference } from '../../../shared/i18n/languageStore';
import { runFullSync } from '../../../shared/offline/sync';
import { useSyncStore } from '../../../shared/offline/syncStore';
import { colors } from '../../../shared/theme/colors';
import { font } from '../../../shared/theme/tokens';
import { formatDateTime } from '../../../shared/utils/format';
import { signOut } from '../../auth/authService';

export function SettingsScreen({ navigation }: MoreScreenProps<'Settings'>) {
  const { t, i18n } = useTranslation();
  const lastSyncAt = useSyncStore((state) => state.lastSyncAt);
  const pending = useSyncStore((state) => state.pending);
  const syncing = useSyncStore((state) => state.syncing);
  const [signingOut, setSigningOut] = useState(false);

  const preference = getLanguagePreference();
  const languageLabel =
    preference === 'system'
      ? `${t('settings.languageSystem')} (${LANGUAGE_NAMES[i18n.language as keyof typeof LANGUAGE_NAMES] ?? i18n.language})`
      : LANGUAGE_NAMES[preference];

  const confirmSignOut = () => {
    Alert.alert(t('settings.signOutTitle'), t('settings.signOutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('auth.signOut'),
        style: 'destructive',
        onPress: () => {
          setSigningOut(true);
          void signOut();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Card>
        <ListRow
          title={t('nav.language')}
          subtitle={languageLabel}
          left={<Ionicons name="language-outline" size={24} color={colors.brandPrimary} />}
          onPress={() => navigation.navigate('LanguageSettings')}
        />
        <ListRow
          title={t('nav.notificationSettings')}
          left={<Ionicons name="notifications-outline" size={24} color={colors.brandPrimary} />}
          onPress={() => navigation.navigate('NotificationSettings')}
        />
        <ListRow
          title={t('nav.about')}
          left={<Ionicons name="information-circle-outline" size={24} color={colors.brandPrimary} />}
          onPress={() => navigation.navigate('About')}
        />
      </Card>

      <Card title={t('settings.syncTitle')}>
        <Text style={styles.text}>
          {lastSyncAt
            ? t('settings.syncLast', { time: formatDateTime(lastSyncAt, i18n.language) })
            : t('settings.syncNever')}
        </Text>
        {pending > 0 ? <Text style={styles.text}>{t('settings.syncPending', { count: pending })}</Text> : null}
        <AppButton
          title={t('settings.syncNow')}
          icon="sync-outline"
          variant="secondary"
          loading={syncing}
          onPress={() => void runFullSync({ force: true })}
        />
      </Card>

      <AppButton title={t('auth.signOut')} variant="danger" loading={signingOut} onPress={confirmSignOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: font.body, color: colors.textPrimary },
});
