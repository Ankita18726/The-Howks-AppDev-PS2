import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import Card from './Card';

export default function SectionCard({ title, children, items, emptyMessage = 'Information is not available yet.' }) {
  return (
    <Card>
      <Text style={styles.title}>{title}</Text>
      {children || (items?.length ? (
        <View style={styles.list}>
          {items.map((item, index) => (
            <View key={`${String(item)}-${index}`} style={styles.row}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.body}>{typeof item === 'string' ? item : item.text || item.title}</Text>
            </View>
          ))}
        </View>
      ) : <Text style={styles.muted}>{emptyMessage}</Text>)}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: typography.heading, fontWeight: '700' },
  list: { gap: spacing.sm }, row: { flexDirection: 'row', gap: spacing.sm },
  bullet: { color: colors.primary, fontSize: typography.body, fontWeight: '800' },
  body: { color: colors.text, flex: 1, fontSize: typography.body, lineHeight: 23 },
  muted: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
});
