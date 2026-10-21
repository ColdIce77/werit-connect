# WERIT Connect – Architektur (Phase 1)

Status: Entwurf v0.2 · Stand 20.10.2026 (Antworten zu den offenen Punkten eingearbeitet)
Folgedokumente: `02-datenmodell.md`, `03-navigation.md`, danach Screens, Backend, Deployment, Intune, Roadmap.

---

## 1. Ziele und Zielgruppen

WERIT Connect ist die mobile Mitarbeiter-App der WERIT Kunststoffwerke für iOS und Android (Smartphone und Tablet). Sie bündelt Informationen und einfache Workflows für Beschäftigte ohne festen PC-Arbeitsplatz.

| Zielgruppe | Typische Nutzung |
|---|---|
| Produktionsmitarbeiter | News, Sicherheitsunterweisungen, Notfallkontakte, Urlaub, IT-Störung melden |
| Kaufmännische Mitarbeiter | Verzeichnis, Dokumente, Urlaub, Tickets, KI-Assistent |
| Führungskräfte | Freigaben (Urlaub, IT), Team-Überblick, Ankündigungen |
| Außendienst | Offline-Verzeichnis, Dokumente, Push, Notfallkontakte |

Nichtfunktionale Ziele: einfache Bedienung mit großen Touchflächen, deutschsprachige UI, Fluent Design in dunklem Blau auf hellem Layout, Offline-Fähigkeit für sicherheitsrelevante Inhalte, Betrieb unter Intune, Wartbarkeit und Erweiterbarkeit.

## 2. Systemkontext

```
                    ┌──────────────────────────────┐
                    │   Microsoft Entra ID (SSO)   │
                    └──────▲───────────────▲───────┘
                           │ OIDC/PKCE     │ JWT-Validierung, Gruppen/Rollen
┌──────────────────────┐   │               │
│  Mobile App (Expo)   ├───┘               │
│  iOS / Android       │   HTTPS/JSON      │
│  Zustand · SQLite    ├──────────────►┌───┴──────────────────────────┐
└──────────▲───────────┘               │   WERIT Connect API          │
           │ Push (APNs/FCM)           │   Node.js · Express          │
           │                           │   PostgreSQL (+ pgvector)    │
┌──────────┴───────────┐               └───┬──────┬──────┬──────┬─────┘
│ Expo Push Service    │◄──────────────────┘      │      │      │
└──────────────────────┘                          │      │      │
                                   ┌──────────────┘      │      └───────────┐
                                   ▼                     ▼                  ▼
                              Entra ID (Graph)    NinjaOne (IT)     SharePoint / Teams
                                                                      (Intranet, Dokumente)
                                   ▲
                                   └── RAG-Service (generisch, austauschbarer LLM-/Embedding-Provider)
```

Die App spricht ausschließlich mit der eigenen API (Backend-for-Frontend). Direkte Aufrufe von NinjaOne oder Microsoft Graph aus der App gibt es nicht. Zugangsdaten der Fremdsysteme verlassen nie das Backend. VEDA (VEDA.net) ist **nicht angebunden**: Die App öffnet nur einen Link zur VEDA-Webseite.

## 3. Technologie-Entscheidungen

| Bereich | Wahl | Begründung / Hinweis |
|---|---|---|
| App | React Native, Expo (Dev Client / EAS Build), TypeScript strict | Expo Go reicht nicht, weil Intune-SDK und Auth native Module brauchen |
| Navigation | React Navigation (Bottom Tabs + Native Stack) | Siehe Phase 3 |
| Sprachen | i18next, expo-localization | Deutsch, Englisch, Französisch, weitere erweiterbar (siehe 11) |
| State | Zustand, getrennte Stores je Domäne, Persistenz via MMKV/SQLite | Server-Daten über TanStack Query, UI-/Session-Zustand über Zustand |
| UI | Fluent UI React Native, ergänzt um eigenes Token-Theme | Abdeckung von Fluent UI RN ist nicht vollständig, fehlende Komponenten werden auf Basis der Fluent-Tokens selbst gebaut |
| Lokale Daten | `expo-sqlite` (verschlüsselt, siehe 8), `expo-secure-store`, `expo-file-system` | Strukturierte Daten in SQLite, Dateien im App-Sandbox-Verzeichnis |
| Auth | Microsoft Entra ID, MSAL (nativ) bzw. `expo-auth-session` mit PKCE | Entscheidung in 5, Brokered Auth wegen Intune bevorzugt |
| Push | Expo Notifications mit APNs/FCM | Abstraktion im Backend, Wechsel auf direkte Anbindung möglich |
| Backend | Node.js 22 LTS, Express, TypeScript, Zod, Pino | Schlanke Schichten: Routen, Services, Repositories |
| Datenbank | PostgreSQL 16, Migrationen mit `node-pg-migrate`, `pgvector` für RAG | Eine Datenbank für Fachdaten und Vektoren |
| Container / Hosting | Docker, Docker Compose für Entwicklung, Produktion auf Azure | Zielbild siehe 11, Details im Deployment-Dokument |
| CI/CD | GitHub Actions oder Azure DevOps (offen) | EAS Build für Mobile |

