import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import BrandMark from '../components/BrandMark';
import Button from '../components/Button';
import Card from '../components/Card';
import Screen from '../components/Screen';
import StatusBanner from '../components/StatusBanner';
import { colors, radii, shadows, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/getErrorMessage';

const STEPS = [
  ['1', 'Describe', 'Tell us what happened in your own words.'],
  ['2', 'Understand', 'Get clear information organized for your issue.'],
  ['3', 'Take action', 'Follow next steps and prepare an editable draft.'],
];

const CATEGORIES = [
  ['⌂', 'Rental & deposit'],
  ['✓', 'Consumer complaint'],
  ['◎', 'Cyber fraud'],
  ['₹', 'Salary & wages'],
  ['▦', 'Govt. grievance'],
];

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
      <View style={styles.topBar}>
        <BrandMark compact />
        <Pressable accessibilityLabel="Previous queries" accessibilityRole="button" onPress={() => router.push('/history')} style={({ pressed }) => [styles.historyIcon, pressed && styles.pressed]}>
          <Text style={styles.historyIconText}>↻</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.trustPill}><Text style={styles.trustText}>SIMPLE • PRIVATE • ACTIONABLE</Text></View>
        <Text style={styles.title}>Understand your legal problem. Know what to do next.</Text>
        <Text style={styles.subtitle}>Describe what happened in everyday language and get organized guidance you can act on.</Text>
        <Button label="Describe your problem" icon="→" onPress={() => router.push('/describe')} style={styles.heroButton} />
        <Button label="View previous queries" icon="↻" variant="secondary" onPress={() => router.push('/history')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How it works</Text>
        <View style={styles.steps}>
          {STEPS.map(([number, title, description]) => (
            <View key={number} style={styles.step}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View>
              <View style={styles.stepCopy}><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepText}>{description}</Text></View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Common issues</Text>
        <Text style={styles.sectionSubtitle}>Guidance is currently available for these categories.</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(([icon, label]) => (
            <Pressable key={label} onPress={() => router.push('/describe')} style={({ pressed }) => [styles.category, pressed && styles.pressed]}>
              <View style={styles.categoryIcon}><Text style={styles.categoryIconText}>{icon}</Text></View>
              <Text style={styles.categoryText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Card style={styles.accountCard}>
        <View style={styles.accountAvatar}><Text style={styles.accountAvatarText}>{(user?.email || 'K').charAt(0).toUpperCase()}</Text></View>
        <View style={styles.accountCopy}>
          <Text style={styles.accountLabel}>Signed in securely</Text>
          <Text numberOfLines={1} style={styles.accountEmail}>{user?.email || 'Firebase user'}</Text>
        </View>
        <Pressable accessibilityRole="button" disabled={signingOut} onPress={handleSignOut} hitSlop={8}>
          <Text style={styles.signOut}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
        </Pressable>
      </Card>
      {error ? <StatusBanner title="Could not sign out" message={error} tone="error" /> : null}
      <Text style={styles.disclaimer}>General legal information, not legal advice.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xl },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  historyIcon: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  historyIconText: { color: colors.primary, fontSize: 22, fontWeight: '800' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  hero: { backgroundColor: colors.primaryDark, borderRadius: radii.xl, gap: spacing.md, padding: spacing.xl, ...shadows.raised },
  trustPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 7 },
  trustText: { color: '#C9D6F4', fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  title: { color: colors.white, fontSize: 32, fontWeight: '900', letterSpacing: -0.8, lineHeight: 39 },
  subtitle: { color: '#D8E0F2', fontSize: typography.body, lineHeight: 24 },
  heroButton: { backgroundColor: colors.accent, marginTop: spacing.xs },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '800' },
  sectionSubtitle: { color: colors.textMuted, fontSize: typography.small, marginTop: -spacing.sm },
  steps: { gap: spacing.sm },
  step: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  stepNumber: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  stepNumberText: { color: colors.primary, fontWeight: '900' },
  stepCopy: { flex: 1, gap: 2, paddingTop: 1 },
  stepTitle: { color: colors.text, fontSize: typography.body, fontWeight: '800' },
  stepText: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  category: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, minHeight: 62, padding: spacing.sm, width: '48%' },
  categoryIcon: { alignItems: 'center', backgroundColor: colors.accentSoft, borderRadius: 10, height: 36, justifyContent: 'center', width: 36 },
  categoryIconText: { color: colors.accent, fontSize: 18, fontWeight: '900' },
  categoryText: { color: colors.text, flex: 1, fontSize: typography.small, fontWeight: '700', lineHeight: 18 },
  accountCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  accountAvatar: { alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  accountAvatarText: { color: colors.primary, fontWeight: '900' },
  accountCopy: { flex: 1, gap: 2 },
  accountLabel: { color: colors.text, fontSize: typography.small, fontWeight: '700' },
  accountEmail: { color: colors.textMuted, fontSize: typography.small },
  signOut: { color: colors.error, fontSize: typography.small, fontWeight: '800' },
  disclaimer: { color: colors.textMuted, fontSize: typography.small, textAlign: 'center' },
});
