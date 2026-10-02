import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';
import Button from './Button';

export default function ErrorState({
  title = 'Unable to load',
  message = 'Check your connection and try again.',
  onRetry,
  retryLabel = 'Try again',
}) {
  return (
    <View accessibilityRole="alert" style={styles.container}>
      <View style={styles.iconWrap}><Text style={styles.icon}>!</Text></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {typeof onRetry === 'function' ? (
        <Button label={retryLabel} onPress={onRetry} style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  iconWrap: { alignItems: 'center', backgroundColor: colors.errorSoft, borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  icon: { color: colors.error, fontSize: 30, fontWeight: '900' },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
});
