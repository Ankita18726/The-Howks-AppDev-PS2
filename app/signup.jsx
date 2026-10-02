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

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    if (!email.trim()) return setError('Enter your email address.');
    if (password.length < 6) return setError('Use a password with at least 6 characters.');
    if (password !== confirmation) return setError('The passwords do not match.');
    setLoading(true); setError('');
    try {
      await signUp(email, password);
      router.replace('/');
    } catch (signUpError) {
      setError(getErrorMessage(signUpError, 'Account creation failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <BrandMark compact />
      <View style={styles.heading}><Text style={styles.title}>Create your account</Text><Text style={styles.subtitle}>Save your guidance securely and return to it whenever you need.</Text></View>
      <Card style={styles.formCard}>
        <TextInput label="Email address" value={email} onChangeText={(value) => { setEmail(value); if (error) setError(''); }} autoCapitalize="none" autoComplete="email" keyboardType="email-address" editable={!loading} placeholder="you@example.com" />
        <TextInput label="Password" value={password} onChangeText={(value) => { setPassword(value); if (error) setError(''); }} secureTextEntry={!showPassword} autoComplete="new-password" editable={!loading} helperText="Use at least 6 characters" rightLabel={showPassword ? 'Hide' : 'Show'} onRightPress={() => setShowPassword((value) => !value)} />
        <TextInput label="Confirm password" value={confirmation} onChangeText={(value) => { setConfirmation(value); if (error) setError(''); }} secureTextEntry={!showPassword} autoComplete="new-password" editable={!loading} onSubmitEditing={submit} />
        {error ? <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{error}</Text></View> : null}
        <Button label="Create account" onPress={submit} loading={loading} />
      </Card>
      <Button label="I already have an account" variant="ghost" onPress={() => router.replace('/signin')} disabled={loading} />
      <Text style={styles.privacy}>By continuing, you acknowledge that Kayda Sathi provides general legal information, not legal advice.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.xl },
  heading: { gap: spacing.sm },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 24 },
  formCard: { gap: spacing.lg },
  errorBox: { backgroundColor: colors.errorSoft, borderRadius: radii.md, padding: spacing.sm },
  error: { color: colors.error, fontSize: typography.small, lineHeight: 19 },
  privacy: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19, textAlign: 'center' },
});
