import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootScreenProps } from '../../../app/navigation/types';
import type { EmergencyContact } from '../../../shared/api/types';
import { AppButton } from '../../../shared/components/AppButton';
import { Card } from '../../../shared/components/Card';
import { Screen } from '../../../shared/components/Screen';
import { EmptyState, LoadingState } from '../../../shared/components/StateViews';
import { colors } from '../../../shared/theme/colors';
import { font, MIN_TOUCH, radius, spacing } from '../../../shared/theme/tokens';
import { formatDateTime } from '../../../shared/utils/format';
import { useEmergencyContacts } from '../api';

/** Europaweite Notrufnummer. Standortspezifische Nummern kommen aus der Datenbank. */
const EU_EMERGENCY_NUMBER = '112';

function dial(phone: string) {
  void Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => undefined);
}

function CallRow({
  label,
  description,
  phone,
  danger = false,
}: {
  label: string;
  description?: string | null;
  phone: string;
  danger?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('emergency.call')} ${label}, ${phone}`}
      onPress={() => dial(phone)}
      style={({ pressed }) => [styles.callRow, danger && styles.callRowDanger, pressed && styles.pressed]}
    >
      <Ionicons name="call" size={28} color={danger ? colors.brandOnPrimary : colors.brandPrimary} />
      <View style={styles.callTexts}>
        <Text style={[styles.callLabel, danger && styles.onDanger]} numberOfLines={2}>
          {label}
        </Text>
        {description ? (
          <Text style={[styles.callDescription, danger && styles.onDanger]} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.phone, danger && styles.onDanger]}>{phone}</Text>
    </Pressable>
  );
}

export function EmergencyScreen({ navigation }: RootScreenProps<'Emergency'>) {
  const { t, i18n } = useTranslation();
  const { data, isPending } = useEmergencyContacts();

  const groups = useMemo(() => {
    const map = new Map<string, EmergencyContact[]>();
    for (const contact of data?.items ?? []) {
      map.set(contact.category, [...(map.get(contact.category) ?? []), contact]);
    }
    return [...map.entries()];
  }, [data]);

  return (
    <Screen>
      <CallRow label={t('emergency.euNumber')} phone={EU_EMERGENCY_NUMBER} danger />

      {isPending ? (
        <LoadingState />
      ) : groups.length === 0 ? (
        <EmptyState
          title={t('emergency.noneTitle')}
          message={t('emergency.noneMessage')}
          icon="medkit-outline"
        />
      ) : (
        <>
          {groups.map(([category, contacts]) => (
            <Card key={category} title={category}>
              {contacts.map((contact) => (
                <CallRow
                  key={contact.id}
                  label={contact.label}
                  description={[contact.description, contact.locationName].filter(Boolean).join(' · ')}
                  phone={contact.phone}
                />
              ))}
            </Card>
          ))}
          {data?.syncedAt ? (
            <Text style={styles.stand}>
              {t('emergency.stand', { time: formatDateTime(data.syncedAt, i18n.language) })}
            </Text>
          ) : null}
        </>
      )}

      <AppButton title={t('common.close')} variant="secondary" onPress={() => navigation.goBack()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  callRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  callRowDanger: { backgroundColor: colors.danger, borderColor: colors.danger, marginBottom: 0 },
  pressed: { opacity: 0.85 },
  callTexts: { flex: 1, minHeight: MIN_TOUCH, justifyContent: 'center' },
  callLabel: { fontSize: font.bodyLarge, fontWeight: '600', color: colors.textPrimary },
  callDescription: { fontSize: font.body, color: colors.textSecondary },
  phone: { fontSize: font.bodyLarge, fontWeight: '700', color: colors.brandPrimary },
  onDanger: { color: colors.brandOnPrimary },
  stand: { fontSize: font.caption, color: colors.textSecondary, textAlign: 'center' },
});
