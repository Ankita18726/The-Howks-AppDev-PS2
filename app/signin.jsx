import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import Button from '../components/Button';
import Screen from '../components/Screen';
import TextInput from '../components/TextInput';
import { colors, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/getErrorMessage';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      <Text style={styles.brand}>कायदा साथी</Text>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to get guidance and access your previous queries.</Text>
      <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" editable={!loading} />
      <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" editable={!loading} onSubmitEditing={submit} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Button label="Sign in" onPress={submit} loading={loading} />
      <Button label="Create a new account" variant="secondary" onPress={() => router.push('/signup')} disabled={loading} />
      <Text style={styles.privacy}>Your saved queries are visible only to your signed-in Firebase account.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center' },
  brand: { alignSelf: 'flex-start', backgroundColor: colors.primarySoft, borderRadius: 99, color: colors.primary, fontWeight: '800', paddingHorizontal: 14, paddingVertical: 8 },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 24 },
  error: { color: colors.error, fontSize: typography.small, lineHeight: 19 },
  privacy: { color: colors.textMuted, fontSize: typography.small, textAlign: 'center' },
});
