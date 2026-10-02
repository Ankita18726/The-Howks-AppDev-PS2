const DEFAULT_TIMEOUT_MS = 25000;

class TranscriptionError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'TranscriptionError';
    this.code = code;
    this.status = status;
  }
}

function getProviderConfig() {
  const provider = (process.env.SPEECH_PROVIDER || 'groq').trim().toLowerCase();

  if (provider === 'openai') {
    return {
      apiKey: process.env.OPENAI_API_KEY,
      endpoint: 'https://api.openai.com/v1/audio/transcriptions',
      model: process.env.SPEECH_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe',
      provider,
    };
  }

  if (provider === 'groq') {
    return {
      apiKey: process.env.GROQ_API_KEY,
      endpoint: 'https://api.groq.com/openai/v1/audio/transcriptions',
      model: process.env.SPEECH_TRANSCRIPTION_MODEL || 'whisper-large-v3-turbo',
      provider,
    };
  }

  return {
    apiKey: process.env.SPEECH_TRANSCRIPTION_API_KEY,
    endpoint: process.env.SPEECH_TRANSCRIPTION_API_URL,
    model: process.env.SPEECH_TRANSCRIPTION_MODEL,
    provider,
  };
}

async function transcribe({ audio, mimeType, filename, fetchImpl = fetch }) {
  const config = getProviderConfig();
  if (!config.apiKey || !config.endpoint || !config.model) {
    throw new TranscriptionError(
      'Voice transcription is not configured on the server. Add the server-side speech provider key and restart the backend.',
      'SPEECH_NOT_CONFIGURED',
      503,
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const form = new FormData();
    form.append('file', new Blob([audio], { type: mimeType }), filename);
    form.append('model', config.model);
    form.append('response_format', 'json');

    const response = await fetchImpl(config.endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}` },
      body: form,
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`Speech provider ${config.provider} returned HTTP ${response.status}.`);
      throw new TranscriptionError(
        'The speech provider could not transcribe this recording. Please try again.',
        'PROVIDER_ERROR',
        502,
      );
    }

    let result;
    try {
      result = await response.json();
    } catch {
      throw new TranscriptionError(
        'The speech provider returned an invalid response.',
        'MALFORMED_PROVIDER_RESPONSE',
        502,
      );
    }

    if (!result || typeof result.text !== 'string') {
      throw new TranscriptionError(
        'The speech provider returned an invalid transcription.',
        'MALFORMED_PROVIDER_RESPONSE',
        502,
      );
    }

    const text = result.text.trim();
    if (!text) {
      throw new TranscriptionError(
        "Couldn't hear any speech in the recording. Please try again.",
        'EMPTY_TRANSCRIPTION',
        422,
      );
    }
    return { text, provider: config.provider };
  } catch (error) {
    if (error instanceof TranscriptionError) throw error;
    if (error?.name === 'AbortError') {
      throw new TranscriptionError(
        'The speech provider took too long to respond. Please try again.',
        'PROVIDER_TIMEOUT',
        504,
      );
    }
    throw new TranscriptionError(
      'The server could not reach the speech provider. Please try again.',
      'PROVIDER_NETWORK_ERROR',
      502,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { TranscriptionError, getProviderConfig, transcribe };
