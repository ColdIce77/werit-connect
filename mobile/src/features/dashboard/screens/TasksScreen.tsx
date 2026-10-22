import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ApiError } from '../../../shared/api/client';
import type { Task } from '../../../shared/api/types';
import { Card } from '../../../shared/components/Card';
import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { ListRow } from '../../../shared/components/ListRow';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/theme/colors';
import { MIN_TOUCH } from '../../../shared/theme/tokens';
import { formatDate } from '../../../shared/utils/format';
import { useSetTaskDone, useTasks } from '../api';

export function TasksScreen() {
  const { t, i18n } = useTranslation();
  const { data, error, isPending, isRefetching, refetch } = useTasks();
  const setDone = useSetTaskDone();

  const { open, done } = useMemo(
    () => ({
      open: (data ?? []).filter((task) => task.status === 'open'),
      done: (data ?? []).filter((task) => task.status === 'done'),
    }),
    [data],
  );

  if (isPending) return <LoadingState />;
  if (!data) {
    return (
      <ErrorState
        offline={error instanceof ApiError && error.isNetworkError}
        onRetry={() => void refetch()}
      />
    );
  }

  const row = (task: Task) => {
    const isDone = task.status === 'done';
    return (
      <ListRow
        key={task.id}
        title={task.title}
        subtitle={task.dueAt ? t('dashboard.due', { date: formatDate(task.dueAt, i18n.language) }) : task.description}
        left={
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={isDone ? t('tasks.markOpen') : t('tasks.markDone')}
            accessibilityState={{ checked: isDone, busy: setDone.isPending }}
            disabled={setDone.isPending}
            onPress={() => setDone.mutate({ id: task.id, done: !isDone })}
            style={styles.check}
            hitSlop={4}
          >
            <Ionicons
              name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
              size={30}
              color={colors.brandPrimary}
            />
          </Pressable>
        }
      />
    );
  };

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      {open.length === 0 && done.length === 0 ? (
        <EmptyState title={t('tasks.empty')} icon="checkmark-done-outline" />
      ) : (
        <>
          <Card>
            {open.length === 0 ? (
              <Text style={styles.none}>{t('dashboard.noTasks')}</Text>
            ) : (
              open.map(row)
            )}
          </Card>
          {done.length > 0 ? <Card title={t('tasks.done')}>{done.map(row)}</Card> : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  check: { minWidth: MIN_TOUCH, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  none: { color: colors.textSecondary, paddingVertical: 8 },
});
