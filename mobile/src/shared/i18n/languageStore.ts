import Storage from 'expo-sqlite/kv-store';

import { isSupportedLanguage, type SupportedLanguage } from './languages';

/**
 * Gewählte App-Sprache. "system" folgt der Geräteeinstellung.
 * Die Wahl ist keine vertrauliche Information und liegt im einfachen Schlüssel-Wert-Speicher.
 */
export type LanguagePreference = 'system' | SupportedLanguage;

const KEY = 'werit.language';

export function getLanguagePreference(): LanguagePreference {
  try {
    const value = Storage.getItemSync(KEY);
    return isSupportedLanguage(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

export function setLanguagePreference(preference: LanguagePreference): void {
  try {
    if (preference === 'system') Storage.removeItemSync(KEY);
    else Storage.setItemSync(KEY, preference);
  } catch {
    // Speicher nicht verfügbar: Die Wahl gilt dann nur bis zum Neustart.
  }
}
