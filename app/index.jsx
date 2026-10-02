import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import Screen from '../components/Screen';
import { colors, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/getErrorMessage';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState('');

  const handleSignOut = async () => {
    setSigningOut(true); setError('');
    try {
      await signOut();
    } catch (signOutError) {
      setError(getErrorMessage(signOutError, 'Sign out failed. Please try again.'));
    } finally {
      setSigningOut(false);
    }
  };

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
        <Text style={styles.notice}>Signed in as {user?.email || 'Firebase user'}</Text>
      </Card>
      <Button label="Describe my problem" onPress={() => router.push('/describe')} />
      <Button label="Previous queries" variant="secondary" onPress={() => router.push('/history')} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Button label="Sign out" variant="secondary" onPress={handleSignOut} loading={signingOut} />
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
  notice: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
  error: { color: colors.error, fontSize: typography.small, lineHeight: 19 },
  disclaimer: { color: colors.textMuted, fontSize: typography.small, textAlign: 'center' },
});
