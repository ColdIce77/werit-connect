import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { DashboardScreen } from '../../features/dashboard/screens/DashboardScreen';
import { NewsDetailScreen } from '../../features/dashboard/screens/NewsDetailScreen';
import { NewsListScreen } from '../../features/dashboard/screens/NewsListScreen';
import { TasksScreen } from '../../features/dashboard/screens/TasksScreen';
import { NotificationsScreen } from '../../features/notifications/screens/NotificationsScreen';
import { defaultStackOptions } from './stackOptions';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('nav.home') }} />
      <Stack.Screen name="NewsList" component={NewsListScreen} options={{ title: t('nav.news') }} />
      <Stack.Screen
        name="NewsDetail"
        component={NewsDetailScreen}
        options={{ title: t('nav.newsDetail') }}
      />
      <Stack.Screen name="Tasks" component={TasksScreen} options={{ title: t('nav.tasks') }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: t('nav.notifications') }}
      />
    </Stack.Navigator>
  );
}
