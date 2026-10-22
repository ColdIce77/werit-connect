import { Linking, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiError } from '../../../shared/api/client';
import { AppButton } from '../../../shared/components/AppButton';
import { Card } from '../../../shared/components/Card';
import { Screen } from '../../../shared/components/Screen';
import { ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { colors } from '../../../shared/theme/colors';
import { font } from '../../../shared/theme/tokens';
import { formatDate } from '../../../shared/utils/format';
import { formatBytes } from '../../../shared/utils/text';
import { useDocument, useOpenDocument } from '../api';

/** Wiederverwendet auf dem Smartphone (eigener Bildschirm) und auf dem Tablet (rechte Spalte). */
export function DocumentDetailView({ documentId }: { documentId: string }) {
  const { t, i18n } = useTranslation();
  const { data, error, isPending, refetch } = useDocument(documentId);
  const open = useOpenDocument();

  if (isPending) return <LoadingState />;
  if (!data) {
    return (
      <ErrorState
        offline={error instanceof ApiError && error.isNetworkError}
        onRetry={() => void refetch()}
      />
    );
  }

  const { doc, availableOffline, fromCache } = data;
  const meta = [
    doc.category,
    formatBytes(doc.sizeBytes),
    doc.updatedAt ? formatDate(doc.updatedAt, i18n.language) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen>
      <Text style={styles.title} accessibilityRole="header">
        {doc.title}
      </Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}

      {availableOffline ? <StatusBadge label={t('documents.availableOffline')} tone="success" /> : null}
      {fromCache ? <Text style={styles.note}>{t('documents.offlineCopy')}</Text> : null}

      <Card>
        <AppButton
          title={availableOffline ? t('documents.open') : t('documents.downloadAndOpen')}
          icon="open-outline"
          loading={open.isPending}
          // Ohne Verbindung und ohne lokale Kopie lässt sich nichts öffnen
          disabled={fromCache && !availableOffline}
          onPress={() => open.mutate(doc)}
        />
        {open.isError ? (
          <Text style={styles.error} accessibilityLiveRegion="polite">
            {t('documents.openFailed')}
          </Text>
        ) : null}
        {doc.webUrl && !fromCache ? (
          <AppButton
            title={t('documents.openInSharePoint')}
            icon="globe-outline"
            variant="secondary"
            onPress={() => void Linking.openURL(doc.webUrl).catch(() => undefined)}
          />
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.headline, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: font.body, color: colors.textSecondary },
  note: { fontSize: font.body, color: colors.textSecondary },
  error: { fontSize: font.body, color: colors.danger },
});