## 4. Repository-Struktur

```
werit-connect/
├── README.md
├── docs/
│   ├── 01-architektur.md
│   ├── 02-datenmodell.md          (Phase 2)
│   ├── 03-navigation.md           (Phase 3)
│   └── roadmap.md
├── mobile/
│   ├── app.config.ts
│   ├── eas.json
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app/                   App-Einstieg, Provider, Navigation
│       │   ├── App.tsx
│       │   ├── providers/
│       │   └── navigation/
│       ├── features/              Fachmodule, je Modul vertikal geschnitten
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── directory/
│       │   ├── assistant/
│       │   ├── documents/
│       │   ├── safety/            Sicherheitsunterweisungen
│       │   ├── emergency/         Notfallkontakte
│       │   ├── leave/             Urlaubsanträge
│       │   ├── tickets/
│       │   ├── approvals/
│       │   └── notifications/
│       ├── shared/
│       │   ├── api/               HTTP-Client, Interceptors, Fehlerabbildung
│       │   ├── components/        Fluent-basierte UI-Bausteine
│       │   ├── offline/           SQLite, Sync-Engine, Cache-Policies
│       │   ├── store/             Zustand-Basis, Persistenz
│       │   ├── theme/             Tokens, Typografie, Responsive-Helfer
│       │   ├── i18n/              de (Standard), erweiterbar
│       │   └── utils/
│       └── types/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── migrations/
│   └── src/
│       ├── server.ts
│       ├── config/
│       ├── middleware/            auth, rbac, validation, error, rate limit
│       ├── modules/
│       │   ├── users/
│       │   ├── directory/
│       │   ├── news/
│       │   ├── tasks/
│       │   ├── leave/
│       │   ├── tickets/
│       │   ├── approvals/
│       │   ├── documents/
│       │   ├── safety/
│       │   ├── emergency/
│       │   ├── notifications/
│       │   └── assistant/
│       ├── integrations/          veda/, ninjaone/, sharepoint/, teams/, graph/
│       ├── rag/                   Ingestion, Chunking, Retrieval, Provider-Interface
│       └── db/
└── deploy/
    ├── docker/                    Dockerfiles, docker-compose.yml
    └── intune/                    Verteilungskonzept, App-Config-Vorlagen
```

## 5. Authentifizierung und Autorisierung

### 5.1 Anmeldung (SSO)

1. Die App startet die Anmeldung gegen Entra ID (Authorization Code Flow mit PKCE, kein Client Secret in der App).
2. Unter Intune läuft die Anmeldung bevorzugt über den Broker (Microsoft Authenticator bzw. Company Portal), damit Single Sign-On und Conditional Access greifen.
3. Die App erhält ein Access Token für die **eigene API** (Scope `api://<client-id>/access_as_user`) und ein Refresh Token. Tokens liegen ausschließlich im `SecureStore` (Keychain/Keystore), nicht in Zustand-Persistenz.
4. Das Backend validiert jedes Token (Signatur über JWKS, `iss`, `aud`, `exp`, `tid`) und mappt `oid` auf den internen Benutzer.
5. Zugriff auf Microsoft Graph (SharePoint, Teams) erfolgt im Backend per On-Behalf-Of-Flow oder per Anwendungsberechtigung, je nach Datenart.

### 5.2 Rollen

Rollen kommen aus **Entra App Roles** (bevorzugt) oder Sicherheitsgruppen und stehen im Token. Das Backend löst sie in eine feste Rollenhierarchie auf:

`Mitarbeiter < Teamleiter < Manager < Administrator`

