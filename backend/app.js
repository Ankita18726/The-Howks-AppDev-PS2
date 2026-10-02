const express = require('express');

const { createLegalRouter, legalErrorHandler } = require('./routes/legal');
const { createSpeechRouter } = require('./routes/speech');

function createApp(dependencies) {
  const app = express();

  app.disable('x-powered-by');
  app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    if (request.method === 'OPTIONS') return response.sendStatus(204);
    return next();
  });
  app.use(express.json({ limit: '12kb' }));

  app.get('/api/health', (request, response) => response.json({
    status: 'ok',
    mode: 'gemini-with-curated-knowledge',
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
  }));
  app.use('/api/speech', createSpeechRouter(dependencies));
  app.use('/api/legal', createLegalRouter(dependencies));
  app.use((request, response) => response.status(404).json({
    error: 'NOT_FOUND',
    message: 'The requested API endpoint does not exist.',
  }));
  app.use((error, request, response, next) => {
    if (error?.type === 'entity.too.large') {
      const isSpeechRequest = request.originalUrl?.startsWith('/api/speech/');
      return response.status(413).json({
        error: 'REQUEST_TOO_LARGE',
        message: isSpeechRequest
          ? 'The recording is too large. Keep voice descriptions brief and try again.'
          : 'The request is too large. Please shorten the problem description and try again.',
      });
    }
    if (error instanceof SyntaxError && error.status === 400) {
      return response.status(400).json({
        error: 'INVALID_JSON',
        message: 'The request body must be valid JSON.',
      });
    }
    return legalErrorHandler(error, request, response, next);
  });

  return app;
}

module.exports = { createApp };
