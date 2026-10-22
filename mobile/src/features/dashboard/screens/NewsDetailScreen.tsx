import { Image, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { HomeScreenProps } from '../../../app/navigation/types';
import { ApiError } from '../../../shared/api/client';
import { ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/theme/colors';
import { font, radius, spacing } from '../../../shared/theme/tokens';
import { formatDate } from '../../../shared/utils/format';
import { usePost } from '../api';

export function NewsDetailScreen({ route }: HomeScreenProps<'NewsDetail'>) {
  const { t, i18n } = useTranslation();
  const { data, error, isPending, refetch } = usePost(route.params.postId);

  if (isPending) return <LoadingState />;
  if (!data) {
    return (
      <ErrorState
        offline={error instanceof ApiError && error.isNetworkError}
        onRetry={() => void refetch()}
      />
    );
  }

  const meta = [
    formatDate(data.publishAt, i18n.language),
    data.authorName ? t('news.by', { author: data.authorName }) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen>
      {data.imageUrl ? (
        <Image
          source={{ uri: data.imageUrl }}
          style={styles.image}
          accessibilityIgnoresInvertColors
          resizeMode="cover"
        />
      ) : null}
      <Text style={styles.title} accessibilityRole="header">
        {data.title}
      </Text>
      <Text style={styles.meta}>{meta}</Text>
      {/* Der Text wird bewusst als reiner Text angezeigt, kein HTML. */}
      <Text style={styles.body} selectable>
        {data.body}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: colors.border },
  title: { fontSize: font.headline, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: font.body, color: colors.textSecondary },
  body: { fontSize: font.bodyLarge, lineHeight: 28, color: colors.textPrimary, paddingBottom: spacing.lg },
});
