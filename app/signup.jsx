import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import Button from '../components/Button';
import Screen from '../components/Screen';
import TextInput from '../components/TextInput';
import { colors, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/getErrorMessage';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Your query history will be kept under this Firebase account.</Text>
      <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" editable={!loading} />
      <TextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" editable={!loading} helperText="At least 6 characters" />
      <TextInput label="Confirm password" value={confirmation} onChangeText={setConfirmation} secureTextEntry autoComplete="new-password" editable={!loading} onSubmitEditing={submit} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Button label="Create account" onPress={submit} loading={loading} />
      <Button label="I already have an account" variant="secondary" onPress={() => router.replace('/signin')} disabled={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 42 },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 24 },
  error: { color: colors.error, fontSize: typography.small, lineHeight: 19 },
});
