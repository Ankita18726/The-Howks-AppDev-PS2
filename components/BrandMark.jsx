import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../constants/theme';

export default function BrandMark({ compact = false }) {
  return (
    <View style={styles.row} accessibilityLabel="Kayda Sathi">
      <View style={[styles.mark, compact && styles.compactMark]}>
        <Text style={[styles.symbol, compact && styles.compactSymbol]}>क</Text>
      </View>
      <View>
        <Text style={[styles.name, compact && styles.compactName]}>Kayda Sathi</Text>
        {!compact ? <Text style={styles.localName}>कायदा साथी</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  mark: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radii.md, height: 48, justifyContent: 'center', width: 48 },
  compactMark: { height: 38, width: 38 },
  symbol: { color: colors.white, fontSize: 25, fontWeight: '900' },
  compactSymbol: { fontSize: 20 },
  name: { color: colors.text, fontSize: typography.heading, fontWeight: '900', letterSpacing: -0.4 },
  compactName: { fontSize: 18 },
  localName: { color: colors.textMuted, fontSize: typography.small, fontWeight: '600' },
});
