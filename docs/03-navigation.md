# WERIT Connect – Navigation (Phase 3)

Status: Entwurf v0.1 · Stand 20.10.2026
Basis: `01-architektur.md` (v0.3), `02-datenmodell.md` · Code: `mobile/src/app/navigation/`

---

## 1. Grundsätze

| Thema | Regel |
|---|---|
| Bibliothek | React Navigation **7** (Native Stack, Bottom Tabs), typisiert mit TypeScript |
| Ein Navigator für alle Geräte | Unten Tab-Leiste auf Smartphones, Seitenleiste links ab 768 dp (Tablets). Es ist derselbe Navigator, daher bleibt der Zustand beim Drehen erhalten. |
| Fünf Hauptbereiche | Start, Verzeichnis, Assistent, Dokumente, Mehr. Alles Weitere liegt unter „Mehr“ oder in der Kopfzeile. |
| Immer erreichbar | Kopfzeile aller Bereiche: Posteingang und Notfallkontakte (rotes Warnsymbol). |
| Touchflächen | Mindestens 48 dp für alle Aktionen, Tab-Leiste mindestens 56 dp hoch |
| Sprache | Alle Titel über i18n-Schlüssel (`nav.*`), Deutsch, Englisch, Französisch |
| Berechtigungen | Bildschirme ohne Berechtigung werden gar nicht registriert. Sie sind weder über Menü noch über Deep Link erreichbar. Das Backend prüft zusätzlich. |
| Urlaub | Kein Bildschirm. Der Menüpunkt „Urlaub (VEDA)“ öffnet die URL aus `app_settings` (`links.veda`) im Browser. |

## 2. Navigationsbaum

```
Root (Native Stack)
├─ nicht angemeldet:  Login
├─ gesperrt:          DeviceBlocked        (nicht konform, kein Zugriff, widerrufen)
└─ angemeldet:
   ├─ Main (Tabs; Tablet: Seitenleiste)
   │  ├─ Start        Dashboard · NewsList · NewsDetail · Tasks · Notifications
   │  ├─ Verzeichnis  DirectoryList · EmployeeDetail
   │  ├─ Assistent    AssistantChat · AssistantHistory
   │  ├─ Dokumente    DocumentList · RecentDocuments · DocumentViewer
   │  └─ Mehr         MoreMenu
   │                  ├─ SafetyList · SafetyDetail
   │                  ├─ TicketList · TicketDetail
   │                  ├─ ApprovalList · ApprovalDetail        (approval.decide)
   │                  ├─ Settings · LanguageSettings · NotificationSettings · About
   │                  └─ AdminHome · PublishPost · PublishSecurityAlert   (admin.manage; Meldung: post.publish, Warnung: security_alert.publish)
   ├─ Emergency        Modal, von überall über die Kopfzeile
   ├─ TicketCreate     Modal, aus Tickets und Dashboard
   └─ SecurityAlert    Vollbild-Modal, nicht wegwischbar
```

Der Anmeldezustand (`loading`, `signedOut`, `signedIn`, `blocked`) steuert, welche Wurzelbildschirme existieren. Während `loading` zeigt die App den Splash-Screen.

## 3. Bildschirme

