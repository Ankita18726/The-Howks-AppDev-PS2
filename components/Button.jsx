import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';

export default function Button({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  icon,
  style,
  ...pressableProps
}) {
  const isDisabled = disabled || loading;
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isSecondary ? styles.secondary : isGhost ? styles.ghost : styles.primary,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary || isGhost ? colors.primary : colors.white} />
      ) : (
        <View style={styles.content}>
          {icon ? <Text style={[styles.icon, (isSecondary || isGhost) && styles.secondaryLabel]}>{icon}</Text> : null}
          <Text style={[styles.label, (isSecondary || isGhost) && styles.secondaryLabel]}>{label ?? 'Continue'}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radii.md,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.lg,
  },
  content: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  ghost: { backgroundColor: 'transparent' },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '700',
  },
  icon: { color: colors.white, fontSize: 18, fontWeight: '800' },
  secondaryLabel: {
    color: colors.primary,
  },
});
