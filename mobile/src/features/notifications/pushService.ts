import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from '../../shared/api/client';
import i18n from '../../shared/i18n';
import type { NotificationCategory } from '../../shared/api/types';

/**
 * Push-Meldungen: Berechtigung, Android-Kanäle und Registrierung des Geräts am Backend.
 * Die Meldungen enthalten nur Kategorie und Verweis (siehe types/push.ts).
 */

/** Zeigt Meldungen auch an, wenn die App geöffnet ist. */
export function configurePushHandling(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const CHANNELS: Record<
  NotificationCategory,
  { importance: Notifications.AndroidImportance; labelKey: string }
> = {
  security_alert: { importance: Notifications.AndroidImportance.MAX, labelKey: 'push.channelSecurity' },
  it_incident: { importance: Notifications.AndroidImportance.HIGH, labelKey: 'push.channelIncident' },
  approval: { importance: Notifications.AndroidImportance.HIGH, labelKey: 'push.channelApproval' },
  news: { importance: Notifications.AndroidImportance.DEFAULT, labelKey: 'push.channelNews' },
};

/** Legt je Kategorie einen Android-Kanal an. Nach einem Sprachwechsel erneut aufrufen. */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  for (const [id, channel] of Object.entries(CHANNELS)) {
    await Notifications.setNotificationChannelAsync(id, {
      name: i18n.t(channel.labelKey),
      importance: channel.importance,
      // Sicherheitswarnungen durchbrechen "Nicht stören" nicht automatisch, sie sind aber nicht abschaltbar
      enableVibrate: true,
    });
  }
}

/** Fragt die Berechtigung ab und meldet das Gerät am Backend an. Gibt false zurück, wenn kein Token entstand. */
export async function registerDevice(): Promise<boolean> {
  // Kanäle müssen vor der Berechtigungsanfrage existieren (Android 13 und neuer)
  await setupNotificationChannels();

  if (!Device.isDevice) return false; // Simulatoren erhalten keine Push-Meldungen

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return false;

  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) return false;

  const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });

  await api.post('/devices', {
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    pushToken,
    appVersion: Constants.expoConfig?.version ?? null,
    osVersion: String(Platform.Version),
    language: i18n.language,
  });
  return true;
}
