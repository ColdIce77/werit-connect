import type { ExpoConfig } from 'expo/config';

/**
 * Konfiguration je Umgebung über EXPO_PUBLIC_* Variablen (siehe .env.example).
 * Unter Intune kommen API-URL und Mandant später zusätzlich über App Configuration Policies.
 */
const config: ExpoConfig = {
  name: 'WERIT Connect',
  slug: 'werit-connect',
  owner: 'icebreaker',
  version: '0.1.0',
  scheme: 'weritconnect',
  orientation: 'default',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  ios: {
    bundleIdentifier: 'eu.werit.connect',
    supportsTablet: true,
  },
  android: {
    package: 'eu.werit.connect',
  },
  plugins: [
    'expo-secure-store',
    'expo-localization',
    'expo-web-browser',
    'expo-notifications',
    // Verschlüsselte lokale Datenbank (siehe src/shared/offline/db.ts)
    ['expo-sqlite', { useSQLCipher: true }],
  ],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
    entraTenantId: process.env.EXPO_PUBLIC_ENTRA_TENANT_ID ?? '',
    entraClientId: process.env.EXPO_PUBLIC_ENTRA_CLIENT_ID ?? '',
    apiScope: process.env.EXPO_PUBLIC_API_SCOPE ?? '',
    eas: { projectId: 'f22147ab-8b92-4dc7-914c-54716acfd699' },
  },
};

export default config;