| Route | Bereich | Parameter | Berechtigung | Offline | Deep Link |
|---|---|---|---|---|---|
| `Login` | Root | – | – | – | – |
| `DeviceBlocked` | Root | `reason` | – | – | – |
| `Dashboard` | Start | – | `content.read` | letzter Stand | `home` |
| `NewsList` | Start | – | `content.read` | letzter Stand | `news` |
| `NewsDetail` | Start | `postId` | `content.read` | gecachte | `news/:postId` |
| `Tasks` | Start | – | `content.read` | letzter Stand | `tasks` |
| `Notifications` | Start | – | – | ja (Posteingang) | `notifications` |
| `DirectoryList` | Verzeichnis | `selectedUserId?` | `content.read` | **ja** | `directory` |
| `EmployeeDetail` | Verzeichnis | `userId` | `content.read` | **ja** | `directory/:userId` |
| `AssistantChat` | Assistent | `conversationId?` | `assistant.use` | nein | `assistant` |
| `AssistantHistory` | Assistent | – | `assistant.use` | nein | `assistant/history` |
| `DocumentList` | Dokumente | `selectedDocumentId?` | `content.read` | Metadaten | `documents` |
| `RecentDocuments` | Dokumente | – | `content.read` | **ja** | `documents/recent` |
| `DocumentViewer` | Dokumente | `documentId` | `content.read` | zuletzt gelesene | `documents/:documentId` |
| `MoreMenu` | Mehr | – | – | – | `more` |
| `SafetyList` | Mehr | – | `content.read` | **ja** | `safety` |
| `SafetyDetail` | Mehr | `instructionId` | `content.read` | **ja** | `safety/:instructionId` |
| `TicketList` | Mehr | – | `ticket.create` | Anzeige | `tickets` |
| `TicketDetail` | Mehr | `ticketId` | `ticket.create` | Anzeige | `tickets/:ticketId` |
| `ApprovalList` | Mehr | – | `approval.decide` | nein | `approvals` |
| `ApprovalDetail` | Mehr | `approvalId` | `approval.decide` | nein | `approvals/:approvalId` |
| `Settings` | Mehr | – | – | ja | `settings` |
| `LanguageSettings` | Mehr | – | – | ja | `settings/language` |
| `NotificationSettings` | Mehr | – | – | ja | `settings/notifications` |
| `About` | Mehr | – | – | ja | `about` |
| `AdminHome` | Mehr | – | `admin.manage` | nein | `admin` |
| `Emergency` | Root (Modal) | – | – | **ja, höchste Priorität** | `emergency` |
| `TicketCreate` | Root (Modal) | – | `ticket.create` | Meldung wird vorgemerkt | `ticket-create` |
| `SecurityAlert` | Root (Vollbild) | `notificationId` | – | Posteingang | `security-alert/:notificationId` |

Bereiche und Titel stehen in den Sprachdateien unter `nav.*` (`mobile/src/shared/i18n/locales/`).

## 4. Responsive Verhalten

| | Smartphone (< 768 dp) | Tablet (≥ 768 dp) |
|---|---|---|
| Hauptnavigation | Tab-Leiste unten | Seitenleiste links |
| Verzeichnis, Dokumente | Liste, Tipp öffnet `EmployeeDetail` bzw. `DocumentViewer` | Master/Detail nebeneinander |
| Kopfzeile | Posteingang und Notfall | gleich |

**Master/Detail auf Tablets:** Die Listenbildschirme erhalten die Auswahl als Parameter (`selectedUserId`, `selectedDocumentId`) und zeigen das Detail im rechten Bereich. Es wird kein neuer Bildschirm auf den Stack gelegt. Auf Smartphones navigiert dieselbe Auswahl zum Detailbildschirm. Die Umschaltung erfolgt über `useLayout()` (`shared/theme/responsive.ts`). Ein Deep Link auf `directory/:userId` funktioniert auf beiden Geräten, weil die Detail-Route immer registriert ist.

## 5. Deep Links und Push

Schema: `weritconnect://`. Push-Meldungen enthalten nur Kategorie und Verweis, keine Inhalte:

```json
{ "category": "approval", "notificationId": "<uuid>", "referenceType": "approval", "referenceId": "<uuid>" }
```

| Kategorie / Verweis | Ziel |
|---|---|
| `security_alert` | `SecurityAlert` (Vollbild), Verweis wird ignoriert |
| `referenceType = post` | `NewsDetail` |
| `referenceType = ticket` | `TicketDetail` |
| `referenceType = approval` | `ApprovalDetail` (nur mit Berechtigung) |
| `referenceType = safety_instruction` | `SafetyDetail` |
| kein oder ungültiger Verweis | `Notifications` (Posteingang) |

