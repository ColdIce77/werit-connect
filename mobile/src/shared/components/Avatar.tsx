import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { initials } from '../utils/format';

interface AvatarProps {
  name: string;
  size?: number;
}

/** Runder Platzhalter mit Initialen. Fotos folgen, sobald das Backend sie liefert. */
export function Avatar({ name, size = 44 }: AvatarProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { backgroundColor: colors.brandPrimary, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.brandOnPrimary, fontWeight: '600' },
});
