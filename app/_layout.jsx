import { router, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import { colors, spacing, typography } from '../constants/theme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LegalCaseProvider } from '../context/LegalCaseContext';

function AppNavigator() {
  const { user, loading, configurationError, retryInitialization } = useAuth();
  const segments = useSegments();
  const currentRoute = segments[0];
  const onAuthRoute = currentRoute === 'signin' || currentRoute === 'signup';
  const needsRedirect = !loading && !configurationError && ((!user && !onAuthRoute) || (user && onAuthRoute));

  useEffect(() => {
    if (loading || configurationError) return;
    if (!user && !onAuthRoute) router.replace('/signin');
    if (user && onAuthRoute) router.replace('/');
  }, [configurationError, loading, onAuthRoute, user]);

  if (loading || needsRedirect) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.status}>Loading your account…</Text>
      </View>
    );
  }

  if (configurationError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Firebase setup needed</Text>
        <Text style={styles.errorText}>{configurationError}</Text>
        <Button label="Retry" onPress={retryInitialization} style={styles.retry} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{
      headerShadowVisible: false,
      headerStyle: { backgroundColor: colors.background },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '700' },
      contentStyle: { backgroundColor: colors.background },
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="signin" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ title: 'Create account' }} />
      <Stack.Screen name="history" options={{ title: 'Previous queries' }} />
      <Stack.Screen name="describe" options={{ title: 'Describe your problem' }} />
      <Stack.Screen name="results" options={{ title: 'Your guidance' }} />
      <Stack.Screen name="complaint" options={{ title: 'Complaint draft' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LegalCaseProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </LegalCaseProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', backgroundColor: colors.background, flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.xl },
  status: { color: colors.textMuted, fontSize: typography.body },
  errorTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '800' },
  errorText: { color: colors.error, fontSize: typography.body, lineHeight: 24, textAlign: 'center' },
  retry: { alignSelf: 'stretch' },
});
