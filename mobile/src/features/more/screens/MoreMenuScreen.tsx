import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Linking, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MoreScreenProps, RootStackParamList } from '../../../app/navigation/types';
import { Card } from '../../../shared/components/Card';
import { ListRow } from '../../../shared/components/ListRow';
import { Screen } from '../../../shared/components/Screen';
import { colors } from '../../../shared/theme/colors';
import { useHasPermission } from '../../auth/authStore';
import { useVedaLink } from '../useVedaLink';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icon = (name: IconName, color: string = colors.brandPrimary) => (
  <Ionicons name={name} size={26} color={color} />
);

export function MoreMenuScreen({ navigation }: MoreScreenProps<'MoreMenu'>) {
  const { t } = useTranslation();
  const canDecide = useHasPermission('approval.decide');
  const canPublish = useHasPermission('post.publish');
  const canAlert = useHasPermission('security_alert.publish');
  const isAdmin = useHasPermission('admin.manage');
  const { data: veda } = useVedaLink();
  const root = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <Screen>
      {/* Notfallkontakte sind von überall erreichbar und hier zusätzlich hervorgehoben */}
      <View style={styles.emergency}>
        <ListRow
          title={t('nav.emergency')}
          subtitle={t('more.emergencyHint')}
          left={icon('alert-circle', colors.danger)}
          onPress={() => root.navigate('Emergency')}
        />
      </View>

      <Card title={t('more.work')}>
        <ListRow
          title={t('nav.safety')}
          left={icon('shield-checkmark-outline')}
          onPress={() => navigation.navigate('SafetyList')}
        />
        <ListRow
          title={t('nav.tickets')}
          left={icon('construct-outline')}
          onPress={() => navigation.navigate('TicketList')}
        />
        <ListRow
          title={t('nav.ticketCreate')}
          left={icon('add-circle-outline')}
          onPress={() => root.navigate('TicketCreate')}
        />
        {canDecide ? (
          <ListRow
            title={t('nav.approvals')}
            left={icon('checkmark-done-outline')}
            onPress={() => navigation.navigate('ApprovalList')}
          />
        ) : null}
        {veda ? (
          <ListRow
            title={veda.label || t('nav.vacation')}
            subtitle={t('more.vedaHint')}
            left={icon('calendar-outline')}
            right={<Ionicons name="open-outline" size={20} color={colors.textSecondary} />}
            onPress={() => void Linking.openURL(veda.url).catch(() => undefined)}
          />
        ) : null}
      </Card>

      {canPublish || canAlert ? (
        <Card title={t('more.publish')}>
          {canPublish ? (
            <ListRow
              title={t('publish.postTitle')}
              left={icon('megaphone-outline')}
              onPress={() => navigation.navigate('PublishPost')}
            />
          ) : null}
          {canAlert ? (
            <ListRow
              title={t('publish.alertTitle')}
              left={icon('warning-outline', colors.danger)}
              onPress={() => navigation.navigate('PublishSecurityAlert')}
            />
          ) : null}
        </Card>
      ) : null}

      <Card>
        {isAdmin ? (
          <ListRow
            title={t('nav.admin')}
            left={icon('construct')}
            onPress={() => navigation.navigate('AdminHome')}
          />
        ) : null}
        <ListRow
          title={t('nav.settings')}
          left={icon('settings-outline')}
          onPress={() => navigation.navigate('Settings')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emergency: {
    backgroundColor: '#FDE7E9',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.danger,
  },
});
