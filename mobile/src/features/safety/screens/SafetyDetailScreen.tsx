import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MoreScreenProps } from '../../../app/navigation/types';
import { AppButton } from '../../../shared/components/AppButton';
import { Card } from '../../../shared/components/Card';
import { Screen } from '../../../shared/components/Screen';
import { EmptyState, LoadingState } from '../../../shared/components/StateViews';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { colors } from '../../../shared/theme/colors';
import { font, spacing } from '../../../shared/theme/tokens';
import { formatDate } from '../../../shared/utils/format';
import { useAcknowledgeSafety, useSafetyItem } from '../api';
import { statusLabel } from './SafetyListScreen';

export function SafetyDetailScreen({ route, navigation }: MoreScreenProps<'SafetyDetail'>) {
  const { t, i18n } = useTranslation();
  const { data: item, isPending } = useSafetyItem(route.params.instructionId);
  const acknowledge = useAcknowledgeSafety();

  if (isPending) return <LoadingState />;
  if (!item) return <EmptyState title={t('safety.notFound')} icon="alert-circle-outline" />;

  const { label, tone } = statusLabel(item, t);

  return (
    <Screen>
      <Text style={styles.title} accessibilityRole="header">
        {item.title}
      </Text>

      <View style={styles.badges}>
        <StatusBadge label={label} tone={tone} />
        {item.isMandatory ? <StatusBadge label={t('safety.mandatory')} tone="neutral" /> : null}
      </View>

      <Text style={styles.meta}>
        {[
          t('safety.version', { version: item.version }),
          item.validUntil ? t('safety.validUntil', { date: formatDate(item.validUntil, i18n.language) }) : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>

      <Card>
        <Text style={styles.body} selectable>
          {item.body}
        </Text>
      </Card>

      {item.documentId ? (
        <AppButton
          title={t('safety.openAttachment')}
          icon="document-attach-outline"
          variant="secondary"
          onPress={() =>
            navigation.navigate('DocumentsTab', {
              screen: 'DocumentViewer',
              params: { documentId: item.documentId as string },
            })
          }
        />
      ) : null}

      {item.status === 'acknowledged' ? (
        <Text style={styles.confirmed} accessibilityLiveRegion="polite">
          {item.pendingSync ? t('safety.pendingSync') : t('safety.confirmed')}
        </Text>
      ) : (
        <AppButton
          title={t('safety.acknowledge')}
          icon="checkmark-circle-outline"
          loading={acknowledge.isPending}
          onPress={() => acknowledge.mutate(item)}
        />
      )}

      {acknowledge.isError ? <Text style={styles.error}>{t('safety.acknowledgeFailed')}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.headline, fontWeight: '700', color: colors.textPrimary },
  badges: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  meta: { fontSize: font.body, color: colors.textSecondary },
  body: { fontSize: font.bodyLarge, lineHeight: 28, color: colors.textPrimary },
  confirmed: { fontSize: font.bodyLarge, fontWeight: '600', color: '#0E5A0B', textAlign: 'center' },
  error: { fontSize: font.body, color: colors.danger, textAlign: 'center' },
});
