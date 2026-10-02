import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingIndicator from '../components/LoadingIndicator';
import PageHeader from '../components/PageHeader';
import Screen from '../components/Screen';
import { colors, radii, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLegalCase } from '../context/LegalCaseContext';
import { getQueryHistory } from '../services/history';
import { getErrorMessage } from '../utils/getErrorMessage';

function readable(value = '') {
  return value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export default function HistoryScreen() {
  const { user } = useAuth();
  const legalCase = useLegalCase();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError('');
    getQueryHistory(user)
      .then((history) => { if (active) setItems(history); })
      .catch((historyError) => { if (active) setError(getErrorMessage(historyError, 'Previous queries could not be loaded.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload, user]));

  const openItem = (item) => {
    legalCase.setProblem(item.problem);
    legalCase.setAnalysis(item.analysis);
    router.push('/results');
  };

  if (loading) return <Screen contentStyle={styles.center}><LoadingIndicator message="Loading previous queries…" detail="Retrieving guidance saved to your account." /></Screen>;
  if (error) return <Screen contentStyle={styles.center}><ErrorState title="History unavailable" message={error} onRetry={() => setReload((value) => value + 1)} /></Screen>;
  if (!items.length) {
    return (
      <Screen contentStyle={styles.center}>
        <EmptyState title="No previous queries" message="Problems you analyze will appear here." actionLabel="Describe a problem" onAction={() => router.push('/describe')} />
      </Screen>
    );
  }

  return (
    <Screen scrollProps={{ refreshControl: <RefreshControl refreshing={false} onRefresh={() => setReload((value) => value + 1)} tintColor={colors.primary} /> }}>
      <PageHeader eyebrow="Your saved guidance" title="Previous queries" description="Open any saved problem to review the same guidance and complaint draft." />
      {items.map((item) => (
        <Pressable key={item.id} accessibilityRole="button" onPress={() => openItem(item)} style={({ pressed }) => pressed && styles.pressed}>
          <Card style={styles.queryCard}>
            <View style={styles.cardTop}>
              <View style={styles.categoryBadge}><Text style={styles.category}>{readable(item.analysis?.category || 'Saved query')}</Text></View>
              <Text style={styles.chevron}>›</Text>
            </View>
            <Text numberOfLines={3} style={styles.problem}>{item.problem}</Text>
            <Text style={styles.date}>{item.createdAt ? item.createdAt.toLocaleString() : 'Recently saved'}</Text>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  queryCard: { gap: spacing.sm },
  cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  categoryBadge: { backgroundColor: colors.primarySoft, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  category: { color: colors.primary, fontSize: typography.small, fontWeight: '800' },
  chevron: { color: colors.primary, fontSize: 30, lineHeight: 30 },
  problem: { color: colors.text, fontSize: typography.body, fontWeight: '700', lineHeight: 24 },
  date: { color: colors.textMuted, fontSize: typography.small },
});
