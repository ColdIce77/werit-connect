import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import { colors } from '../../shared/theme/colors';
import { useLayout } from '../../shared/theme/responsive';
import { AssistantStack } from './AssistantStack';
import { DirectoryStack } from './DirectoryStack';
import { DocumentsStack } from './DocumentsStack';
import { HomeStack } from './HomeStack';
import { MoreStack } from './MoreStack';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Icons sind hier gebündelt und lassen sich später gegen Fluent-Icons tauschen.
const TAB_ICONS: Record<keyof MainTabParamList, { active: IconName; inactive: IconName }> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  DirectoryTab: { active: 'people', inactive: 'people-outline' },
  AssistantTab: { active: 'chatbubble-ellipses', inactive: 'chatbubble-ellipses-outline' },
  DocumentsTab: { active: 'document-text', inactive: 'document-text-outline' },
  MoreTab: { active: 'menu', inactive: 'menu-outline' },
};

/**
 * Hauptnavigation. Ein einziger Navigator für Smartphone und Tablet:
 * unten als Tab-Leiste, auf Tablets als Seitenleiste links. So bleibt der
 * Zustand bei Drehen oder Fenstergrößenänderung erhalten.
 * Benötigt React Navigation 7 (tabBarPosition, tabBarVariant).
 */
export function MainTabs() {
  const { t } = useTranslation();
  const { isTablet } = useLayout();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: true,
        tabBarPosition: isTablet ? 'left' : 'bottom',
        tabBarVariant: isTablet ? 'material' : 'uikit',
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 13 },
        // Große Touchflächen: mindestens 56 dp hohe Leiste auf Smartphones
        tabBarStyle: isTablet ? undefined : { minHeight: 56 },
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: t('nav.home') }} />
      <Tab.Screen
        name="DirectoryTab"
        component={DirectoryStack}
        options={{ title: t('nav.directory') }}
      />
      <Tab.Screen
        name="AssistantTab"
        component={AssistantStack}
        options={{ title: t('nav.assistant') }}
      />
      <Tab.Screen
        name="DocumentsTab"
        component={DocumentsStack}
        options={{ title: t('nav.documents') }}
      />
      <Tab.Screen name="MoreTab" component={MoreStack} options={{ title: t('nav.more') }} />
    </Tab.Navigator>
  );
}
