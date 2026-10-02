import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import Screen from '../components/Screen';
import StatusBanner from '../components/StatusBanner';
import TextInput from '../components/TextInput';
import { colors, spacing, typography } from '../constants/theme';
import { useLegalCase } from '../context/LegalCaseContext';
import { analyzeProblem } from '../services/legal';
import { getErrorMessage } from '../utils/getErrorMessage';

export default function ComplaintScreen() {
  const legalCase = useLegalCase();
  const [draft, setDraft] = useState(legalCase.analysis?.complaintDraft?.content || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const controllerRef = useRef(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  if (!legalCase.analysis || !legalCase.problem) {
    return (
      <Screen contentStyle={styles.center}>
        <ErrorState title="No problem to draft" message="Analyze a problem before creating a complaint draft." onRetry={() => router.replace('/describe')} retryLabel="Describe a problem" />
      </Screen>
    );
  }

  const regenerate = async () => {
    if (loading) return;
    controllerRef.current = new AbortController();
    setLoading(true); setError(''); setFeedback('');
    try {
      const result = await analyzeProblem(legalCase.problem, { signal: controllerRef.current.signal, timeout: 40000 });
      const content = result.complaintDraft?.content;
      if (!content?.trim()) throw new Error('The server returned an empty draft. Please retry.');
      legalCase.setAnalysis(result);
      setDraft(content);
      setFeedback('Draft regenerated.');
    } catch (requestError) {
      if (requestError.code !== 'CANCELLED') setError(getErrorMessage(requestError, 'The draft could not be generated. Please retry.'));
    } finally {
      setLoading(false);
    }
  };

  const copyDraft = async () => {
    if (!draft.trim()) return setError('There is no draft to copy. Generate a draft first.');
    try {
      await Clipboard.setStringAsync(draft);
      setError(''); setFeedback('Draft copied to clipboard.');
    } catch {
      setError('The draft could not be copied. Select the text manually or use Share.');
    }
  };

  const shareDraft = async () => {
    if (!draft.trim()) return setError('There is no draft to share. Generate a draft first.');
    try {
      await Share.share({ title: 'Kayda Sathi complaint draft', message: draft });
      setError('');
    } catch {
      setError('Sharing is unavailable right now. You can copy the draft instead.');
    }
  };

  return (
    <Screen>
      <PageHeader eyebrow="Ready to personalize" title="Your complaint draft" description="Edit the wording and replace every placeholder before you send or submit this draft." />
      <StatusBanner title="Review before using" message="This draft uses the verified knowledge-base template. Check names, dates, amounts, and requested action carefully." tone="warning" />
      <Card style={styles.editorCard}>
        <View style={styles.editorHeading}><Text style={styles.editorTitle}>Editable complaint</Text><View style={styles.editBadge}><Text style={styles.editBadgeText}>EDITABLE</Text></View></View>
        <TextInput
          multiline textAlignVertical="top" value={draft}
          onChangeText={(value) => { setDraft(value); setFeedback(''); }}
          placeholder="Generate a draft to begin." editable={!loading} style={styles.editor}
        />
      </Card>
      {error ? <StatusBanner title="Draft action failed" message={error} tone="error" /> : null}
      {feedback ? <StatusBanner title="Done" message={feedback} tone="success" /> : null}
      <Button label={draft ? 'Regenerate draft' : 'Generate draft'} icon="↻" variant="secondary" onPress={regenerate} loading={loading} />
      <View style={styles.actions}>
        <Button label="Copy" icon="□" onPress={copyDraft} disabled={!draft.trim() || loading} style={styles.action} />
        <Button label="Share" icon="↗" onPress={shareDraft} disabled={!draft.trim() || loading} style={styles.action} />
      </View>
      <Text style={styles.disclaimer}>General legal information, not legal advice. Verify important details before use.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center' },
  editorCard: { padding: spacing.md },
  editorHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  editorTitle: { color: colors.text, fontSize: typography.body, fontWeight: '800' },
  editBadge: { backgroundColor: colors.accentSoft, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5 },
  editBadgeText: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  editor: { minHeight: 380, paddingTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
  disclaimer: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19, textAlign: 'center' },
});
