import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LegalCaseProvider } from '../context/LegalCaseContext';
import { colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <LegalCaseProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="describe" options={{ title: 'Describe your problem' }} />
        <Stack.Screen name="results" options={{ title: 'Your guidance' }} />
        <Stack.Screen name="complaint" options={{ title: 'Complaint draft' }} />
      </Stack>
    </LegalCaseProvider>
  );
}
