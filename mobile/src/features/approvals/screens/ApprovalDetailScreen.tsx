import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MoreScreenProps } from '../../../app/navigation/types';
import { ApiError } from '../../../shared/api/client';
import { AppButton } from '../../../shared/components/AppButton';
import { Card } from '../../../shared/components/Card';
import { Screen } from '../../../shared/components/Screen';
import { ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { TextField } from '../../../shared/components/TextField';
import { colors } from '../../../shared/theme/colors';
import { font, spacing } from '../../../shared/theme/tokens';
import { formatDateTime } from '../../../shared/utils/format';
import { useApproval, useDecideApproval } from '../api';
import { approvalTone } from './ApprovalListScreen';

export function ApprovalDetailScreen({ route, navigation }: MoreScreenProps<'ApprovalDetail'>) {
  const { t, i18n } = useTranslation();
  const { data, error, isPending, refetch } = useApproval(route.params.approvalId);
  const decide = useDecideApproval();
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  if (isPending) return <LoadingState />;
  if (!data) {
    return (
      <ErrorState
        offline={error instanceof ApiError && error.isNetworkError}
        onRetry={() => void refetch()}
      />
    );
  }

  const submit = (decision: 'approved' | 'rejected') => {
    // Eine Ablehnung braucht eine Begründung, damit die antragstellende Person sie nachvollziehen kann
    if (decision === 'rejected' && comment.trim().length === 0) {
      setCommentError(t('approvals.commentRequired'));
      return;
    }
    setCommentError(null);

    Alert.alert(
      decision === 'approved' ? t('approvals.confirmApproveTitle') : t('approvals.confirmRejectTitle'),
      data.title,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: decision === 'approved' ? t('approvals.approve') : t('approvals.reject'),
          style: decision === 'approved' ? 'default' : 'destructive',
          onPress: () =>
            decide.mutate(
              { id: data.id, decision, comment: comment.trim() || null },
              {
                onSuccess: () => navigation.goBack(),
                onError: () => Alert.alert(t('approvals.decideFailed')),
              },
            ),
        },
      ],
    );
  };

  return (
    <Screen>
      <Text style={styles.title} accessibilityRole="header">
        {data.title}
      </Text>
      <StatusBadge label={t(`approvals.status.${data.status}`)} tone={approvalTone(data.status)} />

      <Card>
        <Text style={styles.meta}>
          {t('approvals.requestedBy', { name: data.requesterName })}
        </Text>
        <Text style={styles.meta}>{formatDateTime(data.createdAt, i18n.language)}</Text>
        {data.description ? <Text style={styles.body}>{data.description}</Text> : null}
      </Card>

      {data.status === 'pending' ? (
        <View style={styles.actions}>
          <TextField
            label={t('approvals.comment')}
            value={comment}
            onChangeText={setComment}
            placeholder={t('approvals.commentPlaceholder')}
            multiline
            maxLength={500}
            error={commentError}
          />
          <AppButton
            title={t('approvals.approve')}
            icon="checkmark-circle-outline"
            loading={decide.isPending}
            onPress={() => submit('approved')}
          />
          <AppButton
            title={t('approvals.reject')}
            icon="close-circle-outline"
            variant="danger"
            disabled={decide.isPending}
            onPress={() => submit('rejected')}
          />
        </View>
      ) : (
        <Card title={t('approvals.decision')}>
          <Text style={styles.meta}>
            {data.decidedAt ? formatDateTime(data.decidedAt, i18n.language) : ''}
          </Text>
          {data.decisionComment ? <Text style={styles.body}>{data.decisionComment}</Text> : null}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: font.headline, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: font.body, color: colors.textSecondary },
  body: { fontSize: font.bodyLarge, color: colors.textPrimary, lineHeight: 26 },
  actions: { gap: spacing.md },
});
