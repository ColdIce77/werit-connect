import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { ApiError, api } from '../../shared/api/client';
import type { MeResponse } from '../../shared/api/types';
import { config, isConfigComplete, URL_SCHEME } from '../../shared/config';
import { useAuthStore, type BlockReason } from './authStore';

/**
 * Anmeldung mit Microsoft Entra ID (Authorization Code Flow mit PKCE, kein Client Secret).
 *
 * Speicherung:
 * - Access Token nur im Arbeitsspeicher (Entra-Tokens können größer als das SecureStore-Limit sein)
 * - Refresh Token im SecureStore (Keychain / Keystore)
 * - Profil (Rollen, Berechtigungen) im SecureStore, damit die App offline startet
 *
 * Unter Intune wird die Anmeldung später auf den Broker (Microsoft Authenticator)
 * umgestellt. Dafür ersetzt eine MSAL-Implementierung die Funktionen in dieser Datei,
 * die Schnittstelle nach außen bleibt gleich.
 */

WebBrowser.maybeCompleteAuthSession();

const REFRESH_TOKEN_KEY = 'werit.auth.refreshToken';
const PROFILE_KEY = 'werit.auth.profile';

const issuer = () => `https://login.microsoftonline.com/${config.entraTenantId}/v2.0`;
const redirectUri = () => AuthSession.makeRedirectUri({ scheme: URL_SCHEME, path: 'auth' });
const scopes = () => [config.apiScope, 'openid', 'profile', 'offline_access'];

export type SignInResult = 'success' | 'cancelled' | 'config_error' | 'failed';

let current: AuthSession.TokenResponse | null = null;
let refreshInFlight: Promise<string> | null = null;
const signOutHooks = new Set<() => void>();

/** Registriert eine Funktion, die bei der Abmeldung lokale Daten löscht (Caches, SQLite, Dateien). */
export function onSignedOut(hook: () => void): () => void {
  signOutHooks.add(hook);
  return () => signOutHooks.delete(hook);
}

// ---------------------------------------------------------------------------
// Tokens
// ---------------------------------------------------------------------------

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new ApiError(401, 'no_refresh_token', 'Not signed in');

  const discovery = await AuthSession.fetchDiscoveryAsync(issuer());
  const base = new AuthSession.TokenResponse({ accessToken: '', refreshToken });
  const refreshed = await base.refreshAsync(
    { clientId: config.entraClientId, scopes: scopes() },
    discovery,
  );

  current = refreshed;
  // Entra rotiert Refresh Tokens, der neue Wert ersetzt den alten.
  if (refreshed.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshed.refreshToken);
  }
  return refreshed.accessToken;
}

/** Liefert ein gültiges Access Token und erneuert es bei Bedarf (parallele Aufrufe teilen sich eine Erneuerung). */
export async function getAccessToken(): Promise<string> {
  if (current && !current.shouldRefresh()) return current.accessToken;

  refreshInFlight ??= refreshAccessToken().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

// ---------------------------------------------------------------------------
// Profil
// ---------------------------------------------------------------------------

function blockReasonFrom(error: ApiError): BlockReason | null {
  if (error.status !== 403) return null;
  switch (error.code) {
    case 'not_compliant':
      return 'not_compliant';
    case 'revoked':
      return 'revoked';
    default:
      return 'no_access';
  }
}

function applyProfile(me: MeResponse): void {
  useAuthStore.getState().setSignedIn({
    user: me.user,
    roles: me.roles,
    permissions: me.permissions,
  });
}

async function loadProfile(): Promise<void> {
  try {
    const me = await api.get<MeResponse>('/me');
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(me));
    applyProfile(me);
  } catch (error) {
    if (error instanceof ApiError) {
      const reason = blockReasonFrom(error);
      if (reason) {
        useAuthStore.getState().setBlocked(reason);
        return;
      }
      // Keine Verbindung: mit dem zuletzt bekannten Profil offline weiterarbeiten
      if (error.isNetworkError) {
        const cached = await SecureStore.getItemAsync(PROFILE_KEY);
        if (cached) {
          applyProfile(JSON.parse(cached) as MeResponse);
          return;
        }
      }
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Öffentliche Schnittstelle
// ---------------------------------------------------------------------------

/** Beim App-Start: vorhandene Sitzung wiederherstellen. */
export async function restoreSession(): Promise<void> {
  const store = useAuthStore.getState();
  try {
    const hasToken = !!(await SecureStore.getItemAsync(REFRESH_TOKEN_KEY));
    if (!hasToken || !isConfigComplete()) {
      store.setSignedOut();
      return;
    }
    try {
      await getAccessToken();
    } catch (error) {
      // Ohne Verbindung mit gespeichertem Profil starten, sonst abmelden
      const cached = await SecureStore.getItemAsync(PROFILE_KEY);
      const offline = !(error instanceof ApiError) || error.isNetworkError;
      if (cached && offline) {
        applyProfile(JSON.parse(cached) as MeResponse);
        return;
      }
      throw error;
    }
    await loadProfile();
  } catch {
    await signOut();
  }
}

/** Interaktive Anmeldung über den Systembrowser (Single Sign-On mit der Entra-Sitzung). */
export async function signIn(): Promise<SignInResult> {
  if (!isConfigComplete()) return 'config_error';

  try {
    const discovery = await AuthSession.fetchDiscoveryAsync(issuer());
    const request = new AuthSession.AuthRequest({
      clientId: config.entraClientId,
      scopes: scopes(),
      redirectUri: redirectUri(),
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    });
    await request.makeAuthUrlAsync(discovery);

    const result = await request.promptAsync(discovery);
    if (result.type === 'cancel' || result.type === 'dismiss') return 'cancelled';
    if (result.type !== 'success' || !request.codeVerifier) return 'failed';

    const token = await AuthSession.exchangeCodeAsync(
      {
        clientId: config.entraClientId,
        code: result.params.code ?? '',
        redirectUri: redirectUri(),
        extraParams: { code_verifier: request.codeVerifier },
      },
      discovery,
    );

    if (!token.refreshToken) return 'failed';
    current = token;
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token.refreshToken);

    await loadProfile();
    return 'success';
  } catch {
    return 'failed';
  }
}

/** Beendet die Sitzung und löscht lokale Daten. */
export async function signOut(): Promise<void> {
  current = null;
  refreshInFlight = null;
  await Promise.allSettled([
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(PROFILE_KEY),
  ]);
  signOutHooks.forEach((hook) => hook());
  useAuthStore.getState().setSignedOut();
}