Zusätzlich gilt der **Organisationsbezug**: Teamleiter und Manager sehen und genehmigen nur Vorgänge ihres eigenen Teams bzw. Bereichs (Quelle: Vorgesetztenbeziehung aus Entra ID). Rolle allein genügt also nicht, es braucht Rolle plus Zuständigkeit.

### 5.3 Berechtigungsmatrix (vereinfacht)

| Berechtigung | Mitarbeiter | Teamleiter | Manager | Administrator |
|---|:-:|:-:|:-:|:-:|
| Lesen: News, Verzeichnis, Dokumente, Sicherheit, Notfallkontakte, KI-Assistent | ✓ | ✓ | ✓ | ✓ |
| Eigene Tickets melden und einsehen | ✓ | ✓ | ✓ | ✓ |
| Freigaben im eigenen Team bzw. Bereich erteilen | – | ✓ | ✓ | – |
| Ankündigungen und Sicherheitswarnungen veröffentlichen | – | – | ✓ | ✓ |
| Benutzer, Inhalte, Einstellungen und KI-Quellen verwalten | – | – | – | ✓ |

Die Administrator-Rolle ist eine Systemrolle und erteilt nicht automatisch Freigaben.

Umsetzung: Berechtigungen als benannte Permissions (`leave.approve`, `announcement.publish`, …), Rollen sind Bündel davon. Das Backend prüft Permissions, die App blendet nur aus (UX), verlässt sich aber nie darauf.

## 6. Fachmodule

| Modul | Inhalt | Quelle der Wahrheit | Offline |
|---|---|---|---|
| Dashboard | News, Ankündigungen, Aufgaben, Geburtstage, neue Mitarbeiter, offene Urlaubsanträge, offene Tickets | Aggregations-Endpunkt im Backend | zuletzt geladener Stand, schreibgeschützt |
| Verzeichnis | Suche nach Kollegen, Kontaktdaten | Entra ID (Microsoft Graph), im Backend gespiegelt | **ja** |
| KI-Assistent | Fragen wie „Wer ist Ansprechpartner im Einkauf?“, „Wie beantrage ich Urlaub?“, „Wo finde ich die Reisekostenrichtlinie?“, „Wie melde ich eine IT-Störung?“ | RAG-Service | nein |
| Dokumente | Richtlinien, Formulare | SharePoint | **zuletzt gelesene** |
| Sicherheitsunterweisungen | Inhalte und Lesebestätigung | Backend | **ja** |
| Notfallkontakte | Standortbezogene Nummern | Backend | **ja** |
| Urlaub | Nur ein Link zu VEDA.net, keine eigene Antragsstrecke | VEDA (extern, Webseite) | nein |
| Tickets | Störungen melden, Status | NinjaOne (**Platzhalter**, wird später definiert) | Anzeige ja, Meldung später (Queue) |
| Freigaben | Genehmigungsliste | Backend (**Platzhalter**, Quellen werden später definiert) | nein |
| Benachrichtigungen | Push und Posteingang | Backend | Posteingang ja |

## 7. KI-Assistent (RAG)

Der Assistent ist als **generischer Service** ausgelegt: Das Backend kennt nur Schnittstellen, keine Anbieter.

```ts
interface EmbeddingProvider { embed(texts: string[]): Promise<number[][]>; }
interface LlmProvider { complete(req: ChatRequest): Promise<ChatResponse>; }
interface SourceConnector { list(): AsyncIterable<SourceDocument>; }   // SharePoint, Wiki, PDFs …
```

Ablauf:

1. **Ingestion** (Job): Connector liefert Dokumente samt Zugriffsmetadaten, Chunking, Embeddings, Speicherung in `pgvector`.
2. **Retrieval**: Frage wird eingebettet, Ähnlichkeitssuche, **Filter auf Berechtigungen des Fragenden** (Rolle, Standort, Dokument-ACL). Ein Nutzer darf nie Inhalte erhalten, die er im Quellsystem nicht sehen dürfte.
3. **Generation**: LLM antwortet nur auf Basis der gefundenen Passagen, mit Quellenangaben, auf Deutsch. Ohne Treffer antwortet der Assistent, dass er es nicht weiß, statt zu raten.
4. **Protokoll**: Frage, Quellen und Feedback (Daumen) für Qualitätssicherung, datenschutzkonform und mit Löschfrist.

Offen: Auswahl des LLM-Anbieters (Azure OpenAI in EU-Region oder Copilot-basierte Variante, siehe 13) und Datenschutzfreigabe.

## 8. Offline-Konzept

