import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { AssistantChatScreen } from '../../features/assistant/screens/AssistantChatScreen';
import { AssistantHistoryScreen } from '../../features/assistant/screens/AssistantHistoryScreen';
import { useHasPermission } from '../../features/auth/authStore';
import { defaultStackOptions } from './stackOptions';
import type { AssistantStackParamList } from './types';

const Stack = createNativeStackNavigator<AssistantStackParamList>();

export function AssistantStack() {
  const { t } = useTranslation();
  const canUseAssistant = useHasPermission('assistant.use');

  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      {canUseAssistant && (
        <>
          <Stack.Screen
            name="AssistantChat"
            component={AssistantChatScreen}
            options={{ title: t('nav.assistant') }}
          />
          <Stack.Screen
            name="AssistantHistory"
            component={AssistantHistoryScreen}
            options={{ title: t('nav.assistantHistory') }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
