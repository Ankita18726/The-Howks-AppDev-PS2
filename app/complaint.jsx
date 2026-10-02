import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import ErrorState from '../components/ErrorState';
import Screen from '../components/Screen';
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
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Review before using</Text>
        <Text style={styles.noticeText}>This editable draft uses the verified knowledge-base template. Complete every placeholder and verify all personal details.</Text>
      </View>
      <TextInput
        label="Editable complaint" multiline textAlignVertical="top" value={draft}
        onChangeText={(value) => { setDraft(value); setFeedback(''); }}
        placeholder="Generate a draft to begin." editable={!loading} style={styles.editor}
      />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {feedback ? <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback}</Text> : null}
      <Button label={draft ? 'Regenerate draft' : 'Generate draft'} onPress={regenerate} loading={loading} />
      <View style={styles.actions}>
        <Button label="Copy" variant="secondary" onPress={copyDraft} disabled={!draft.trim() || loading} style={styles.action} />
        <Button label="Share" variant="secondary" onPress={shareDraft} disabled={!draft.trim() || loading} style={styles.action} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center' },
  notice: { backgroundColor: '#FFF4E5', borderRadius: 12, gap: spacing.xs, padding: spacing.md },
  noticeTitle: { color: '#8A4B08', fontSize: typography.body, fontWeight: '800' },
  noticeText: { color: '#6B3D0B', fontSize: typography.small, lineHeight: 19 },
  editor: { minHeight: 360, paddingTop: spacing.md },
  error: { color: colors.error, fontSize: typography.small, lineHeight: 19 },
  feedback: { color: '#26734D', fontSize: typography.small, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing.md },
  action: { flex: 1 },
});