| Inhalt | Speicher | Strategie |
|---|---|---|
| Mitarbeiterverzeichnis | SQLite (FTS5 für Suche) | Vollsync, danach Delta über `updated_since`, Suche funktioniert offline |
| Zuletzt gelesene Dokumente | Dateisystem + Metadaten in SQLite | LRU, begrenzt nach Anzahl/Größe, Ablaufdatum |
| Sicherheitsunterweisungen | SQLite + Dateien | Vorab-Download, Versionsprüfung, Lesebestätigung wird lokal vorgemerkt und später übertragen |
| Notfallkontakte | SQLite | Immer vorgehalten, höchste Priorität |

Grundsätze:

- Jeder Offline-Datensatz trägt `fetched_at` und `server_version`. Die UI zeigt „Stand: …“.
- Schreibende Aktionen offline (Lesebestätigung, später Urlaubsantrag, Ticket) laufen über eine **Outbox-Queue** mit Idempotenz-Schlüssel, Wiederholung mit Backoff und Konfliktregel „Server gewinnt, Nutzer wird informiert“.
- Lokale Daten sind verschlüsselt (SQLCipher bzw. Dateiverschlüsselung, Schlüssel im Secure Store).
- Bei Abmeldung, Rollenentzug oder Intune-Wipe werden alle lokalen Daten gelöscht.

## 9. Push-Nachrichten

Kategorien: Unternehmensnews, IT-Störungen, Sicherheitswarnungen, Freigaben, Urlaubsanträge.

Hinweis: Urlaub läuft nur über VEDA.net, die App hat keine Urlaubsdaten. Die Kategorie „Urlaubsanträge“ bleibt vorerst Platzhalter (siehe 13). Push-Texte werden in der Sprache des Nutzers versendet.

- Gerätetoken wird nach Login am Backend registriert (`device`-Tabelle, pro Nutzer mehrere Geräte).
- Backend versendet gezielt nach Nutzer, Rolle, Standort oder Bereich.
- Pro Kategorie eigene Benachrichtigungskanäle (Android) und Nutzereinstellung. **Sicherheitswarnungen sind nicht abschaltbar** und nutzen hohe Priorität.
- Push-Payloads enthalten keine sensiblen Inhalte, nur Kategorie und Referenz-ID. Details lädt die App nach dem Öffnen.
- Deep Links führen direkt zum passenden Screen (z. B. Freigabe-Detail).
- Zustellung wird protokolliert, ein Posteingang in der App fängt verpasste Meldungen auf.

## 10. Intune und Geräteverwaltung

- Verteilung als Unternehmens-App (iOS: VPP/ABM-Lizenz oder Enterprise, Android: Managed Google Play) über Intune.
- **App Protection Policies (MAM)** über das Intune App SDK: PIN, Copy/Paste-Beschränkung, Backup-Sperre, selektives Löschen. Bei Expo benötigt das einen Config Plugin bzw. eigenen nativen Build, das wird vorab in einem **Machbarkeitstest (Spike)** geprüft, einem kurzen, zeitlich begrenzten Test von wenigen Tagen in Phase 1.
- **App Configuration Policies** liefern Konfiguration (API-URL, Mandant, Umgebung) ohne Neuinstallation.
- Conditional Access in Entra ID (nur verwaltete Geräte, Compliance).
- Details im Dokument `deploy/intune/verteilungskonzept.md`.

## 11. Querschnittsthemen

