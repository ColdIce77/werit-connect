import { Linking, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiError } from '../../../shared/api/client';
import { AppButton } from '../../../shared/components/AppButton';
import { Avatar } from '../../../shared/components/Avatar';
import { Card } from '../../../shared/components/Card';
import { ListRow } from '../../../shared/components/ListRow';
import { Screen } from '../../../shared/components/Screen';
import { ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { colors } from '../../../shared/theme/colors';
import { font, spacing } from '../../../shared/theme/tokens';
import { useEmployee } from '../api';

interface EmployeeDetailViewProps {
  userId: string;
  /** Wird aufgerufen, wenn der Vorgesetzte angetippt wird */
  onOpenEmployee?: (userId: string) => void;
}

function openLink(url: string) {
  void Linking.openURL(url).catch(() => undefined);
}

/** Wiederverwendet auf dem Smartphone (eigener Bildschirm) und auf dem Tablet (rechte Spalte). */
export function EmployeeDetailView({ userId, onOpenEmployee }: EmployeeDetailViewProps) {
  const { t } = useTranslation();
  const { data, error, isPending, refetch } = useEmployee(userId);

  if (isPending) return <LoadingState />;
  if (!data) {
    return (
      <ErrorState
        offline={error instanceof ApiError && error.isNetworkError}
        onRetry={() => void refetch()}
      />
    );
  }

  const phones = [
    { label: t('directory.phoneMobile'), value: data.phoneMobile },
    { label: t('directory.phoneOffice'), value: data.phoneOffice },
  ].filter((entry): entry is { label: string; value: string } => !!entry.value);

  return (
    <Screen>
      <View style={styles.header}>
        <Avatar name={data.displayName} size={72} />
        <Text style={styles.name} accessibilityRole="header">
          {data.displayName}
        </Text>
        {data.jobTitle ? <Text style={styles.sub}>{data.jobTitle}</Text> : null}
        {[data.departmentName, data.locationName].filter(Boolean).length > 0 ? (
          <Text style={styles.sub}>
            {[data.departmentName, data.locationName].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>

      <Card title={t('directory.contact')}>
        {phones.map((phone) => (
          <AppButton
            key={phone.label}
            title={`${phone.label}: ${phone.value}`}
            icon="call-outline"
            variant="secondary"
            accessibilityLabel={`${t('directory.call')} ${phone.label} ${phone.value}`}
            onPress={() => openLink(`tel:${phone.value.replace(/\s+/g, '')}`)}
          />
        ))}
        <AppButton
          title={data.email}
          icon="mail-outline"
          variant="secondary"
          accessibilityLabel={`${t('directory.sendEmail')} ${data.email}`}
          onPress={() => openLink(`mailto:${data.email}`)}
        />
      </Card>

      {data.managerId && data.managerName ? (
        <Card title={t('directory.manager')}>
          <ListRow
            title={data.managerName}
            left={<Avatar name={data.managerName} />}
            onPress={onOpenEmployee ? () => onOpenEmployee(data.managerId as string) : undefined}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  name: { fontSize: font.headline, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  sub: { fontSize: font.bodyLarge, color: colors.textSecondary, textAlign: 'center' },
});
