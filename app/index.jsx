import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import Screen from '../components/Screen';
import { colors, spacing, typography } from '../constants/theme';

export default function HomeScreen() {
  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.badge}><Text style={styles.badgeText}>कायदा साथी</Text></View>
        <Text style={styles.title}>Legal problems, explained simply.</Text>
        <Text style={styles.subtitle}>
          Describe what happened. Kayda Sathi will organize the issue and show clear information and next steps.
        </Text>
      </View>
      <Card>
        <Text style={styles.cardTitle}>Currently supported</Text>
        <Text style={styles.cardText}>Consumer • Cyber fraud • Rental • Salary • Government grievance</Text>
        <Text style={styles.notice}>
          Development preview: AI classification and verified legal knowledge are not connected yet. Mock results are clearly labelled.
        </Text>
      </Card>
      <Button label="Describe my problem" onPress={() => router.push('/describe')} />
      <Text style={styles.disclaimer}>Kayda Sathi provides information, not legal representation.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' }, hero: { gap: spacing.md },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8 },
  badgeText: { color: colors.primary, fontWeight: '800' },
  title: { color: colors.text, fontSize: 38, fontWeight: '800', lineHeight: 45 },
  subtitle: { color: colors.textMuted, fontSize: 18, lineHeight: 27 },
  cardTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '700' },
  cardText: { color: colors.text, fontSize: typography.body, lineHeight: 24 },
  notice: { color: colors.error, fontSize: typography.small, lineHeight: 19 },
  disclaimer: { color: colors.textMuted, fontSize: typography.small, textAlign: 'center' },
});
