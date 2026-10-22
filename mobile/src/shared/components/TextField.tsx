import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../theme/colors';
import { font, MIN_TOUCH, radius, spacing } from '../theme/tokens';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  error?: string | null;
}

/** Beschriftetes Eingabefeld. Die Beschriftung steht über dem Feld, nicht nur als Platzhalter. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  maxLength,
  error,
}: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={label}
        multiline={multiline}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { fontSize: font.body, fontWeight: '600', color: colors.textPrimary },
  input: {
    minHeight: MIN_TOUCH + 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: font.bodyLarge,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  multiline: { minHeight: 140 },
  inputError: { borderColor: colors.danger },
  error: { fontSize: font.caption, color: colors.danger },
});
