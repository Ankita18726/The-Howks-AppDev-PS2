import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import BrandMark from '../components/BrandMark';
import Button from '../components/Button';
import Card from '../components/Card';
import Screen from '../components/Screen';
import TextInput from '../components/TextInput';
import { colors, radii, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/getErrorMessage';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return setError('Enter both your email and password.');
    setLoading(true); setError('');
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (signInError) {
      setError(getErrorMessage(signInError, 'Sign in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.container}>
      <View style={styles.brandArea}>
        <BrandMark />
        <Text style={styles.title}>Legal help, made simple.</Text>
        <Text style={styles.subtitle}>Sign in to understand your options and securely access your previous queries.</Text>
      </View>
      <Card style={styles.formCard}>
        <View style={styles.formHeading}><Text style={styles.formTitle}>Welcome back</Text><Text style={styles.formSubtitle}>Enter your account details to continue.</Text></View>
        <TextInput label="Email address" value={email} onChangeText={(value) => { setEmail(value); if (error) setError(''); }} autoCapitalize="none" autoComplete="email" keyboardType="email-address" editable={!loading} placeholder="you@example.com" />
        <TextInput label="Password" value={password} onChangeText={(value) => { setPassword(value); if (error) setError(''); }} secureTextEntry={!showPassword} autoComplete="current-password" editable={!loading} onSubmitEditing={submit} rightLabel={showPassword ? 'Hide' : 'Show'} onRightPress={() => setShowPassword((value) => !value)} />
        {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{error}</Text></View> : null}
        <Button label="Sign in" onPress={submit} loading={loading} />
        <Button label="Create a new account" variant="secondary" onPress={() => router.push('/signup')} disabled={loading} />
      </Card>
      <Text style={styles.privacy}>Your saved queries stay linked to your signed-in Firebase account.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', paddingVertical: spacing.xl },
  brandArea: { gap: spacing.md },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '900', letterSpacing: -0.7, lineHeight: 39 },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 24 },
  formCard: { gap: spacing.lg },
  formHeading: { gap: spacing.xs },
  formTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '800' },
  formSubtitle: { color: colors.textMuted, fontSize: typography.small },
  errorBox: { backgroundColor: colors.errorSoft, borderRadius: radii.md, padding: spacing.sm },
  error: { color: colors.error, fontSize: typography.small, lineHeight: 19 },
  privacy: { color: colors.textMuted, fontSize: typography.small, textAlign: 'center' },
});
