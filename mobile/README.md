# WERIT Connect – Mobile App

React Native (Expo), TypeScript. Architektur und Navigation: `../docs/`.

## Einrichtung

Die Abhängigkeiten sind bewusst nicht in `package.json` festgeschrieben. `expo install` wählt die zur
Expo-SDK-Version passenden Versionen. Danach die entstandene `package.json` und `package-lock.json` einchecken.

```bash
cd mobile
npm install expo react react-native
npx expo install \
  @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs \
  react-native-screens react-native-safe-area-context \
  expo-linking expo-notifications expo-localization expo-constants expo-status-bar \
  expo-auth-session expo-web-browser expo-secure-store expo-crypto \
  expo-sqlite expo-device expo-file-system expo-sharing @react-native-community/netinfo \
  @expo/vector-icons \
  i18next react-i18next zustand @tanstack/react-query
npm install -D typescript @types/react eslint
cp .env.example .env     # Werte eintragen
npx expo prebuild        # erzeugt ios/ und android/ (Dev Client, kein Expo Go)
npm run typecheck
```

Hinweis: React Navigation **7** wird benötigt (Tab-Leiste links auf Tablets).

## Entra ID (Anwendungsregistrierung)

- Plattform „Mobile und Desktopanwendungen“, Weiterleitungs-URI: `weritconnect://auth`
- Öffentlicher Client (kein Client Secret), Berechtigung auf die eigene API: `access_as_user`
- App-Rollen: `team_lead`, `manager`, `admin` (Mitarbeiter ist implizit)

## Status

| Bereich | Stand |
|---|---|
| Navigation, Theme, UI-Bausteine, API-Client, Sprachen (de, en, fr) | fertig |
| Anmeldung (Entra ID, PKCE), Sperrbildschirm | fertig, nicht gegen Entra getestet |
| Dashboard, Neuigkeiten, Aufgaben, Verzeichnis (offline), Notfallkontakte, Sicherheitsunterweisungen, Dokumente, Tickets, Posteingang, Push | fertig, nicht gegen das Backend getestet |
| Assistent (RAG), Freigaben, Einstellungen, Über, Administration, Meldung/Sicherheitswarnung veröffentlichen | fertig, nicht gegen das Backend getestet |
| Backend (Express), Docker, Deployment, Intune | folgt (Phase 5 ff.) |

Der Code wurde bisher nur auf Syntax geprüft, noch nicht mit allen Paketen kompiliert oder auf einem Gerät gestartet.
