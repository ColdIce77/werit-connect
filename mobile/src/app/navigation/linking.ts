import type { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';

import { useAuthStore } from '../../features/auth/authStore';
import { URL_SCHEME } from '../../shared/config';
import {
  PUSH_CATEGORIES,
  type PushCategory,
  type PushPayload,
  type PushReferenceType,
} from '../../types/push';
import type { RootStackParamList } from './types';

/**
 * Deep-Link-Konfiguration. Pfade:
 *   weritconnect://news/<id>            Meldung
 *   weritconnect://notifications        Posteingang
 *   weritconnect://directory/<id>       Mitarbeiter
 *   weritconnect://documents/<id>       Dokument
 *   weritconnect://safety/<id>          Sicherheitsunterweisung
 *   weritconnect://tickets/<id>         Ticket
 *   weritconnect://approvals/<id>       Freigabe (nur mit Berechtigung)
 *   weritconnect://emergency            Notfallkontakte
 *   weritconnect://security-alert/<id>  Sicherheitswarnung
 */
const config: NonNullable<LinkingOptions<RootStackParamList>['config']> = {
  screens: {
    Main: {
      screens: {
        HomeTab: {
          screens: {
            Dashboard: 'home',
            NewsList: 'news',
            NewsDetail: 'news/:postId',
            Tasks: 'tasks',
            Notifications: 'notifications',
          },
        },
        DirectoryTab: {
          screens: {
            DirectoryList: 'directory',
            EmployeeDetail: 'directory/:userId',
          },
        },
        AssistantTab: {
          screens: {
            AssistantChat: 'assistant',
            AssistantHistory: 'assistant/history',
          },
        },
        DocumentsTab: {
          screens: {
            DocumentList: 'documents',
            RecentDocuments: 'documents/recent',
            DocumentViewer: 'documents/:documentId',
          },
        },
        MoreTab: {
          screens: {
            MoreMenu: 'more',
            SafetyList: 'safety',
            SafetyDetail: 'safety/:instructionId',
            TicketList: 'tickets',
            TicketDetail: 'tickets/:ticketId',
            ApprovalList: 'approvals',
            ApprovalDetail: 'approvals/:approvalId',
            Settings: 'settings',
            LanguageSettings: 'settings/language',
            NotificationSettings: 'settings/notifications',
            About: 'about',
            AdminHome: 'admin',
            PublishPost: 'publish/post',
            PublishSecurityAlert: 'publish/security-alert',
          },
        },
      },
    },
    Emergency: 'emergency',
    TicketCreate: 'ticket-create',
    SecurityAlert: 'security-alert/:notificationId',
  },
};

// ---------------------------------------------------------------------------
// Push-Nutzlast -> Pfad
// ---------------------------------------------------------------------------

const ID_PATTERN = /^[0-9a-fA-F-]{36}$/;

const REFERENCE_TYPES: readonly PushReferenceType[] = [
  'post',
  'ticket',
  'approval',
  'safety_instruction',
];

function isCategory(value: unknown): value is PushCategory {
  return typeof value === 'string' && (PUSH_CATEGORIES as readonly string[]).includes(value);
}

function isReferenceType(value: unknown): value is PushReferenceType {
  return typeof value === 'string' && (REFERENCE_TYPES as readonly string[]).includes(value);
}

/** Prüft die Nutzlast streng, bevor daraus ein Pfad gebaut wird. */
export function parsePushPayload(data: unknown): PushPayload | null {
  if (typeof data !== 'object' || data === null) return null;
  const d = data as Record<string, unknown>;

  if (!isCategory(d.category)) return null;
  if (typeof d.notificationId !== 'string' || !ID_PATTERN.test(d.notificationId)) return null;

  const payload: PushPayload = { category: d.category, notificationId: d.notificationId };
  if (
    isReferenceType(d.referenceType) &&
    typeof d.referenceId === 'string' &&
    ID_PATTERN.test(d.referenceId)
  ) {
    payload.referenceType = d.referenceType;
    payload.referenceId = d.referenceId;
  }
  return payload;
}

/** Zielpfad einer Push-Meldung. Ohne gültigen Verweis öffnet der Posteingang. */
export function notificationToPath(payload: PushPayload): string {
  if (payload.category === 'security_alert') {
    return `security-alert/${payload.notificationId}`;
  }
  const { referenceType, referenceId } = payload;
  if (referenceType && referenceId) {
    switch (referenceType) {
      case 'post':
        return `news/${referenceId}`;
      case 'ticket':
        return `tickets/${referenceId}`;
      case 'approval':
        return `approvals/${referenceId}`;
      case 'safety_instruction':
        return `safety/${referenceId}`;
    }
  }
  return 'notifications';
}

function urlFromResponse(response: Notifications.NotificationResponse | null): string | null {
  if (!response) return null;
  const payload = parsePushPayload(response.notification.request.content.data);
  return payload ? Linking.createURL(notificationToPath(payload)) : null;
}

// ---------------------------------------------------------------------------
// Verzögerte Links: Ist der Nutzer noch nicht angemeldet, wird der Link gemerkt
// und nach der Anmeldung abgespielt (siehe AppNavigation).
// ---------------------------------------------------------------------------

let pendingUrl: string | null = null;
let activeListener: ((url: string) => void) | null = null;

function dispatch(url: string): void {
  if (useAuthStore.getState().status === 'signedIn' && activeListener) {
    activeListener(url);
  } else {
    pendingUrl = url;
  }
}

/** Spielt einen gemerkten Link ab. Aufruf nach erfolgreicher Anmeldung. */
export function replayPendingLink(): void {
  const url = pendingUrl;
  pendingUrl = null;
  if (url && activeListener) activeListener(url);
}

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL('/'), `${URL_SCHEME}://`],
  config,

  // Kaltstart: Der Link wird gemerkt, weil die Bildschirme erst nach der
  // Anmeldung existieren.
  async getInitialURL() {
    const url =
      (await Linking.getInitialURL()) ??
      urlFromResponse(await Notifications.getLastNotificationResponseAsync());
    if (url) pendingUrl = url;
    return null;
  },

  // Laufende App: Links und Antippen von Push-Meldungen
  subscribe(listener) {
    activeListener = listener;

    const linkSubscription = Linking.addEventListener('url', ({ url }) => dispatch(url));
    const pushSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = urlFromResponse(response);
      if (url) dispatch(url);
    });

    return () => {
      activeListener = null;
      linkSubscription.remove();
      pushSubscription.remove();
    };
  },
};
