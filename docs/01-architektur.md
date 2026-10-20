# Architektur – WERIT Connect

## Überblick

```
Mobile App (Expo)  ──HTTPS/JWT──►  API-Gateway/Backend (Express)
   │  MSAL (Entra ID)                 ├─ PostgreSQL (App-Daten)
   │                                  ├─ VEDA-Adapter (HR)
   └─ Intune App Protection           ├─ NinjaOne-Adapter (Tickets)
                                      ├─ Microsoft Graph (SharePoint, Profile, Teams)
                                      ├─ Push-Service (Expo/FCM/APNs)
                                      └─ KI-Service (RAG) ── Vektorindex (pgvector)
```

## Prinzipien

- Backend-for-Frontend: Die App spricht nur mit dem eigenen Backend, nie direkt mit VEDA/NinjaOne.
- Adapter-Schicht pro Fremdsystem (austauschbar, mockbar).
- Rollenprüfung serverseitig (Entra-Gruppen → App-Rollen).
- Offline-first für Verzeichnis, Dokumente, Unterweisungen, Notfallkontakte (lokaler Cache, SQLite/MMKV).
- Datenschutz: Zugriff auf HR-Daten nur im Namen des Nutzers, Audit-Log, keine HR-Daten im KI-Index ohne Nutzerbezug.

## Module

Dashboard, Verzeichnis, HR, IT-Service, Dokumentencenter, Intranet, Ansprechpartner, Ideenmanagement, Produktion (QR), Besucher, KI-Assistent.

## Rollen

Mitarbeiter, Teamleiter, Manager, Administrator – Zuordnung über Entra-ID-Gruppen/App Roles.

## Offene Entscheidungen

- Expo Managed vs. Prebuild (Intune App SDK erfordert Prebuild/Config Plugin)
- VEDA-Schnittstelle (REST/SOAP/Export?)
- LLM-Anbieter und Hosting für RAG (EU-Region)
