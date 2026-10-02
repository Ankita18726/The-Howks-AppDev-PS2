import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import Button from '../components/Button';
import Screen from '../components/Screen';
import TextInput from '../components/TextInput';
import { colors, spacing, typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLegalCase } from '../context/LegalCaseContext';
import { saveQueryHistory } from '../services/history';
import { analyzeProblem } from '../services/legal';
import { SPEECH_ERROR_CODES, useSpeechService } from '../services/speechService';
import { getErrorMessage } from '../utils/getErrorMessage';

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
      const result = await analyzeProblem(problem, { signal: controllerRef.current.signal, timeout: 40000 });
      let historySaved = true;
      try {
        await saveQueryHistory(user, problem, result);
      } catch {
        historySaved = false;
      }
      legalCase.setProblem(problem);
      legalCase.setAnalysis({ ...result, historySaved });
      router.push('/results');
    } catch (requestError) {
      if (requestError.code !== 'CANCELLED') setError(getErrorMessage(requestError, 'The analysis could not be completed. Please try again.'));
    } finally {
      requestInFlight.current = false;
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.container}>
      <Text style={styles.title}>What happened?</Text>
      <Text style={styles.description}>
        Use your own words. Include useful facts such as what happened, approximate dates, and amounts. Avoid sharing passwords or one-time codes.
      </Text>
      <TextInput
        label="Problem description" accessibilityLabel="Problem description" multiline numberOfLines={8}
        maxLength={4000} textAlignVertical="top"
        placeholder="Example: My landlord has not returned my security deposit..."
        value={text} onChangeText={(value) => { setText(value); if (error) setError(''); }}
        error={error} helperText={`${text.length}/4000 characters`} editable={!loading && !voiceBusy} style={styles.input}
      />
      {speechState === 'listening' ? (
        <>
          <Button
            label="■ Stop listening"
            onPress={stopVoice}
            accessibilityLabel="Stop voice input"
            accessibilityHint="Stops listening and converts your speech to text"
          />
          <Button label="Cancel voice input" variant="secondary" onPress={cancelVoice} />
        </>
      ) : speechState === 'processing' ? (
        <>
          <Button label="Converting speech…" disabled loading accessibilityLabel="Converting speech to text" />
          <Button label="Cancel transcription" variant="secondary" onPress={cancelVoice} />
        </>
      ) : (
        <Button
          label={speechState === 'starting' ? 'Starting microphone…' : '🎙 Describe by voice'}
          variant="secondary"
          onPress={startVoice}
          disabled={loading || speechState === 'starting'}
          loading={speechState === 'starting'}
          accessibilityLabel="Describe problem by voice"
          accessibilityHint="Starts speech recognition on supported devices"
        />
      )}
      {speechState === 'listening' ? <Text accessibilityLiveRegion="polite" style={styles.listening}>🔴 Listening… Speak clearly, then tap Stop.</Text> : null}
      {speechState === 'processing' ? <Text accessibilityLiveRegion="polite" style={styles.listening}>Converting speech…</Text> : null}
      {speechMessage ? <Text accessibilityRole={speechState === 'error' ? 'alert' : undefined} style={speechState === 'error' ? styles.speechError : styles.speechStatus}>{speechMessage}</Text> : null}
      <Button label="Analyze problem" onPress={submit} loading={loading} disabled={!text.trim() || voiceBusy} />
      <Text style={styles.voiceNote}>Voice is recorded temporarily, sent to the configured transcription provider, then deleted. It is never sent to the legal analysis endpoint.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: spacing.xl },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '800' },
  description: { color: colors.textMuted, fontSize: typography.body, lineHeight: 24 },
  input: { minHeight: 180, paddingTop: spacing.md },
  voiceNote: { color: colors.textMuted, fontSize: typography.small, textAlign: 'center' },
  listening: { color: colors.primary, fontSize: typography.body, fontWeight: '700', textAlign: 'center' },
  speechStatus: { color: '#26734D', fontSize: typography.small, lineHeight: 19 },
  speechError: { color: colors.error, fontSize: typography.small, lineHeight: 19 },
});
