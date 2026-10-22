/** Unterstützte Sprachen. Weitere Sprachen: Sprachdatei anlegen und hier eintragen. */
export const SUPPORTED_LANGUAGES = ['de', 'en', 'fr'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LANGUAGE: SupportedLanguage = 'de';

/** Anzeigenamen in der jeweiligen Sprache selbst (nicht übersetzt) */
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
};

export function isSupportedLanguage(code: string | null | undefined): code is SupportedLanguage {
  return !!code && (SUPPORTED_LANGUAGES as readonly string[]).includes(code);
}
