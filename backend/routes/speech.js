const express = require('express');

const defaultTranscriptionService = require('../services/transcriptionService');

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const AUDIO_TYPES = new Map([
  ['audio/mp4', { extension: 'm4a', filename: 'recording.m4a' }],
  ['audio/m4a', { extension: 'm4a', filename: 'recording.m4a' }],
  ['audio/x-m4a', { extension: 'm4a', filename: 'recording.m4a' }],
  ['audio/mpeg', { extension: 'mp3', filename: 'recording.mp3' }],
  ['audio/webm', { extension: 'webm', filename: 'recording.webm' }],
  ['audio/wav', { extension: 'wav', filename: 'recording.wav' }],
  ['audio/x-wav', { extension: 'wav', filename: 'recording.wav' }],
]);

function createSpeechRouter({ transcriptionService = defaultTranscriptionService } = {}) {
  const router = express.Router();
  const parseAudio = express.raw({
    type: (request) => AUDIO_TYPES.has((request.headers['content-type'] || '').split(';')[0].trim().toLowerCase()),
    limit: MAX_AUDIO_BYTES,
  });

  router.post('/transcribe', parseAudio, async (request, response) => {
    const mimeType = (request.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const format = AUDIO_TYPES.get(mimeType);
    if (!format) {
      return response.status(415).json({
        error: 'UNSUPPORTED_AUDIO_TYPE',
        message: 'Unsupported recording format. Please record again on a supported device.',
      });
    }
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
      return response.status(400).json({
        error: 'EMPTY_AUDIO',
        message: 'The recording was empty. Please speak clearly and try again.',
      });
    }

    try {
      const result = await transcriptionService.transcribe({
        audio: request.body,
        mimeType,
        filename: format.filename,
      });
      if (!result || typeof result.text !== 'string' || !result.text.trim()) {
        return response.status(502).json({
          error: 'MALFORMED_TRANSCRIPTION',
          message: 'The transcription provider returned an invalid response. Please try again.',
        });
      }
      response.json({ text: result.text.trim() });
    } catch (error) {
      const status = Number.isInteger(error.status) ? error.status : 503;
      response.status(status).json({
        error: error.code || 'TRANSCRIPTION_UNAVAILABLE',
        message: error.message || 'Voice transcription is temporarily unavailable. Please try again.',
      });
    }
  });

  return router;
}

module.exports = { AUDIO_TYPES, MAX_AUDIO_BYTES, createSpeechRouter };
