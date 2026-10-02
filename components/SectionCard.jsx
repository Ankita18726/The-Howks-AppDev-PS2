import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import Card from './Card';

export default function SectionCard({ title, subtitle, icon, children, items, itemStyle = 'bullet', emptyMessage = 'Information is not available yet.' }) {
  return (
    <Card>
      <View style={styles.header}>
        {icon ? <View style={styles.icon}><Text style={styles.iconText}>{icon}</Text></View> : null}
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {children || (items?.length ? (
        <View style={styles.list}>
          {items.map((item, index) => (
            <View key={`${String(item)}-${index}`} style={styles.row}>
              <View style={[styles.marker, itemStyle === 'number' && styles.numberMarker, itemStyle === 'check' && styles.checkMarker]}>
                <Text style={[styles.markerText, itemStyle === 'number' && styles.numberText]}>
                  {itemStyle === 'number' ? index + 1 : itemStyle === 'check' ? '✓' : '•'}
                </Text>
              </View>
              <Text style={styles.body}>{typeof item === 'string' ? item : item.text || item.title}</Text>
            </View>
          ))}
        </View>
      ) : <Text style={styles.muted}>{emptyMessage}</Text>)}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  headerCopy: { flex: 1, gap: 2 },
  icon: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 10, height: 36, justifyContent: 'center', width: 36 },
  iconText: { color: colors.primary, fontSize: typography.body, fontWeight: '900' },
  title: { color: colors.text, fontSize: typography.heading, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: typography.small },
  list: { gap: spacing.md }, row: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  marker: { alignItems: 'center', height: 24, justifyContent: 'center', width: 24 },
  numberMarker: { backgroundColor: colors.primarySoft, borderRadius: 12 },
  checkMarker: { backgroundColor: colors.accentSoft, borderRadius: 7 },
  markerText: { color: colors.accent, fontSize: typography.body, fontWeight: '900' },
  numberText: { color: colors.primary, fontSize: typography.small },
  body: { color: colors.text, flex: 1, fontSize: typography.body, lineHeight: 23 },
  muted: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
});
