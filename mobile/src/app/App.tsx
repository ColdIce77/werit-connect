import '../shared/i18n';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getAccessToken, onSignedOut, restoreSession, signOut } from '../features/auth/authService';
import { PushManager } from '../features/notifications/PushManager';
import { configurePushHandling } from '../features/notifications/pushService';
import { ApiError, configureApiClient } from '../shared/api/client';
import { wipeLocalData } from '../shared/offline/db';
import { SyncManager } from '../shared/offline/SyncManager';
import { AppNavigation } from './navigation/AppNavigation';

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 24 * 60 * 60 * 1000,
        // Bei fehlender Berechtigung oder Anmeldung nicht wiederholen
        retry: (failureCount, error) =>
          !(error instanceof ApiError && [401, 403, 404].includes(error.status)) && failureCount < 2,
      },
    },
  });
}

configureApiClient({
  getToken: getAccessToken,
  onUnauthorized: () => void signOut(),
});

configurePushHandling();

export default function App() {
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    // Bei Abmeldung (auch Rollenentzug oder Intune-Wipe) alle lokalen Daten verwerfen:
    // Zwischenspeicher, verschlüsselte Datenbank samt Schlüssel und heruntergeladene Dokumente.
    const unsubscribe = onSignedOut(() => {
      queryClient.clear();
      void wipeLocalData();
    });
    void restoreSession();
    return unsubscribe;
  }, [queryClient]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <SyncManager />
        <PushManager />
        <AppNavigation />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