Die Zuordnung steht in `linking.ts` (`notificationToPath`).

**Sicherheit:** Die Nutzlast wird streng geprüft (bekannte Kategorie, bekannter Verweistyp, UUID-Format), bevor daraus ein Pfad entsteht. Ungültige Nutzlasten führen zum Posteingang.

**Berechtigung:** Existiert ein Zielbildschirm für den Nutzer nicht (z. B. `ApprovalDetail` ohne Berechtigung), wird der Link ignoriert.

**Nicht angemeldet:** Der Link wird gemerkt und nach erfolgreicher Anmeldung abgespielt (`replayPendingLink` in `AppNavigation`). Beim Kaltstart gilt dasselbe, weil die Hauptbildschirme erst nach der Sitzungswiederherstellung existieren.

## 6. Anmeldung und Sperrzustände

| Zustand | Bedeutung | Bildschirm |
|---|---|---|
| `loading` | Sitzung wird wiederhergestellt | Splash-Screen |
| `signedOut` | Keine gültige Sitzung | `Login` (Entra ID, Single Sign-On) |
| `signedIn` | Angemeldet | `Main` und Modale |
| `blocked` | Gerät nicht konform, kein Zugriff oder widerrufen | `DeviceBlocked` mit Grund |

Der Zustand liegt im Zustand-Store `features/auth/authStore.ts`. Er enthält Benutzer, Rollen und Berechtigungen, aber keine Tokens. Tokens liegen im SecureStore. Die Anmeldung selbst (MSAL bzw. PKCE) folgt im Authentifizierungskonzept und ruft die Aktionen `setSignedIn`, `setSignedOut` und `setBlocked` auf.

## 7. Umsetzungshinweise

- **Bildschirme folgen in Phase 4.** Die Navigation importiert sie bereits unter `features/<bereich>/screens/`. Bis die Dateien existieren, lässt sich das Projekt nicht kompilieren. Jeder Bildschirm bekommt seine Props aus den Typen in `types.ts` (z. B. `HomeScreenProps<'NewsDetail'>`).
- **Ergänzte Feature-Ordner:** `more/` (Menü), `settings/` und `admin/`. Sie kommen zur Struktur in `01-architektur.md` hinzu.
- **Pakete:** `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs` (jeweils Version 7), `react-native-screens`, `react-native-safe-area-context`, `expo-linking`, `expo-notifications`, `@expo/vector-icons`, `react-i18next`, `i18next`, `zustand`.
- **Icons:** Vorerst Ionicons. Der Tausch gegen Fluent-Icons betrifft nur `MainTabs.tsx` und `HeaderActions.tsx`.
- **Farben:** `shared/theme/colors.ts` enthält Platzhalterwerte für das dunkle Blau, bis das Corporate Design bestätigt ist.
- **Nicht geprüft:** Der Code wurde noch nicht kompiliert oder in der App ausgeführt, weil Projektabhängigkeiten und Bildschirme fehlen. Das geschieht mit Phase 4.
- **Badge am Posteingang:** Die Zahl ungelesener Meldungen folgt mit dem Posteingangs-Bildschirm.

## 8. Offene Punkte

1. **Notfallkontakte vor der Anmeldung:** Sollen sie auch auf dem Login-Bildschirm erreichbar sein (aus dem Offline-Speicher)? Die Nummern sind nicht vertraulich, im Notfall zählt jede Sekunde. Das ist aber nur möglich, wenn sie bereits einmal geladen wurden.
2. **Anzahl der Tabs:** Fünf Tabs sind die Obergrenze für Smartphones. Kommt ein Bereich dazu, gehört er unter „Mehr“.
3. **Freigaben für Teamleiter und Manager:** Ein eigener Tab wäre denkbar, wenn Freigaben häufig genutzt werden. Aktuell liegen sie unter „Mehr“.
