import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';

export default function LoadingIndicator({ message = 'Loading…', detail, fullScreen = false }) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={[styles.container, fullScreen && styles.fullScreen]}
    >
      <ActivityIndicator color={colors.primary} size="large" />
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '800',
    textAlign: 'center',
  },
  detail: { color: colors.textMuted, fontSize: typography.small, lineHeight: 20, textAlign: 'center' },
});
