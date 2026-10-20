# WERIT Connect

Mobile Mitarbeiter-App der WERIT Kunststoffwerke für iOS und Android.

- **Frontend:** React Native (Expo), TypeScript, React Navigation, Zustand, Fluent UI
- **Backend:** Node.js, Express, PostgreSQL
- **Auth:** Microsoft Entra ID (SSO), Verteilung über Microsoft Intune
- **Integrationen:** VEDA (HR), NinjaOne (IT), SharePoint (Intranet), Teams
- **KI-Assistent:** generischer RAG-Service

## Repository-Struktur

```
mobile/    Expo-App (React Native, TypeScript)
backend/   Express-API, PostgreSQL-Migrationen
deploy/    Docker, Intune-Verteilungskonzept
docs/      Architektur, Datenmodell, Roadmap
```

## Vorgehen (inkrementell)

1. Architektur (`docs/01-architektur.md`)
2. Datenmodell
3. Navigation
4. Screens
5. Backend, Docker, Deployment, Intune, Roadmap

## Status

Phase 1: Architektur – in Arbeit.
