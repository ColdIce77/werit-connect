import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { RootScreenProps } from '../../../app/navigation/types';
import { AppButton } from '../../../shared/components/AppButton';
import { colors } from '../../../shared/theme/colors';
import { font, spacing } from '../../../shared/theme/tokens';
import { restoreSession, signOut } from '../authService';

export function DeviceBlockedScreen({ route }: RootScreenProps<'DeviceBlocked'>) {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);

  const message = (() => {
    switch (route.params.reason) {
      case 'not_compliant':
        return t('auth.blockedNotCompliant');
      case 'revoked':
        return t('auth.blockedRevoked');
      case 'no_access':
        return t('auth.blockedNoAccess');
    }
  })();

  const recheck = async () => {
    setChecking(true);
    await restoreSession();
    setChecking(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Ionicons name="lock-closed" size={56} color={colors.danger} />
        <Text style={styles.title} accessibilityRole="header">
          {t('auth.blockedTitle')}
        </Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.actions}>
          <AppButton title={t('auth.recheck')} onPress={recheck} loading={checking} />
          <AppButton title={t('auth.signOut')} onPress={() => void signOut()} variant="secondary" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { fontSize: font.headline, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  message: { fontSize: font.bodyLarge, color: colors.textSecondary, textAlign: 'center' },
  actions: { alignSelf: 'stretch', marginTop: spacing.lg, gap: spacing.md },
});
