import { StyleSheet, View } from 'react-native';

import { colors, radii, shadows, spacing } from '../constants/theme';

export default function Card({ children, style, ...viewProps }) {
  return (
    <View style={[styles.card, style]} {...viewProps}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
});
