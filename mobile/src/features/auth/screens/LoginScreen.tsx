import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppButton } from '../../../shared/components/AppButton';
import { colors } from '../../../shared/theme/colors';
import { font, spacing } from '../../../shared/theme/tokens';
import { signIn, type SignInResult } from '../authService';

export function LoginScreen() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SignInResult | null>(null);

  const onSignIn = async () => {
    setBusy(true);
    setResult(null);
    const outcome = await signIn();
    // Bei Erfolg wechselt die Navigation von selbst, der Bildschirm verschwindet.
    setResult(outcome);
    setBusy(false);
  };

  const errorText = (() => {
    switch (result) {
      case 'cancelled':
        return t('auth.errorCancelled');
      case 'config_error':
        return t('auth.errorConfig');
      case 'failed':
        return t('auth.errorFailed');
      default:
        return null;
    }
  })();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.brand} accessibilityRole="header">
          {t('auth.title')}
        </Text>
        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>

        <View style={styles.actions}>
          <AppButton
            title={busy ? t('auth.signingIn') : t('auth.signIn')}
            icon="log-in-outline"
            onPress={onSignIn}
            loading={busy}
          />
          {errorText ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {errorText}
            </Text>
          ) : null}
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
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  brand: { fontSize: 34, fontWeight: '700', color: colors.brandPrimary },
  subtitle: { fontSize: font.bodyLarge, color: colors.textSecondary },
  actions: { marginTop: spacing.lg, gap: spacing.md },
  error: { fontSize: font.body, color: colors.danger },
});
