import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Screen from '../components/Screen';
import SectionCard from '../components/SectionCard';
import { colors, spacing, typography } from '../constants/theme';
import { useLegalCase } from '../context/LegalCaseContext';

function readable(value = '') {
  return value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export default function ResultsScreen() {
  const { analysis } = useLegalCase();

  if (!analysis) {
    return (
      <Screen contentStyle={styles.center}>
        <EmptyState title="No analysis yet" message="Describe a problem first to see organized guidance." actionLabel="Describe a problem" onAction={() => router.replace('/describe')} />
      </Screen>
    );
  }

  const isMock = analysis.source?.status === 'mock';
  return (
    <Screen>
      {isMock ? (
        <View accessibilityRole="alert" style={styles.mockBanner}>
          <Text style={styles.mockTitle}>Development mock</Text>
          <Text style={styles.mockText}>This is not real legal guidance. Verified knowledge has not been connected.</Text>
        </View>
      ) : null}

      <SectionCard title="Problem identified">
        <Text style={styles.value}>{readable(analysis.category)}</Text>
        <Text style={styles.body}>Type: {readable(analysis.problemType)}</Text>
        <Text style={styles.caption}>Classification confidence: {Math.round(analysis.confidence * 100)}%</Text>
      </SectionCard>

      <SectionCard title="Relevant information">
        <Text style={styles.body}>{analysis.summary || 'Verified information is not available yet.'}</Text>
      </SectionCard>
      <SectionCard title="Possible rights / information" items={analysis.rights} emptyMessage="No verified rights information is available in development mock mode." />
      <SectionCard title="What you can do" items={analysis.nextSteps} emptyMessage="Verified next steps will appear when the legal knowledge base is connected." />
      <SectionCard title="Documents you may need" items={analysis.documents} emptyMessage="No verified document list is available yet." />
      <SectionCard title="Where to get help">
        <Text style={styles.value}>{analysis.authority?.name || 'Authority not yet verified'}</Text>
        <Text style={styles.body}>{analysis.authority?.description || 'Verified authority details are not available.'}</Text>
        {analysis.authority?.contact ? <Text style={styles.body}>Contact: {analysis.authority.contact}</Text> : null}
        {analysis.authority?.email ? <Text style={styles.body}>Email: {analysis.authority.email}</Text> : null}
        {analysis.authority?.url ? <Text style={styles.link}>{analysis.authority.url}</Text> : null}
      </SectionCard>
      <SectionCard title="Source / reference">
        <Text style={isMock ? styles.mockSource : styles.body}>{analysis.source?.label || 'No source supplied.'}</Text>
        {analysis.source?.reference ? <Text style={styles.caption}>{analysis.source.reference}</Text> : null}
        {analysis.source?.lastVerified ? <Text style={styles.caption}>Knowledge reviewed: {analysis.source.lastVerified}</Text> : null}
        {analysis.source?.references?.slice(1).map((reference) => (
          <Text key={`${reference.label}-${reference.url}`} style={styles.caption}>
            {reference.label}{reference.url ? `: ${reference.url}` : ''}
          </Text>
        ))}
        {analysis.disclaimer ? <Text style={styles.disclaimer}>{analysis.disclaimer}</Text> : null}
      </SectionCard>

      <Button label="Create complaint draft" onPress={() => router.push('/complaint')} />
      <Button label="Edit problem" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center' },
  mockBanner: { backgroundColor: '#FFF4E5', borderColor: '#F5B455', borderRadius: 12, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  mockTitle: { color: '#8A4B08', fontSize: typography.body, fontWeight: '800' },
  mockText: { color: '#6B3D0B', fontSize: typography.small, lineHeight: 19 },
  value: { color: colors.text, fontSize: typography.body, fontWeight: '700' },
  body: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
  caption: { color: colors.textMuted, fontSize: typography.small },
  link: { color: colors.primary, fontSize: typography.body },
  mockSource: { color: colors.error, fontSize: typography.body, fontWeight: '700' },
  disclaimer: { color: colors.textMuted, fontSize: typography.small, fontStyle: 'italic', lineHeight: 19 },
});
