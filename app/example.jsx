import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import Card from '../components/Card';
import { colors, spacing, typography } from '../constants/theme';

export default function ExampleScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <Card>
          <Text style={styles.title}>Navigation works.</Text>
          <Text style={styles.description}>
            Replace this route with the first real feature after the problem statement is revealed.
          </Text>
          <Button label="Back to home" variant="secondary" onPress={() => router.back()} />
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 23,
  },
});
