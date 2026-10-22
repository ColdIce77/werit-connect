import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { HomeScreenProps } from '../../../app/navigation/types';
import { ApiError } from '../../../shared/api/client';
import type { PostType } from '../../../shared/api/types';
import { ListRow } from '../../../shared/components/ListRow';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { colors } from '../../../shared/theme/colors';
import { CONTENT_MAX_WIDTH, font, MIN_TOUCH, radius, spacing } from '../../../shared/theme/tokens';
import { formatDate } from '../../../shared/utils/format';
import { usePosts } from '../api';

type Filter = PostType | undefined;

export function NewsListScreen({ navigation }: HomeScreenProps<'NewsList'>) {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<Filter>(undefined);
  const { data, error, isPending, isRefetching, refetch } = usePosts(filter);

  const filters: { value: Filter; label: string }[] = [
    { value: undefined, label: t('news.filterAll') },
    { value: 'news', label: t('news.filterNews') },
    { value: 'announcement', label: t('news.filterAnnouncements') },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.filters} accessibilityRole="tablist">
        {filters.map((item) => {
          const selected = item.value === filter;
          return (
            <Pressable
              key={item.label}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setFilter(item.value)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {isPending ? (
        <LoadingState />
      ) : !data ? (
        <ErrorState
          offline={error instanceof ApiError && error.isNetworkError}
          onRetry={() => void refetch()}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(post) => post.id}
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title={t('news.empty')} icon="newspaper-outline" />}
          renderItem={({ item }) => (
            <ListRow
              title={item.title}
              subtitle={[formatDate(item.publishAt, i18n.language), item.summary]
                .filter(Boolean)
                .join(' · ')}
              right={
                item.priority === 'important' ? (
                  <Text style={styles.important}>{t('dashboard.important')}</Text>
                ) : undefined
              }
              onPress={() => navigation.navigate('NewsDetail', { postId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
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
  list: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  important: { fontSize: font.caption, fontWeight: '600', color: colors.danger },
});
