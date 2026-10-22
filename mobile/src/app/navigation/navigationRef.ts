import { createNavigationContainerRef } from '@react-navigation/native';

import type { RootStackParamList } from './types';

/** Erlaubt Navigation außerhalb von Bildschirmen, z. B. aus dem Push-Dienst. */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
