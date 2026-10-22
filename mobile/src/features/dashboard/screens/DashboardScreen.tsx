import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { HomeScreenProps } from '../../../app/navigation/types';
import { ApiError } from '../../../shared/api/client';
import { ErrorState, LoadingState } from '../../../shared/components/StateViews';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/theme/colors';
import { useLayout } from '../../../shared/theme/responsive';
import { font, spacing } from '../../../shared/theme/tokens';
import { formatDateTime } from '../../../shared/utils/format';
import { useAuthStore } from '../../auth/authStore';
import { useDashboard } from '../api';
import {
  AnnouncementsSection,
  BirthdaysSection,
  NewHiresSection,
  NewsSection,
  TasksSection,
  TicketsSection,
} from '../components/DashboardSections';

export function DashboardScreen({ navigation }: HomeScreenProps<'Dashboard'>) {
  const { t, i18n } = useTranslation();
  const { isTablet } = useLayout();
  const displayName = useAuthStore((state) => state.user?.displayName);
  const { data, error, isPending, isRefetching, isError, refetch, dataUpdatedAt } = useDashboard();

  if (isPending) return <LoadingState />;
  if (!data) {
    return (
      <ErrorState
        offline={error instanceof ApiError && error.isNetworkError}
        onRetry={() => void refetch()}
      />
    );
  }

  const openPost = (postId: string) => navigation.navigate('NewsDetail', { postId });
  const openTickets = () => navigation.navigate('MoreTab', { screen: 'TicketList' });

  const left = (
    <>
      <AnnouncementsSection items={data.announcements} onOpen={openPost} />
      <NewsSection items={data.news} onOpen={openPost} onShowAll={() => navigation.navigate('NewsList')} />
    </>
  );

  const right = (
    <>
      <TasksSection items={data.tasks} onShowAll={() => navigation.navigate('Tasks')} />
      <TicketsSection
        count={data.openTickets.count}
        items={data.openTickets.items}
        onOpen={(ticketId) =>
          navigation.navigate('MoreTab', { screen: 'TicketDetail', params: { ticketId } })
        }
        onShowAll={openTickets}
        onReport={() => navigation.navigate('TicketCreate')}
      />
      <BirthdaysSection items={data.birthdays} />
      <NewHiresSection
        items={data.newHires}
        onOpen={(userId) =>
          navigation.navigate('DirectoryTab', { screen: 'EmployeeDetail', params: { userId } })
        }
      />
    </>
  );

  return (
    <Screen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <Text style={styles.greeting} accessibilityRole="header">
        {t('dashboard.greeting', { name: displayName ?? '' })}
      </Text>

      {isError ? (
        <View style={styles.stale} accessibilityLiveRegion="polite">
          <Text style={styles.staleText}>
            {t('common.staleData', { time: formatDateTime(dataUpdatedAt, i18n.language) })}
          </Text>
        </View>
      ) : null}

      {isTablet ? (
        <View style={styles.columns}>
          <View style={styles.column}>{left}</View>
          <View style={styles.column}>{right}</View>
        </View>
      ) : (
        <>
          {left}
          {right}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: font.headline, fontWeight: '700', color: colors.brandPrimary },
  stale: { backgroundColor: '#FFF4CE', borderRadius: 8, padding: spacing.sm },
  staleText: { fontSize: font.caption, color: colors.textPrimary },
  columns: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  column: { flex: 1, gap: spacing.md },
});
