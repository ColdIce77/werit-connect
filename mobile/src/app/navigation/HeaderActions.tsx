import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useUnreadCount } from '../../features/notifications/api';
import { colors } from '../../shared/theme/colors';
import type { RootStackParamList } from './types';

const TOUCH_SIZE = 48;

/**
 * Aktionen in der Kopfzeile aller Bereiche: Posteingang und Notfallkontakte.
 * Notfallkontakte sind damit von jedem Bildschirm aus mit einem Tipp erreichbar.
 */
export function HeaderActions() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { data: unread = 0 } = useUnreadCount();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={unread > 0 ? `${t('nav.notifications')} (${unread})` : t('nav.notifications')}
        onPress={() =>
          navigation.navigate('Main', { screen: 'HomeTab', params: { screen: 'Notifications' } })
        }
        style={styles.button}
      >
        <Ionicons name="notifications-outline" size={24} color={colors.brandOnPrimary} />
        {unread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
          </View>
        ) : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('nav.emergency')}
        onPress={() => navigation.navigate('Emergency')}
        style={styles.button}
      >
        <Ionicons name="alert-circle" size={26} color={colors.brandOnPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.brandOnPrimary, fontSize: 11, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center' },
  button: {
    minWidth: TOUCH_SIZE,
    minHeight: TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
