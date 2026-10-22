import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { colors } from '../../shared/theme/colors';
import { HeaderActions } from './HeaderActions';

/** Gemeinsame Kopfzeile aller Bereiche: dunkelblau, weiße Schrift, helle Inhalte. */
export const defaultStackOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.brandPrimary },
  headerTintColor: colors.brandOnPrimary,
  headerTitleStyle: { fontWeight: '600' },
  headerRight: () => <HeaderActions />,
  contentStyle: { backgroundColor: colors.background },
};

/** Kopfzeile für Modale (ohne zusätzliche Aktionen). */
export const modalStackOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.brandPrimary },
  headerTintColor: colors.brandOnPrimary,
  headerTitleStyle: { fontWeight: '600' },
  presentation: 'modal',
  contentStyle: { backgroundColor: colors.background },
};
