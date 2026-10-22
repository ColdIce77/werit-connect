import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { font, spacing } from '../theme/tokens';

interface ListRowProps {
  title: string;
  subtitle?: string | null;
  /** Element links (Avatar, Symbol) */
  left?: ReactNode;
  /** Element rechts, ersetzt den Pfeil */
  right?: ReactNode;
  onPress?: () => void;
  selected?: boolean;
  accessibilityLabel?: string;
}

const ROW_HEIGHT = 64;

/** Zeile mit mindestens 64 dp Höhe, damit sie auch mit Handschuhen sicher getroffen wird. */
export function ListRow({
  title,
  subtitle,
  left,
  right,
  onPress,
  selected = false,
  accessibilityLabel,
}: ListRowProps) {
  const body = (
    <View style={[styles.row, selected && styles.selected]}>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ??
        (onPress ? (
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        ) : null)}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ selected }}
      onPress={onPress}
      android_ripple={{ color: colors.border }}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  selected: { backgroundColor: '#E6ECF6', borderRadius: 8 },
  left: { alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: font.bodyLarge, color: colors.textPrimary, fontWeight: '500' },
  subtitle: { fontSize: font.body, color: colors.textSecondary },
});
