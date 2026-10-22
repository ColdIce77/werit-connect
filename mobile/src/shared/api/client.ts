import { config } from '../config';
import i18n from '../i18n';

/**
 * HTTP-Client für die WERIT-Connect-API.
 * - hängt das Access Token und die App-Sprache an jede Anfrage
 * - übersetzt Fehler in ApiError (status 0 = keine Verbindung)
 * - meldet 401 an die Anmeldung, die Sitzung beendet oder erneuert
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

interface ClientHooks {
  getToken: () => Promise<string>;
  onUnauthorized: () => void;
}

let hooks: ClientHooks | null = null;

/** Wird einmal beim Start aufgerufen (App.tsx). Der Client kennt die Anmeldung nicht direkt. */
export function configureApiClient(value: ClientHooks): void {
  hooks = value;
}

const REQUEST_TIMEOUT_MS = 15_000;

type Query = Record<string, string | number | boolean | undefined>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params.append(key, String(value));
    }
  }
  const qs = params.toString();
  return `${config.apiBaseUrl}${path}${qs ? `?${qs}` : ''}`;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  if (!hooks) throw new Error('API-Client ist nicht konfiguriert.');

  let token: string;
  try {
    token = await hooks.getToken();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Fehler des Identitätsanbieters (z. B. invalid_grant) tragen einen Fehlercode: Sitzung ungültig.
    if (typeof (error as { code?: unknown }).code === 'string') {
      hooks.onUnauthorized();
      throw new ApiError(401, 'unauthorized', 'Session expired');
    }
    // Sonst ist die Erneuerung des Tokens an der fehlenden Verbindung gescheitert.
    throw new ApiError(0, 'network', 'Network request failed');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  options.signal?.addEventListener('abort', onExternalAbort);

  try {
    const response = await fetch(buildUrl(path, options.query), {
      method,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Accept-Language': i18n.language,
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 401) {
      hooks.onUnauthorized();
      throw new ApiError(401, 'unauthorized', 'Unauthorized');
    }

    if (!response.ok) {
      let code: string | null = null;
      let message = response.statusText || 'Request failed';
      try {
        const payload = (await response.json()) as { code?: string; message?: string };
        code = payload.code ?? null;
        message = payload.message ?? message;
      } catch {
        // Antwort ohne JSON-Inhalt
      }
      throw new ApiError(response.status, code, message);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Abbruch durch den Aufrufer (z. B. neue Suche) ist kein Fehler für die Anzeige
    if (options.signal?.aborted) throw error;
    throw new ApiError(0, 'network', 'Network request failed');
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', onExternalAbort);
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};
