import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';
import Button from './Button';

export default function EmptyState({
  title = 'Nothing here yet',
  message = 'New items will appear here when they are available.',
  actionLabel,
  onAction,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}><Text style={styles.icon}>⌕</Text></View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && typeof onAction === 'function' ? (
        <Button label={actionLabel} onPress={onAction} variant="secondary" style={styles.button} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  iconWrap: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  icon: { color: colors.primary, fontSize: 32, fontWeight: '800' },
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
