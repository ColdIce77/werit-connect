import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AdminHomeScreen } from '../../features/admin/screens/AdminHomeScreen';
import { ApprovalDetailScreen } from '../../features/approvals/screens/ApprovalDetailScreen';
import { ApprovalListScreen } from '../../features/approvals/screens/ApprovalListScreen';
import { useHasPermission } from '../../features/auth/authStore';
import { PublishPostScreen } from '../../features/admin/screens/PublishPostScreen';
import { PublishSecurityAlertScreen } from '../../features/admin/screens/PublishSecurityAlertScreen';
import { MoreMenuScreen } from '../../features/more/screens/MoreMenuScreen';
import { SafetyDetailScreen } from '../../features/safety/screens/SafetyDetailScreen';
import { SafetyListScreen } from '../../features/safety/screens/SafetyListScreen';
import { AboutScreen } from '../../features/settings/screens/AboutScreen';
import { LanguageSettingsScreen } from '../../features/settings/screens/LanguageSettingsScreen';
import { NotificationSettingsScreen } from '../../features/settings/screens/NotificationSettingsScreen';
import { SettingsScreen } from '../../features/settings/screens/SettingsScreen';
import { TicketDetailScreen } from '../../features/tickets/screens/TicketDetailScreen';
import { TicketListScreen } from '../../features/tickets/screens/TicketListScreen';
import { defaultStackOptions } from './stackOptions';
import type { MoreStackParamList } from './types';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  const { t } = useTranslation();
  const canDecideApprovals = useHasPermission('approval.decide');
  const isAdmin = useHasPermission('admin.manage');
  const canPublish = useHasPermission('post.publish');
  const canAlert = useHasPermission('security_alert.publish');

  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: t('nav.more') }} />

      <Stack.Screen
        name="SafetyList"
        component={SafetyListScreen}
        options={{ title: t('nav.safety') }}
      />
      <Stack.Screen
        name="SafetyDetail"
        component={SafetyDetailScreen}
        options={{ title: t('nav.safetyDetail') }}
      />

      <Stack.Screen name="TicketList" component={TicketListScreen} options={{ title: t('nav.tickets') }} />
      <Stack.Screen
        name="TicketDetail"
        component={TicketDetailScreen}
        options={{ title: t('nav.ticket') }}
      />

      {/* Nur sichtbar mit Berechtigung. Das Backend prüft sie zusätzlich. */}
      {canDecideApprovals && (
        <>
          <Stack.Screen
            name="ApprovalList"
            component={ApprovalListScreen}
            options={{ title: t('nav.approvals') }}
          />
          <Stack.Screen
            name="ApprovalDetail"
            component={ApprovalDetailScreen}
            options={{ title: t('nav.approval') }}
          />
        </>
      )}

      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('nav.settings') }} />
      <Stack.Screen
        name="LanguageSettings"
        component={LanguageSettingsScreen}
        options={{ title: t('nav.language') }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ title: t('nav.notificationSettings') }}
      />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: t('nav.about') }} />

      {isAdmin && (
        <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: t('nav.admin') }} />
      )}
      {canPublish && (
        <Stack.Screen
          name="PublishPost"
          component={PublishPostScreen}
          options={{ title: t('publish.postTitle') }}
        />
      )}
      {canAlert && (
        <Stack.Screen
          name="PublishSecurityAlert"
          component={PublishSecurityAlertScreen}
          options={{ title: t('publish.alertTitle') }}
        />
      )}
    </Stack.Navigator>
  );
}