- **Sicherheit:** TLS überall, Certificate Pinning optional, Jailbreak-/Root-Erkennung über Intune, keine Geheimnisse im App-Bundle, Rate Limiting, Eingabevalidierung (Zod), Audit-Log für Freigaben und Administration.
- **Datenschutz (DSGVO):** Datensparsamkeit im Verzeichnis (private Daten wie Geburtstag nur mit Opt-in bzw. nur Tag/Monat), Löschkonzepte, Abstimmung mit Datenschutzbeauftragtem und Betriebsrat vor dem Rollout.
- **Barrierefreiheit:** Touch-Ziele mindestens 48 dp, Kontraste nach WCAG AA, Dynamic Type, Screenreader-Labels.
- **Responsive:** Smartphone mit Bottom-Tabs, Tablet mit Seitenleiste und Zwei-Spalten-Ansicht (Master/Detail), Umschaltung über Breakpoints.
- **Mehrsprachigkeit:** Deutsch (Standard), Englisch, Französisch, weitere Sprachen vorgesehen. Alle Texte als Schlüssel in Sprachdateien (i18next), Fallback auf Deutsch, Sprache folgt der Geräteeinstellung und ist in der App umschaltbar. Datums-, Zahlen- und Zeitformate lokalisiert, Layout für längere Texte und spätere Rechts-nach-links-Sprachen ausgelegt. Inhalte (News, Dokumente, Unterweisungen) tragen ein Sprachkennzeichen. Der KI-Assistent antwortet in der Sprache der Frage.
- **Plattformen:** Unterstützt werden die aktuellen Hauptversionen von iOS und Android. Konkrete Mindestversionen werden zum Rollout festgelegt und über Intune-Compliance-Richtlinien durchgesetzt.
- **Hosting (Azure):** Zielbild: Backend als Container (Azure Container Apps oder App Service), Azure Database for PostgreSQL Flexible Server mit pgvector, Azure Key Vault für Geheimnisse, Azure Front Door oder API Management vor der API, Application Insights für Logs und Metriken, Region in der EU. Details im Deployment-Dokument.
- **Beobachtbarkeit:** strukturierte Logs, Health-Endpunkte, Crash-Reporting (Datenschutz prüfen), Metriken.
- **Qualität:** ESLint, Prettier, Jest, React Native Testing Library, API-Tests mit Supertest, E2E mit Maestro oder Detox, Typen zwischen App und API über ein gemeinsames Schema (OpenAPI).
- **Fehlertoleranz:** Integrationen (VEDA, NinjaOne) hinter Adaptern mit Timeouts, Retry und Cache, damit ein Ausfall die App nicht blockiert.

## 12. Architekturentscheidungen (ADR-Kurzform)

| # | Entscheidung | Status |
|---|---|---|
| 1 | Backend-for-Frontend, keine direkten Fremdsystem-Zugriffe aus der App | beschlossen |
| 2 | Expo mit Dev Client/EAS statt Expo Go | beschlossen |
| 3 | Rollen aus Entra App Roles plus Organisationsbezug | Vorschlag |
| 4 | RAG mit `pgvector` in derselben PostgreSQL-Instanz | Vorschlag |
| 5 | Offline über SQLite plus Outbox-Queue | Vorschlag |
| 6 | Push über Expo Notifications, Abstraktion im Backend | Vorschlag |
| 7 | Hosting auf Azure | beschlossen |
| 8 | VEDA nur als Link, keine Integration; Verzeichnis und Anmeldung über Entra ID | beschlossen |
| 9 | Mehrsprachig ab Start (de, en, fr, erweiterbar) | beschlossen |

## 13. Entscheidungen und offene Punkte

### Entschieden

| Thema | Entscheidung |
|---|---|
| Berechtigungen | Vereinfachte Matrix (5.3) |
| Verzeichnis und Anmeldung | Entra ID (Microsoft Graph, SSO). VEDA wird nicht angebunden. |
| Urlaub | Nur ein Link zu VEDA.net, keine Antragsstrecke in der App |
| Tickets (NinjaOne) | Platzhalter, wird später definiert |
| Plattformen | Aktuelle Hauptversionen von iOS und Android |
| Sprachen | Deutsch, Englisch, Französisch, weitere erweiterbar |
| Hosting | Azure |

### Offen

1. **KI-Anbieter:** Kann Copilot verwendet werden? Empfehlung: Azure OpenAI hinter dem generischen Provider-Interface, Copilot Studio als Alternative (Lizenzlage klären).
2. **Intune-MAM-SDK mit Expo:** Machbarkeitstest (Spike) in Phase 1.
3. **Dashboard und Push zu Urlaub:** „Offene Urlaubsanträge“ (Dashboard) und die Push-Kategorie „Urlaubsanträge“ haben ohne VEDA-Anbindung keine Datenquelle. Entfernen oder als Platzhalter behalten?
4. **Mindestversionen:** Nur die aktuelle Hauptversion oder zusätzlich die vorherige?
5. **NinjaOne und Freigaben:** Schnittstellen, Mandantenmodell und Datenquellen werden später definiert (Platzhalter im Datenmodell).

## 14. Nächste Schritte

1. Offene Punkte 1, 3 und 4 klären.
2. Phase 2: Datenmodell (`docs/02-datenmodell.md`) mit ER-Diagramm und SQL-Migrationen.
3. Phase 3: Navigation (`docs/03-navigation.md`).
