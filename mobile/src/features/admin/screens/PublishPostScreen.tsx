import { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MoreScreenProps } from '../../../app/navigation/types';
import type { PostType } from '../../../shared/api/types';
import { AppButton } from '../../../shared/components/AppButton';
import { ChoiceChips } from '../../../shared/components/ChoiceChips';
import { Screen } from '../../../shared/components/Screen';
import { TextField } from '../../../shared/components/TextField';
import { colors } from '../../../shared/theme/colors';
import { font, MIN_TOUCH, spacing } from '../../../shared/theme/tokens';
import { usePublishPost } from '../api';

export function PublishPostScreen({ navigation }: MoreScreenProps<'PublishPost'>) {
  const { t, i18n } = useTranslation();
  const publish = usePublishPost();
  const [type, setType] = useState<PostType>('news');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [important, setImportant] = useState(false);
  const [sendPush, setSendPush] = useState(true);
  const [showErrors, setShowErrors] = useState(false);

  const titleError = showErrors && title.trim().length === 0 ? t('publish.required') : null;
  const bodyError = showErrors && body.trim().length === 0 ? t('publish.required') : null;

  const submit = () => {
    if (title.trim().length === 0 || body.trim().length === 0) {
      setShowErrors(true);
      return;
    }

    Alert.alert(t('publish.postConfirmTitle'), t('publish.postConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('publish.send'),
        onPress: () =>
          publish.mutate(
            {
              type,
              priority: important ? 'important' : 'normal',
              language: i18n.language,
              title: title.trim(),
              body: body.trim(),
              sendPush,
            },
            {
              onSuccess: () => {
                Alert.alert(t('publish.postDone'));
                navigation.goBack();
              },
              onError: () => Alert.alert(t('publish.failed')),
            },
          ),
      },
    ]);
  };

  return (
    <Screen>
      <ChoiceChips
        value={type}
        onChange={setType}
        options={[
          { value: 'news', label: t('news.filterNews') },
          { value: 'announcement', label: t('news.filterAnnouncements') },
        ]}
      />

      <TextField
        label={t('publish.title')}
        value={title}
        onChangeText={setTitle}
        maxLength={120}
        error={titleError}
      />
      <TextField
        label={t('publish.text')}
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={5000}
        error={bodyError}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t('publish.important')}</Text>
        <Switch value={important} onValueChange={setImportant} trackColor={{ true: colors.brandPrimary }} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{t('publish.sendPush')}</Text>
        <Switch value={sendPush} onValueChange={setSendPush} trackColor={{ true: colors.brandPrimary }} />
      </View>

      <Text style={styles.hint}>{t('publish.translationHint')}</Text>

      <AppButton title={t('publish.send')} icon="send-outline" loading={publish.isPending} onPress={submit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    minHeight: MIN_TOUCH + 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  switchLabel: { flex: 1, fontSize: font.bodyLarge, color: colors.textPrimary },
  hint: { fontSize: font.caption, color: colors.textSecondary },
});
