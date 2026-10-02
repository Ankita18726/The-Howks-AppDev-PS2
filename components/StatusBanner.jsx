import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';

export default function StatusBanner({ title, message, tone = 'info', icon }) {
  const palette = tone === 'error'
    ? { background: colors.errorSoft, border: '#F5C7C3', text: colors.error, symbol: '!' }
    : tone === 'warning'
      ? { background: colors.warningSoft, border: '#F2D7A7', text: colors.warning, symbol: '!' }
      : tone === 'success'
        ? { background: colors.successSoft, border: '#BCE3D6', text: colors.success, symbol: '✓' }
        : { background: colors.primarySoft, border: '#C9D5F2', text: colors.primary, symbol: 'i' };

  return (
    <View accessibilityRole={tone === 'error' ? 'alert' : undefined} style={[styles.container, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <View style={[styles.icon, { backgroundColor: palette.text }]}><Text style={styles.iconText}>{icon || palette.symbol}</Text></View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  icon: { alignItems: 'center', borderRadius: radii.pill, height: 24, justifyContent: 'center', marginTop: 1, width: 24 },
  iconText: { color: colors.white, fontSize: typography.small, fontWeight: '900' },
  copy: { flex: 1, gap: 3 },
  title: { fontSize: typography.body, fontWeight: '800' },
  message: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
});
