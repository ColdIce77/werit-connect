import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MoreScreenProps } from '../../../app/navigation/types';
import { AppButton } from '../../../shared/components/AppButton';
import { ChoiceChips } from '../../../shared/components/ChoiceChips';
import { Screen } from '../../../shared/components/Screen';
import { TextField } from '../../../shared/components/TextField';
import { colors } from '../../../shared/theme/colors';
import { font, radius, spacing } from '../../../shared/theme/tokens';
import { useLocations, usePublishSecurityAlert } from '../api';

const ALL = 'all';

export function PublishSecurityAlertScreen({ navigation }: MoreScreenProps<'PublishSecurityAlert'>) {
  const { t } = useTranslation();
  const locations = useLocations();
  const publish = usePublishSecurityAlert();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<string>(ALL);
  const [showErrors, setShowErrors] = useState(false);

  const titleError = showErrors && title.trim().length === 0 ? t('publish.required') : null;
  const messageError = showErrors && message.trim().length === 0 ? t('publish.required') : null;

  const targetName =
    target === ALL
      ? t('publish.allLocations')
      : (locations.data?.find((location) => location.id === target)?.name ?? '');

  const submit = () => {
    if (title.trim().length === 0 || message.trim().length === 0) {
      setShowErrors(true);
      return;
    }

    // Sicherheitswarnungen erreichen sofort alle Betroffenen und lassen sich nicht zurückholen.
    Alert.alert(
      t('publish.alertConfirmTitle'),
      t('publish.alertConfirmMessage', { target: targetName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('publish.alertSend'),
          style: 'destructive',
          onPress: () =>
            publish.mutate(
              {
                title: title.trim(),
                message: message.trim(),
                locationId: target === ALL ? null : target,
              },
              {
                onSuccess: () => {
                  Alert.alert(t('publish.alertDone'));
                  navigation.goBack();
                },
                onError: () => Alert.alert(t('publish.failed')),
              },
            ),
        },
      ],
    );
  };

  return (
    <Screen>
      <View style={styles.warning}>
        <Text style={styles.warningText}>{t('publish.alertWarning')}</Text>
      </View>

      <TextField label={t('publish.title')} value={title} onChangeText={setTitle} maxLength={100} error={titleError} />
      <TextField
        label={t('publish.alertMessage')}
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={500}
        error={messageError}
      />

      <Text style={styles.label}>{t('publish.recipients')}</Text>
      <ChoiceChips
        value={target}
        onChange={setTarget}
        options={[
          { value: ALL, label: t('publish.allLocations') },
          ...(locations.data ?? []).map((location) => ({ value: location.id, label: location.name })),
        ]}
      />

      <AppButton
        title={t('publish.alertSend')}
        icon="warning-outline"
        variant="danger"
        loading={publish.isPending}
        onPress={submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  warning: {
    backgroundColor: '#FDE7E9',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warningText: { fontSize: font.body, color: '#8A1C1C' },
  label: { fontSize: font.body, fontWeight: '600', color: colors.textPrimary },
});
