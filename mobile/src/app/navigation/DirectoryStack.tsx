import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { DirectoryListScreen } from '../../features/directory/screens/DirectoryListScreen';
import { EmployeeDetailScreen } from '../../features/directory/screens/EmployeeDetailScreen';
import { defaultStackOptions } from './stackOptions';
import type { DirectoryStackParamList } from './types';

const Stack = createNativeStackNavigator<DirectoryStackParamList>();

export function DirectoryStack() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen
        name="DirectoryList"
        component={DirectoryListScreen}
        options={{ title: t('nav.directory') }}
      />
      <Stack.Screen
        name="EmployeeDetail"
        component={EmployeeDetailScreen}
        options={{ title: t('nav.employee') }}
      />
    </Stack.Navigator>
  );
}
