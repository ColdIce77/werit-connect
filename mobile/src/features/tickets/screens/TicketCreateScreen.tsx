import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootScreenProps } from '../../../app/navigation/types';
import { AppButton } from '../../../shared/components/AppButton';
import { Screen } from '../../../shared/components/Screen';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { colors } from '../../../shared/theme/colors';
import { font, MIN_TOUCH, radius, spacing } from '../../../shared/theme/tokens';
import { useCreateTicket, type CreateTicketResult } from '../api';

const CATEGORIES = ['hardware', 'software', 'network', 'account', 'other'] as const;
type Category = (typeof CATEGORIES)[number];

const MIN_TITLE_LENGTH = 3;

export function TicketCreateScreen({ navigation }: RootScreenProps<'TicketCreate'>) {
  const { t } = useTranslation();
  const createTicket = useCreateTicket();

  const [category, setCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [result, setResult] = useState<CreateTicketResult | null>(null);

  const titleValid = title.trim().length >= MIN_TITLE_LENGTH;

  const categoryLabel = (value: Category) => {
    switch (value) {
      case 'hardware':
        return t('tickets.categoryHardware');
      case 'software':
        return t('tickets.categorySoftware');
      case 'network':
        return t('tickets.categoryNetwork');
      case 'account':
        return t('tickets.categoryAccount');
      case 'other':
        return t('tickets.categoryOther');
    }
  };

  const submit = () => {
    createTicket.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority: urgent ? 'high' : 'normal',
      },
      { onSuccess: setResult },
    );
  };

  if (result) {
    return (
      <Screen>
        <View style={styles.done}>
          <Text style={styles.doneTitle} accessibilityRole="header">
            {result === 'sent' ? t('tickets.sentTitle') : t('tickets.queuedTitle')}
          </Text>
          <Text style={styles.doneText}>
            {result === 'sent' ? t('tickets.sentMessage') : t('tickets.queuedMessage')}
          </Text>
          <AppButton title={t('common.close')} onPress={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Text style={styles.label}>{t('tickets.category')}</Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {CATEGORIES.map((value) => {
            const selected = category === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setCategory(value)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {categoryLabel(value)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>{t('tickets.titleLabel')}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={t('tickets.titlePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          maxLength={120}
          accessibilityLabel={t('tickets.titleLabel')}
        />

        <Text style={styles.label}>{t('tickets.descriptionLabel')}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('tickets.descriptionPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
          maxLength={2000}
          accessibilityLabel={t('tickets.descriptionLabel')}
        />

        <View style={styles.urgentRow}>
          <View style={styles.urgentTexts}>
            <Text style={styles.urgentTitle}>{t('tickets.urgentLabel')}</Text>
            <Text style={styles.urgentHint}>{t('tickets.urgentHint')}</Text>
          </View>
          <Switch
            value={urgent}
            onValueChange={setUrgent}
            trackColor={{ true: colors.brandPrimary }}
            accessibilityLabel={t('tickets.urgentLabel')}
          />
        </View>

        {createTicket.isError ? <StatusBadge label={t('tickets.sendFailed')} tone="danger" /> : null}

        <AppButton
          title={t('tickets.submit')}
          icon="send-outline"
          disabled={!titleValid}
          loading={createTicket.isPending}
          onPress={submit}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { fontSize: font.body, fontWeight: '600', color: colors.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: font.body, color: colors.textPrimary },
  chipTextSelected: { color: colors.brandOnPrimary, fontWeight: '600' },
  input: {
    minHeight: MIN_TOUCH + 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: font.bodyLarge,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 140, paddingTop: spacing.sm },
  urgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
  },
  urgentTexts: { flex: 1 },
  urgentTitle: { fontSize: font.bodyLarge, fontWeight: '600', color: colors.textPrimary },
  urgentHint: { fontSize: font.body, color: colors.textSecondary },
  done: { gap: spacing.md, paddingVertical: spacing.xl },
  doneTitle: { fontSize: font.headline, fontWeight: '700', color: colors.brandPrimary },
  doneText: { fontSize: font.bodyLarge, color: colors.textPrimary },
});
