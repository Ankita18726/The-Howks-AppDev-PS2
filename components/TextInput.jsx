import { StyleSheet, Text, TextInput as NativeTextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';

export default function TextInput({ label, error, helperText, style, ...inputProps }) {
  const supportingText = error || helperText;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <NativeTextInput
        placeholderTextColor={colors.placeholder}
        style={[styles.input, error && styles.inputError, inputProps.editable === false && styles.disabled, style]}
        accessibilityLabel={inputProps.accessibilityLabel || label}
        accessibilityState={{ disabled: inputProps.editable === false }}
        {...inputProps}
      />
      {supportingText ? (
        <Text style={[styles.supportingText, error && styles.errorText]}>{supportingText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputError: {
    borderColor: colors.error,
  },
  disabled: {
    backgroundColor: colors.disabled,
    color: colors.textMuted,
  },
  supportingText: {
    color: colors.textMuted,
    fontSize: typography.small,
  },
  errorText: {
    color: colors.error,
  },
});
