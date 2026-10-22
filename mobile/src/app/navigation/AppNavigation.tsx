import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';

import { useAuthStore } from '../../features/auth/authStore';
import { navigationTheme } from '../../shared/theme/navigationTheme';
import { linking, replayPendingLink } from './linking';
import { navigationRef } from './navigationRef';
import { RootNavigator } from './RootNavigator';

/**
 * Einstiegspunkt der Navigation. Wird in App.tsx innerhalb der Provider eingebunden.
 * Nach der Anmeldung spielt sie einen gemerkten Deep Link ab, etwa aus einer Push-Meldung,
 * die vor der Anmeldung angetippt wurde.
 */
export function AppNavigation() {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'signedIn') replayPendingLink();
  }, [status]);

  return (
    <NavigationContainer ref={navigationRef} linking={linking} theme={navigationTheme} fallback={null}>
      <RootNavigator />
    </NavigationContainer>
  );
}
