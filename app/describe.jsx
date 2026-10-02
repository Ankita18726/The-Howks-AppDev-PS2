import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import Button from '../components/Button';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import Screen from '../components/Screen';
import StatusBanner from '../components/StatusBanner';
import TextInput from '../components/TextInput';
import { colors, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLegalCase } from '../context/LegalCaseContext';
import { saveQueryHistory } from '../services/history';
import { analyzeProblem } from '../services/legal';
import { SPEECH_ERROR_CODES, useSpeechService } from '../services/speechService';
import { getErrorMessage } from '../utils/getErrorMessage';

const { executeAnalysisSubmission } = require('../utils/analysisSubmission');

export default function DescribeScreen() {
  const { user } = useAuth();
  const legalCase = useLegalCase();
  const [text, setText] = useState(legalCase.problem);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [speechState, setSpeechState] = useState('idle');
  const [speechMessage, setSpeechMessage] = useState('');
  const controllerRef = useRef(null);
  const requestInFlight = useRef(false);
  const textBeforeSpeechRef = useRef('');
  const { startListening, stopListening, cancelListening } = useSpeechService();

  useEffect(() => () => {
    controllerRef.current?.abort();
    void cancelListening();
  }, [cancelListening]);

  const voiceBusy = ['starting', 'listening', 'processing'].includes(speechState);

  const startVoice = async () => {
    if (voiceBusy || loading) return;
    textBeforeSpeechRef.current = text.trim();
    setSpeechMessage('');
    setSpeechState('starting');

    try {
      await startListening();
      setSpeechState('listening');
    } catch (speechError) {
      if (speechError.code === SPEECH_ERROR_CODES.CANCELLED) {
        setSpeechState('idle');
        setSpeechMessage('Voice input cancelled. Your existing text was kept.');
      } else {
        setSpeechState('error');
        setSpeechMessage(getErrorMessage(speechError, "Couldn't understand the recording. Please try again or type your problem."));
      }
    }
  };

  const stopVoice = async () => {
    if (speechState !== 'listening') return;
    setSpeechState('processing');
    setSpeechMessage('');
    try {
      const { text: transcript } = await stopListening();
      const existingText = textBeforeSpeechRef.current;
      setText(existingText ? `${existingText} ${transcript}` : transcript);
      setSpeechState('success');
      setSpeechMessage(existingText ? 'Voice transcription was added after your existing text.' : 'Voice transcription added. You can edit it before analyzing.');
    } catch (speechError) {
      if (speechError.code === SPEECH_ERROR_CODES.CANCELLED) {
        setSpeechState('idle');
        setSpeechMessage('Voice input cancelled. Your existing text was kept.');
      } else {
        setSpeechState('error');
        setSpeechMessage(getErrorMessage(speechError, 'Speech could not be transcribed. Please try again or type your problem.'));
      }
    }
  };

  const cancelVoice = async () => {
    await cancelListening();
    setSpeechState('idle');
    setSpeechMessage('Voice input cancelled. Your existing text was kept.');
  };

  const submit = async () => {
    const problem = text.trim();
    if (!problem) return setError('Please describe the problem before continuing.');
    if (problem.length < 10) return setError('Please add a little more detail (at least 10 characters).');
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    controllerRef.current = new AbortController();
    setError('');
    setLoading(true);
    try {
      await executeAnalysisSubmission({
        analyze: () => analyzeProblem(problem, { signal: controllerRef.current.signal, timeout: 40000 }),
        problem,
        setProblem: legalCase.setProblem,
        setAnalysis: legalCase.setAnalysis,
        saveHistory: (result) => saveQueryHistory(user, problem, result),
        navigate: () => router.push('/results'),
        onNavigationError: () => setError('Your guidance is ready, but the results screen could not be opened. Please try again.'),
      });
    } catch (requestError) {
      if (requestError.code !== 'CANCELLED') setError(getErrorMessage(requestError, 'The analysis could not be completed. Please try again.'));
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <PageHeader eyebrow="Tell us what happened" title="Describe your problem" description="Use everyday language. Helpful details include approximate dates, amounts, and what response you have already received." />
      <Card style={styles.inputCard}>
        <TextInput
          label="Problem description" accessibilityLabel="Problem description" multiline numberOfLines={8}
          maxLength={4000} textAlignVertical="top"
          placeholder="Example: My landlord has not returned my security deposit."
          value={text} onChangeText={(value) => { setText(value); if (error) setError(''); }}
          error={error} helperText={`${text.length}/4000 characters`} editable={!loading && !voiceBusy} style={styles.input}
        />
        <View style={styles.tip}><Text style={styles.tipIcon}>i</Text><Text style={styles.tipText}>Do not share passwords, PINs, OTPs, or full bank details.</Text></View>
      </Card>
      {speechState === 'listening' ? (
        <>
          <Button
            label="Stop listening"
            icon="■"
            onPress={stopVoice}
            accessibilityLabel="Stop voice input"
            accessibilityHint="Stops listening and converts your speech to text"
          />
          <Button label="Cancel voice input" variant="ghost" onPress={cancelVoice} />
        </>
      ) : speechState === 'processing' ? (
        <>
          <Button label="Converting speech…" disabled loading accessibilityLabel="Converting speech to text" />
          <Button label="Cancel transcription" variant="ghost" onPress={cancelVoice} />
        </>
      ) : (
        <Button
          label={speechState === 'starting' ? 'Starting microphone…' : 'Describe by voice'}
          icon="●"
          variant="secondary"
          onPress={startVoice}
          disabled={loading || speechState === 'starting'}
          loading={speechState === 'starting'}
          accessibilityLabel="Describe problem by voice"
          accessibilityHint="Starts speech recognition on supported devices"
        />
      )}
      {speechState === 'listening' ? <StatusBanner title="Listening…" message="Speak clearly, then tap Stop listening." tone="error" icon="●" /> : null}
      {speechState === 'processing' ? <StatusBanner title="Converting your speech…" message="Your transcription will appear in the editable box above." /> : null}
      {speechMessage ? <StatusBanner title={speechState === 'error' ? 'Voice input needs attention' : 'Voice input ready'} message={speechMessage} tone={speechState === 'error' ? 'error' : 'success'} /> : null}
      {loading ? (
        <Card style={styles.analysisCard} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.analysisTitle}>Understanding your problem…</Text>
          <Text style={styles.analysisText}>Identifying the issue • Finding relevant information • Preparing your next steps</Text>
        </Card>
      ) : null}
      <Button label="Analyze problem" icon="→" onPress={submit} loading={loading} disabled={!text.trim() || voiceBusy} />
      <Text style={styles.voiceNote}>Voice recordings are sent temporarily for transcription and are not stored by Kayda Sathi.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.md },
  inputCard: { padding: spacing.md },
  input: { minHeight: 190, paddingTop: spacing.md },
  tip: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  tipIcon: { backgroundColor: colors.primarySoft, borderRadius: 10, color: colors.primary, fontSize: typography.small, fontWeight: '900', height: 20, lineHeight: 20, textAlign: 'center', width: 20 },
  tipText: { color: colors.textMuted, flex: 1, fontSize: typography.small, lineHeight: 19 },
  analysisCard: { alignItems: 'center', backgroundColor: colors.primarySoft, borderColor: '#C9D5F2' },
  analysisTitle: { color: colors.text, fontSize: typography.heading, fontWeight: '800', textAlign: 'center' },
  analysisText: { color: colors.textMuted, fontSize: typography.small, lineHeight: 20, textAlign: 'center' },
  voiceNote: { color: colors.textMuted, fontSize: typography.small, lineHeight: 19, textAlign: 'center' },
});
