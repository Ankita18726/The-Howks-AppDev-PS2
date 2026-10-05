const assert = require('node:assert/strict');
const { test } = require('node:test');

const { createAiService, parseGeminiResult } = require('../services/aiService');

const catalog = {
  rental: { problemTypes: ['deposit_not_returned'], fields: ['amount', 'issue'] },
};

test('Gemini structured output is normalized to the stable API classification', async () => {
  const aiService = createAiService({
    apiKey: 'test-only',
    maxRetries: 0,
    getCatalog: async () => catalog,
    generateContent: async () => ({
      text: JSON.stringify({
        category: 'rental_dispute',
        problem_type: 'deposit_not_returned',
        confidence: 0.96,
        language: 'hinglish',
        entities: { amount: 20000, issue: 'deposit not returned' },
        unexpected: 'ignored',
      }),
    }),
  });

  const result = await aiService.analyzeProblem('Mera deposit wapas nahi mila.');
  assert.deepEqual(result, {
    category: 'rental',
    problemType: 'deposit_not_returned',
    confidence: 0.96,
    language: 'hinglish',
    extractedData: { amount: 20000, issue: 'deposit not returned' },
  });
});

test('malformed Gemini JSON is rejected cleanly', () => {
  assert.throws(
    () => parseGeminiResult('{not json'),
    (error) => error.code === 'MALFORMED_AI_RESPONSE' && error.status === 502,
  );
});

test('unexpected Gemini category is rejected cleanly', () => {
  assert.throws(
    () => parseGeminiResult(JSON.stringify({
      category: 'criminal_case', problem_type: 'unknown', confidence: 0.8, language: 'en', entities: {},
    })),
    (error) => error.code === 'MALFORMED_AI_RESPONSE',
  );
});

test('missing GEMINI_API_KEY returns a controlled configuration error', async () => {
  const aiService = createAiService({ apiKey: '', openRouterApiKey: '', maxRetries: 0, getCatalog: async () => catalog });
  await assert.rejects(
    () => aiService.analyzeProblem('My landlord kept my deposit.'),
    (error) => error.code === 'MISSING_GEMINI_API_KEY' && error.status === 503,
  );
});

test('markdown-wrapped JSON response from OpenRouter/LLM is parsed cleanly', () => {
  const markdownText = '```json\n{"category":"consumer_complaint","problem_type":"defective_product","confidence":0.95,"language":"en","entities":{"product":"phone"}}\n```';
  const result = parseGeminiResult(markdownText);
  assert.equal(result.category, 'consumer');
  assert.equal(result.problemType, 'defective_product');
  assert.equal(result.confidence, 0.95);
  assert.equal(result.language, 'en');
});

