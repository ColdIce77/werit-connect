import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '../../../shared/api/client';
import { Card } from '../../../shared/components/Card';
import { ListRow } from '../../../shared/components/ListRow';
import { Screen } from '../../../shared/components/Screen';
import i18n, { deviceLanguage } from '../../../shared/i18n';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '../../../shared/i18n/languages';
import {
  getLanguagePreference,
  setLanguagePreference,
  type LanguagePreference,
} from '../../../shared/i18n/languageStore';
import { resetLocalizedContent, runFullSync } from '../../../shared/offline/sync';
import { colors } from '../../../shared/theme/colors';
import { setupNotificationChannels } from '../../notifications/pushService';

export function LanguageSettingsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<LanguagePreference>(getLanguagePreference());

  const choose = async (preference: LanguagePreference) => {
    if (preference === selected) return;
    setSelected(preference);
    setLanguagePreference(preference);

    const language = preference === 'system' ? deviceLanguage() : preference;
    await i18n.changeLanguage(language);

    // Backend informieren, damit Push-Texte in dieser Sprache ankommen. Ohne Verbindung folgt es später.
    void api.patch('/me/settings', { language }).catch(() => undefined);
    void setupNotificationChannels().catch(() => undefined);

    // Übersetzte Offline-Inhalte (Notfallkontakte, Unterweisungen) neu laden
    await resetLocalizedContent().catch(() => undefined);
    void runFullSync({ force: true }).catch(() => undefined);
    void queryClient.invalidateQueries();
  };

  const options: { value: LanguagePreference; label: string }[] = [
    { value: 'system', label: t('settings.languageSystem') },
    ...SUPPORTED_LANGUAGES.map((code) => ({ value: code as LanguagePreference, label: LANGUAGE_NAMES[code] })),
  ];

  return (
    <Screen>
      <Card>
        {options.map((option) => (
          <ListRow
            key={option.value}
            title={option.label}
            selected={option.value === selected}
            right={
              option.value === selected ? (
                <Ionicons name="checkmark" size={24} color={colors.brandPrimary} />
              ) : (
                <></>
              )
            }
            onPress={() => void choose(option.value)}
          />
        ))}
      </Card>
    </Screen>
  );
}
