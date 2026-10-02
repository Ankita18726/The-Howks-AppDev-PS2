import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';

import { getApiUrl } from './api';

const TRANSCRIPTION_TIMEOUT_MS = 30000;

export const SPEECH_ERROR_CODES = {
  BACKEND_UNAVAILABLE: 'BACKEND_UNAVAILABLE',
  CANCELLED: 'CANCELLED',
  EMPTY_TRANSCRIPTION: 'EMPTY_TRANSCRIPTION',
  MALFORMED_RESPONSE: 'MALFORMED_RESPONSE',
  NETWORK: 'NETWORK',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RECORDING_FAILED: 'RECORDING_FAILED',
  SESSION_ACTIVE: 'SESSION_ACTIVE',
  TIMEOUT: 'TIMEOUT',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  UNKNOWN: 'UNKNOWN',
};

export class SpeechServiceError extends Error {
  constructor(message, code = SPEECH_ERROR_CODES.UNKNOWN, status = null) {
    super(message);
    this.name = 'SpeechServiceError';
    this.code = code;
    this.status = status;
  }
}

function deleteRecording(uri) {
  if (!uri) return;
  if (Platform.OS === 'web') {
    try {
      URL.revokeObjectURL(uri);
    } catch {
      // Browser cleanup remains best-effort.
    }
    return;
  }
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Cleanup is best-effort; never hide the transcription result with a cleanup error.
  }
}

async function getRecordingPayload(uri) {
  if (Platform.OS === 'web') {
    const response = await expoFetch(uri);
    const blob = await response.blob();
    return { body: blob, contentType: blob.type || 'audio/webm', size: blob.size };
  }

  const file = new File(uri);
  return { body: file, contentType: 'audio/mp4', size: file.size || 0 };
}

async function leaveRecordingMode() {
  try {
    await setAudioModeAsync({ allowsRecording: false });
  } catch {
    // The operating system will release the session; this should not crash the UI.
  }
}

function responseMessage(data, fallback) {
  if (data && typeof data.message === 'string' && data.message.trim()) return data.message.trim();
  return fallback;
}

/**
 * Real Expo Go-compatible microphone + transcription service.
 * Audio is recorded to Expo's cache, uploaded once to the backend, then deleted.
 */
export function useSpeechService() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const phaseRef = useRef('idle');
  const requestControllerRef = useRef(null);
  const recordingUriRef = useRef(null);
  const cancelledRef = useRef(false);

  const startListening = useCallback(async () => {
    if (phaseRef.current !== 'idle') {
      throw new SpeechServiceError('A voice-input session is already active.', SPEECH_ERROR_CODES.SESSION_ACTIVE);
    }

    phaseRef.current = 'starting';
    cancelledRef.current = false;
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        throw new SpeechServiceError(
          'Microphone permission was denied. Allow microphone access in Android settings or type your problem.',
          SPEECH_ERROR_CODES.PERMISSION_DENIED,
        );
      }
      if (cancelledRef.current) {
        throw new SpeechServiceError('Voice input was cancelled.', SPEECH_ERROR_CODES.CANCELLED);
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (cancelledRef.current) {
        throw new SpeechServiceError('Voice input was cancelled.', SPEECH_ERROR_CODES.CANCELLED);
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      phaseRef.current = 'recording';
      return { state: 'listening' };
    } catch (error) {
      phaseRef.current = 'idle';
      await leaveRecordingMode();
      if (error instanceof SpeechServiceError) throw error;
      throw new SpeechServiceError(
        'The microphone could not start recording. Please try again or type your problem.',
        SPEECH_ERROR_CODES.RECORDING_FAILED,
      );
    }
  }, [recorder]);

  const stopListening = useCallback(async () => {
    if (phaseRef.current !== 'recording') {
      throw new SpeechServiceError('Voice recording is not active.', SPEECH_ERROR_CODES.RECORDING_FAILED);
    }

    phaseRef.current = 'processing';
    let timeoutId;
    let timedOut = false;
    try {
      await recorder.stop();
      const uri = recorder.uri;
      recordingUriRef.current = uri;
      if (!uri) {
        throw new SpeechServiceError(
          'No recording was created. Please try again.',
          SPEECH_ERROR_CODES.RECORDING_FAILED,
        );
      }

      const payload = await getRecordingPayload(uri);
      if (!payload.size) {
        throw new SpeechServiceError(
          "Couldn't hear any speech. Please try again.",
          SPEECH_ERROR_CODES.EMPTY_TRANSCRIPTION,
        );
      }

      const controller = new AbortController();
      requestControllerRef.current = controller;
      timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, TRANSCRIPTION_TIMEOUT_MS);

      const response = await expoFetch(getApiUrl('/api/speech/transcribe'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': payload.contentType,
        },
        body: payload.body,
        signal: controller.signal,
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new SpeechServiceError(
          'The transcription server returned an unreadable response.',
          SPEECH_ERROR_CODES.MALFORMED_RESPONSE,
          response.status,
        );
      }

      if (!response.ok) {
        const code = response.status === 503
          ? SPEECH_ERROR_CODES.BACKEND_UNAVAILABLE
          : SPEECH_ERROR_CODES.TRANSCRIPTION_FAILED;
        throw new SpeechServiceError(
          responseMessage(data, 'Speech transcription failed. Please try again.'),
          code,
          response.status,
        );
      }

      if (!data || typeof data.text !== 'string') {
        throw new SpeechServiceError(
          'The transcription server returned an invalid response.',
          SPEECH_ERROR_CODES.MALFORMED_RESPONSE,
          response.status,
        );
      }

      const text = data.text.trim();
      if (!text) {
        throw new SpeechServiceError(
          "Couldn't hear any speech. Please try again.",
          SPEECH_ERROR_CODES.EMPTY_TRANSCRIPTION,
        );
      }
      return { text };
    } catch (error) {
      if (error instanceof SpeechServiceError) throw error;
      if (error?.name === 'AbortError') {
        if (cancelledRef.current) {
          throw new SpeechServiceError('Voice input was cancelled.', SPEECH_ERROR_CODES.CANCELLED);
        }
        if (timedOut) {
          throw new SpeechServiceError(
            'Transcription timed out. Check your connection and try again.',
            SPEECH_ERROR_CODES.TIMEOUT,
          );
        }
      }
      throw new SpeechServiceError(
        'Could not reach the transcription server. Check your connection and try again.',
        SPEECH_ERROR_CODES.NETWORK,
      );
    } finally {
      clearTimeout(timeoutId);
      requestControllerRef.current = null;
      deleteRecording(recordingUriRef.current);
      recordingUriRef.current = null;
      phaseRef.current = 'idle';
      await leaveRecordingMode();
    }
  }, [recorder]);

  const cancelListening = useCallback(async () => {
    if (phaseRef.current === 'idle') return false;
    cancelledRef.current = true;
    requestControllerRef.current?.abort();

    if (phaseRef.current === 'starting') {
      phaseRef.current = 'idle';
      await leaveRecordingMode();
      return true;
    }

    if (phaseRef.current === 'recording') {
      try {
        await recorder.stop();
        deleteRecording(recorder.uri);
      } catch {
        // The recorder may already have been released by the OS.
      }
      phaseRef.current = 'idle';
      await leaveRecordingMode();
    }
    return true;
  }, [recorder]);

  return { startListening, stopListening, cancelListening };
}
