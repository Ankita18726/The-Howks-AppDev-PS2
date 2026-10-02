import { Pressable, StyleSheet, Text, TextInput as NativeTextInput, View } from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';

export default function TextInput({ label, error, helperText, style, rightLabel, onRightPress, ...inputProps }) {
  const supportingText = error || helperText;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputShell, error && styles.inputError, inputProps.editable === false && styles.disabled]}>
        <NativeTextInput
          placeholderTextColor={colors.placeholder}
          style={[styles.input, style]}
          accessibilityLabel={inputProps.accessibilityLabel || label}
          accessibilityState={{ disabled: inputProps.editable === false }}
          {...inputProps}
        />
        {rightLabel && onRightPress ? (
          <Pressable accessibilityRole="button" onPress={onRightPress} hitSlop={10} style={styles.rightAction}>
            <Text style={styles.rightLabel}>{rightLabel}</Text>
          </Pressable>
        ) : null}
      </View>
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
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 50,
  },
  input: { color: colors.text, flex: 1, fontSize: typography.body, minHeight: 50, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
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
  rightAction: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.md },
  rightLabel: { color: colors.primary, fontSize: typography.small, fontWeight: '800' },
});
