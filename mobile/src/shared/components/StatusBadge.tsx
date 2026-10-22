import { StyleSheet, Text, View } from 'react-native';

import { font, radius, spacing } from '../theme/tokens';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

const TONES: Record<Tone, { background: string; text: string }> = {
  success: { background: '#DFF6DD', text: '#0E5A0B' },
  warning: { background: '#FFF4CE', text: '#6B4E00' },
  danger: { background: '#FDE7E9', text: '#8A1C1C' },
  neutral: { background: '#EDEFF2', text: '#3B4350' },
};

/** Kleine Statusmarke. Der Zustand steht immer im Text, nie nur in der Farbe. */
export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const colorSet = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: colorSet.background }]}>
      <Text style={[styles.text, { color: colorSet.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.round,
  },
  text: { fontSize: font.caption, fontWeight: '600' },
});
