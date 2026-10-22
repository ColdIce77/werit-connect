import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '../../features/auth/authStore';
import { DeviceBlockedScreen } from '../../features/auth/screens/DeviceBlockedScreen';
import { LoginScreen } from '../../features/auth/screens/LoginScreen';
import { EmergencyScreen } from '../../features/emergency/screens/EmergencyScreen';
import { SecurityAlertScreen } from '../../features/notifications/screens/SecurityAlertScreen';
import { TicketCreateScreen } from '../../features/tickets/screens/TicketCreateScreen';
import { MainTabs } from './MainTabs';
import { modalStackOptions } from './stackOptions';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Wurzel-Navigator. Welche Bildschirme existieren, hängt vom Anmeldezustand ab.
 * Nicht angemeldete Nutzer erreichen die Hauptbereiche weder per Tipp noch per Deep Link.
 */
export function RootNavigator() {
  const { t } = useTranslation();
  const status = useAuthStore((state) => state.status);
  const blockReason = useAuthStore((state) => state.blockReason);

  // Während der Sitzungswiederherstellung zeigt die App den Splash-Screen.
  if (status === 'loading') return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {status === 'signedOut' && <Stack.Screen name="Login" component={LoginScreen} />}

      {status === 'blocked' && (
        <Stack.Screen
          name="DeviceBlocked"
          component={DeviceBlockedScreen}
          initialParams={{ reason: blockReason ?? 'no_access' }}
        />
      )}

      {status === 'signedIn' && (
        <>
          <Stack.Screen name="Main" component={MainTabs} />

          <Stack.Group screenOptions={modalStackOptions}>
            <Stack.Screen
              name="Emergency"
              component={EmergencyScreen}
              options={{ title: t('nav.emergency') }}
            />
            <Stack.Screen
              name="TicketCreate"
              component={TicketCreateScreen}
              options={{ title: t('nav.ticketCreate') }}
            />
          </Stack.Group>

          {/* Sicherheitswarnungen füllen den Bildschirm und lassen sich nicht wegwischen. */}
          <Stack.Screen
            name="SecurityAlert"
            component={SecurityAlertScreen}
            options={{
              presentation: 'fullScreenModal',
              gestureEnabled: false,
              title: t('nav.securityAlert'),
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
