import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { DocumentListScreen } from '../../features/documents/screens/DocumentListScreen';
import { DocumentViewerScreen } from '../../features/documents/screens/DocumentViewerScreen';
import { RecentDocumentsScreen } from '../../features/documents/screens/RecentDocumentsScreen';
import { defaultStackOptions } from './stackOptions';
import type { DocumentsStackParamList } from './types';

const Stack = createNativeStackNavigator<DocumentsStackParamList>();

export function DocumentsStack() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen
        name="DocumentList"
        component={DocumentListScreen}
        options={{ title: t('nav.documents') }}
      />
      <Stack.Screen
        name="RecentDocuments"
        component={RecentDocumentsScreen}
        options={{ title: t('nav.recentDocuments') }}
      />
      <Stack.Screen
        name="DocumentViewer"
        component={DocumentViewerScreen}
        options={{ title: t('nav.document') }}
      />
    </Stack.Navigator>
  );
}
