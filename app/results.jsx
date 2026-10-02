import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import Screen from '../components/Screen';
import SectionCard from '../components/SectionCard';
import StatusBanner from '../components/StatusBanner';
import { colors, radii, spacing, typography } from '../constants/theme';
import { useLegalCase } from '../context/LegalCaseContext';

function readable(value = '') {
  return value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function safePercent(value) {
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

function ExternalLink({ url, children }) {
  if (!url) return null;
  return (
    <Pressable accessibilityRole="link" onPress={() => Linking.openURL(url)} style={({ pressed }) => pressed && styles.pressed}>
      <Text style={styles.link}>{children || url} ↗</Text>
    </Pressable>
  );
}

export default function ResultsScreen() {
  const { analysis } = useLegalCase();

  if (!analysis) {
    return (
      <Screen contentStyle={styles.center}>
        <EmptyState title="No guidance yet" message="Describe a problem first to see organized legal information and next steps." actionLabel="Describe a problem" onAction={() => router.replace('/describe')} />
      </Screen>
    );
  }

  const isMock = analysis.source?.status === 'mock';
  const sourceReferences = analysis.source?.references || [];

  return (
    <Screen contentStyle={styles.container}>
      <PageHeader eyebrow="Your guidance" title="A clearer way forward" description="Review the information below and use the next steps that fit your situation." />

      {isMock ? <StatusBanner title="Development information" message="Verified legal knowledge has not been connected for this result." tone="warning" /> : null}
      {analysis.historySaved === false ? <StatusBanner title="Guidance ready, but history was not saved" message="You can still use this result. Check your connection and Firestore rules before trying again." tone="warning" /> : null}

      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={styles.categoryBadge}><Text style={styles.categoryBadgeText}>{readable(analysis.category)}</Text></View>
          <Text style={styles.confidence}>{safePercent(analysis.confidence)}% match</Text>
        </View>
        <Text style={styles.problemType}>{readable(analysis.problemType)}</Text>
        <Text style={styles.summary}>{analysis.summary || 'Verified information is not available yet.'}</Text>
      </View>

      <SectionCard title="Your rights & relevant information" subtitle="Plain-language information for the issue identified" icon="§" items={analysis.rights} emptyMessage="No verified rights information is available for this result." />
      <SectionCard title="What you can do" subtitle="Practical actions to consider" icon="→" items={analysis.nextSteps} itemStyle="number" emptyMessage="Verified next steps are not available for this result." />
      <SectionCard title="Documents you may need" subtitle="Keep relevant records together" icon="✓" items={analysis.documents} itemStyle="check" emptyMessage="No verified document list is available for this result." />

      <SectionCard title="Where to go" subtitle="Authority or resource supplied by the knowledge base" icon="⌂">
        <View style={styles.authorityBox}>
          <Text style={styles.authorityName}>{analysis.authority?.name || 'Authority not yet verified'}</Text>
          <Text style={styles.body}>{analysis.authority?.description || 'Verified authority details are not available.'}</Text>
          {analysis.authority?.contact ? <View style={styles.detailRow}><Text style={styles.detailLabel}>Phone</Text><Text selectable style={styles.detailValue}>{analysis.authority.contact}</Text></View> : null}
          {analysis.authority?.email ? <View style={styles.detailRow}><Text style={styles.detailLabel}>Email</Text><Text selectable style={styles.detailValue}>{analysis.authority.email}</Text></View> : null}
          <ExternalLink url={analysis.authority?.url}>Open official resource</ExternalLink>
        </View>
      </SectionCard>

      <SectionCard title="Official sources" subtitle="References supplied by the curated knowledge base" icon="↗">
        <View style={styles.sources}>
          <View style={styles.verifiedRow}><View style={styles.verifiedDot} /><Text style={styles.verifiedText}>{isMock ? 'Development source' : 'Curated reference'}</Text></View>
          <Text style={isMock ? styles.mockSource : styles.sourceTitle}>{analysis.source?.label || 'No source supplied.'}</Text>
          <ExternalLink url={analysis.source?.reference}>{analysis.source?.reference}</ExternalLink>
          {analysis.source?.lastVerified ? <Text style={styles.caption}>Knowledge reviewed: {analysis.source.lastVerified}</Text> : null}
          {sourceReferences.slice(1, 4).map((reference) => (
            <ExternalLink key={`${reference.label}-${reference.url}`} url={reference.url}>{reference.label}</ExternalLink>
          ))}
        </View>
      </SectionCard>

      <Card style={styles.draftCard}>
        <View style={styles.draftHeader}><View style={styles.draftIcon}><Text style={styles.draftIconText}>✎</Text></View><View style={styles.draftCopy}><Text style={styles.draftTitle}>Your complaint draft</Text><Text style={styles.draftSubtitle}>Personalize, copy, and share the editable draft.</Text></View></View>
        {analysis.complaintDraft?.content ? <Text numberOfLines={4} style={styles.draftPreview}>{analysis.complaintDraft.content}</Text> : <Text style={styles.body}>Generate an editable complaint draft from this guidance.</Text>}
        <Button label="Open complaint draft" icon="→" onPress={() => router.push('/complaint')} />
      </Card>

      <StatusBanner title="General legal information" message={analysis.disclaimer || 'This is not legal advice. Verify important details with an official source or qualified legal professional.'} />
      <Button label="Edit problem" variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center' },
  container: { paddingTop: spacing.md },
  pressed: { opacity: 0.7 },
  summaryCard: { backgroundColor: colors.primaryDark, borderRadius: radii.xl, gap: spacing.md, padding: spacing.xl },
  summaryTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  categoryBadge: { backgroundColor: 'rgba(255,255,255,0.13)', borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 7 },
  categoryBadgeText: { color: '#DDE6FA', fontSize: typography.small, fontWeight: '800' },
  confidence: { color: '#B8C8EC', fontSize: typography.small, fontWeight: '700' },
  problemType: { color: colors.white, fontSize: 26, fontWeight: '900', lineHeight: 32 },
  summary: { color: '#D8E0F2', fontSize: typography.body, lineHeight: 25 },
  authorityBox: { gap: spacing.md },
  authorityName: { color: colors.text, fontSize: 19, fontWeight: '800' },
  body: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
  detailRow: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.xs, paddingTop: spacing.sm },
  detailLabel: { color: colors.textMuted, fontSize: typography.small, fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { color: colors.text, fontSize: typography.body, lineHeight: 22 },
  link: { color: colors.primary, fontSize: typography.body, fontWeight: '800', lineHeight: 23 },
  sources: { gap: spacing.sm },
  verifiedRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  verifiedDot: { backgroundColor: colors.success, borderRadius: 5, height: 10, width: 10 },
  verifiedText: { color: colors.success, fontSize: typography.small, fontWeight: '800' },
  sourceTitle: { color: colors.text, fontSize: typography.body, fontWeight: '800' },
  mockSource: { color: colors.error, fontSize: typography.body, fontWeight: '800' },
  caption: { color: colors.textMuted, fontSize: typography.small },
  draftCard: { backgroundColor: colors.accentSoft, borderColor: '#BCE3D6' },
  draftHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  draftIcon: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  draftIconText: { color: colors.white, fontSize: 20, fontWeight: '900' },
  draftCopy: { flex: 1, gap: 2 },
  draftTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '800' },
  draftSubtitle: { color: colors.textMuted, fontSize: typography.small },
  draftPreview: { color: colors.textMuted, fontSize: typography.small, lineHeight: 20 },
});
