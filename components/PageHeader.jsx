import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';

export default function PageHeader({ eyebrow, title, description }) {
  return (
    <View style={styles.container}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  eyebrow: { color: colors.accent, fontSize: typography.small, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '900', letterSpacing: -0.7, lineHeight: 39 },
  description: { color: colors.textMuted, fontSize: typography.body, lineHeight: 24 },
});
