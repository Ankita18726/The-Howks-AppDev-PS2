import api from './api';

// Voice transcription can call this same function later with transcribed text.
export function analyzeProblem(problem, options = {}) {
  return api.post('/api/legal/analyze', { problem }, options);
}
