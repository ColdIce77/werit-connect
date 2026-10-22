import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme/colors';
import { font, MIN_TOUCH, radius, spacing } from '../theme/tokens';

interface CardProps {
  title?: string;
  /** Beschriftung des Links rechts neben dem Titel, z. B. "Alle anzeigen" */
  actionLabel?: string;
  onAction?: () => void;
  /** Farbiger Rand links, z. B. für wichtige Ankündigungen */
  accentColor?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ title, actionLabel, onAction, accentColor, children, style }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 4 } : null,
        style,
      ]}
    >
      {title ? (
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {actionLabel && onAction ? (
            <Pressable
              accessibilityRole="button"
              onPress={onAction}
              style={styles.action}
              hitSlop={8}
            >
              <Text style={styles.actionText}>{actionLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH - spacing.sm,
  },
  title: { fontSize: font.title, fontWeight: '600', color: colors.textPrimary, flexShrink: 1 },
  action: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingLeft: spacing.sm },
  actionText: { fontSize: font.body, color: colors.brandPrimary, fontWeight: '600' },
});
