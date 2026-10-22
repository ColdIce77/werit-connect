import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type {
  BirthdayEntry,
  NewHire,
  Post,
  Task,
  TicketSummary,
} from '../../../shared/api/types';
import { Avatar } from '../../../shared/components/Avatar';
import { Card } from '../../../shared/components/Card';
import { ListRow } from '../../../shared/components/ListRow';
import { colors } from '../../../shared/theme/colors';
import { font, spacing } from '../../../shared/theme/tokens';
import { formatDate, formatDayMonth } from '../../../shared/utils/format';

function Hint({ text }: { text: string }) {
  return <Text style={styles.hint}>{text}</Text>;
}

function PostRow({ post, onPress }: { post: Post; onPress: () => void }) {
  const { i18n } = useTranslation();
  return (
    <ListRow
      title={post.title}
      subtitle={`${formatDate(post.publishAt, i18n.language)}${post.summary ? ` · ${post.summary}` : ''}`}
      onPress={onPress}
    />
  );
}

export function AnnouncementsSection({
  items,
  onOpen,
}: {
  items: Post[];
  onOpen: (postId: string) => void;
}) {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <Card title={t('dashboard.announcements')} accentColor={colors.danger}>
      {items.map((post) => (
        <PostRow key={post.id} post={post} onPress={() => onOpen(post.id)} />
      ))}
    </Card>
  );
}

export function NewsSection({
  items,
  onOpen,
  onShowAll,
}: {
  items: Post[];
  onOpen: (postId: string) => void;
  onShowAll: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Card title={t('dashboard.news')} actionLabel={t('dashboard.showAll')} onAction={onShowAll}>
      {items.length === 0 ? (
        <Hint text={t('dashboard.noNews')} />
      ) : (
        items.map((post) => <PostRow key={post.id} post={post} onPress={() => onOpen(post.id)} />)
      )}
    </Card>
  );
}

export function TasksSection({ items, onShowAll }: { items: Task[]; onShowAll: () => void }) {
  const { t, i18n } = useTranslation();
  return (
    <Card title={t('dashboard.tasks')} actionLabel={t('dashboard.showAll')} onAction={onShowAll}>
      {items.length === 0 ? (
        <Hint text={t('dashboard.noTasks')} />
      ) : (
        items.map((task) => (
          <ListRow
            key={task.id}
            title={task.title}
            subtitle={task.dueAt ? t('dashboard.due', { date: formatDate(task.dueAt, i18n.language) }) : null}
            left={<Ionicons name="ellipse-outline" size={24} color={colors.brandPrimary} />}
            onPress={onShowAll}
          />
        ))
      )}
    </Card>
  );
}

export function BirthdaysSection({ items }: { items: BirthdayEntry[] }) {
  const { t, i18n } = useTranslation();
  return (
    <Card title={t('dashboard.birthdays')}>
      {items.length === 0 ? (
        <Hint text={t('dashboard.noBirthdays')} />
      ) : (
        items.map((entry) => (
          <ListRow
            key={entry.userId}
            title={entry.displayName}
            subtitle={
              entry.isToday ? t('dashboard.today') : formatDayMonth(entry.day, entry.month, i18n.language)
            }
            left={<Avatar name={entry.displayName} />}
          />
        ))
      )}
    </Card>
  );
}

export function NewHiresSection({
  items,
  onOpen,
}: {
  items: NewHire[];
  onOpen: (userId: string) => void;
}) {
  const { t, i18n } = useTranslation();
  return (
    <Card title={t('dashboard.newHires')}>
      {items.length === 0 ? (
        <Hint text={t('dashboard.noNewHires')} />
      ) : (
        items.map((hire) => (
          <ListRow
            key={hire.userId}
            title={hire.displayName}
            subtitle={[hire.jobTitle, hire.departmentName, t('dashboard.since', { date: formatDate(hire.hireDate, i18n.language) })]
              .filter(Boolean)
              .join(' · ')}
            left={<Avatar name={hire.displayName} />}
            onPress={() => onOpen(hire.userId)}
          />
        ))
      )}
    </Card>
  );
}

export function TicketsSection({
  count,
  items,
  onOpen,
  onShowAll,
  onReport,
}: {
  count: number;
  items: TicketSummary[];
  onOpen: (ticketId: string) => void;
  onShowAll: () => void;
  onReport: () => void;
}) {
  const { t, i18n } = useTranslation();
  return (
    <Card
      title={`${t('dashboard.openTickets')} (${count})`}
      actionLabel={t('dashboard.showAll')}
      onAction={onShowAll}
    >
      {items.length === 0 ? (
        <Hint text={t('dashboard.noTickets')} />
      ) : (
        items.map((ticket) => (
          <ListRow
            key={ticket.id}
            title={ticket.title}
            subtitle={`${t(`tickets.status.${ticket.status}`)} · ${formatDate(ticket.updatedAt, i18n.language)}`}
            onPress={() => onOpen(ticket.id)}
          />
        ))
      )}
      <View style={styles.reportWrap}>
        <ListRow
          title={t('dashboard.reportIssue')}
          left={<Ionicons name="construct-outline" size={24} color={colors.brandPrimary} />}
          onPress={onReport}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: font.body, color: colors.textSecondary, paddingVertical: spacing.sm },
  reportWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
  },
});
