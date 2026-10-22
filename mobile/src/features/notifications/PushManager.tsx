import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { navigationRef } from '../../app/navigation/navigationRef';
import { parsePushPayload } from '../../app/navigation/linking';
import { useAuthStore } from '../auth/authStore';
import { registerDevice } from './pushService';

/**
 * Unsichtbare Komponente. Nach der Anmeldung:
 * - Gerät für Push registrieren
 * - Sicherheitswarnungen im Vordergrund sofort als Vollbild zeigen
 * - Posteingang und Zähler bei jeder eingehenden Meldung aktualisieren
 */
export function PushManager() {
  const status = useAuthStore((state) => state.status);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== 'signedIn') return;

    void registerDevice().catch(() => undefined);

    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });

      const payload = parsePushPayload(notification.request.content.data);
      if (payload?.category === 'security_alert' && navigationRef.isReady()) {
        navigationRef.navigate('SecurityAlert', { notificationId: payload.notificationId });
      }
    });

    return () => subscription.remove();
  }, [status, queryClient]);

  return null;
}
