import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import de from './locales/de.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import { getLanguagePreference } from './languageStore';
import { FALLBACK_LANGUAGE, isSupportedLanguage, type SupportedLanguage } from './languages';

export { SUPPORTED_LANGUAGES, FALLBACK_LANGUAGE, isSupportedLanguage, type SupportedLanguage } from './languages';

export function deviceLanguage(): SupportedLanguage {
  const code = Localization.getLocales()[0]?.languageCode;
  return isSupportedLanguage(code) ? code : FALLBACK_LANGUAGE;
}

/** Gespeicherte Wahl, sonst Gerätesprache, sonst Deutsch. */
function initialLanguage(): SupportedLanguage {
  const preference = getLanguagePreference();
  return preference === 'system' ? deviceLanguage() : preference;
}

void i18n.use(initReactI18next).init({
  resources: { de: { translation: de }, en: { translation: en }, fr: { translation: fr } },
  lng: initialLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
