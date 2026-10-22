import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import { useAuthStore } from '../../features/auth/authStore';
import { isOnlineState } from './network';
import { flushOutbox } from './outbox';
import { runFullSync } from './sync';

const FOREGROUND_REFRESH_MS = 5 * 60_000;

/**
 * Unsichtbare Komponente. Startet die Synchronisation
 * - nach der Anmeldung
 * - wenn die Verbindung zurückkehrt
 * - wenn die App in den Vordergrund kommt (höchstens alle 5 Minuten)
 * und aktualisiert danach die betroffenen Anzeigen.
 */
export function SyncManager() {
  const status = useAuthStore((state) => state.status);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== 'signedIn') return;

    let lastForegroundRun = Date.now();

    const run = async (force: boolean) => {
      const changed = await runFullSync({ force }).catch(() => []);
      changed.forEach((name) => void queryClient.invalidateQueries({ queryKey: [name] }));
      // Gesendete Tickets und Bestätigungen sofort in den Listen sichtbar machen
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
    };

    void run(true);

    let wasOffline = false;
    const netSubscription = NetInfo.addEventListener((state) => {
      const online = isOnlineState(state);
      if (online && wasOffline) {
        void flushOutbox().then(() => run(true));
      }
      wasOffline = !online;
    });

    const appSubscription = AppState.addEventListener('change', (next) => {
      if (next === 'active' && Date.now() - lastForegroundRun > FOREGROUND_REFRESH_MS) {
        lastForegroundRun = Date.now();
        void run(false);
      }
    });

    return () => {
      netSubscription();
      appSubscription.remove();
    };
  }, [status, queryClient]);

  return null;
}
