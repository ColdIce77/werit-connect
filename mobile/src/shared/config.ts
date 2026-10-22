import Constants from 'expo-constants';

/** URL-Schema der App (Deep Links, Anmelde-Weiterleitung). Muss zu app.config.ts passen. */
export const URL_SCHEME = 'weritconnect';

export interface AppConfig {
  apiBaseUrl: string;
  entraTenantId: string;
  entraClientId: string;
  apiScope: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<AppConfig>;

export const config: AppConfig = {
  apiBaseUrl: (extra.apiBaseUrl ?? '').replace(/\/+$/, ''),
  entraTenantId: extra.entraTenantId ?? '',
  entraClientId: extra.entraClientId ?? '',
  apiScope: extra.apiScope ?? '',
};

export function isConfigComplete(): boolean {
  return Object.values(config).every((value) => value.length > 0);
}
