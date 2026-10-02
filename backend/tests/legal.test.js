const assert = require('node:assert/strict');
const { after, before, describe, test } = require('node:test');

const { createApp } = require('../app');

const CASES = [
  { token: 'landlord', category: 'rental', problemType: 'deposit_not_returned', language: 'en' },
  { token: 'refund', category: 'consumer', problemType: 'online_order', language: 'en' },
  { token: 'upi', category: 'cyber_fraud', problemType: 'upi_fraud', language: 'en' },
  { token: 'salary', category: 'salary', problemType: 'current_salary_pending', language: 'en' },
  { token: 'certificate', category: 'government_grievance', problemType: 'application_pending', language: 'en' },
  { token: 'मकान', category: 'rental', problemType: 'deposit_not_returned', language: 'hi' },
  { token: 'depojit', category: 'rental', problemType: 'deposit_not_returned', language: 'hinglish' },
];

const fakeAiService = {
  async analyzeProblem(problem) {
    const match = CASES.find((entry) => problem.toLowerCase().includes(entry.token));
    if (!match) {
      return { category: 'unsupported', problemType: 'unknown', confidence: 0.2, language: 'en', extractedData: {} };
    }
    return {
      category: match.category,
      problemType: match.problemType,
      confidence: 0.93,
      language: match.language,
      extractedData: { amount: '20000', issue: problem },
    };
  },
};

let server;
let baseUrl;

before(async () => {
  server = createApp({ aiService: fakeAiService }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function post(body, url = baseUrl) {
  const response = await fetch(`${url}/api/legal/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { response, data: await response.json() };
}

describe('POST /api/legal/analyze', () => {
  for (const [label, problem, expectedCategory] of [
    ['rental/security deposit', 'My landlord has not returned my security deposit.', 'rental'],
    ['consumer complaint', 'The online seller has not given my refund.', 'consumer'],
    ['cyber fraud', 'I sent money by UPI to a fraud account.', 'cyber_fraud'],
    ['salary/wage', 'My employer has not paid my salary.', 'salary'],
    ['government grievance', 'My government certificate application is still pending.', 'government_grievance'],
    ['Hindi input', 'मकान मालिक ने मेरी जमा राशि वापस नहीं की।', 'rental'],
    ['Hinglish typo input', 'Landlord mera depojit wapas nahi kar raha.', 'rental'],
  ]) {
    test(`returns verified knowledge for ${label}`, async () => {
      const { response, data } = await post({ problem });
      assert.equal(response.status, 200);
      assert.equal(data.category, expectedCategory);
      assert.equal(data.source.status, 'verified');
      assert.ok(data.summary.length > 0);
      assert.ok(data.rights.length > 0);
      assert.ok(data.nextSteps.length > 0);
      assert.ok(data.documents.length > 0);
      assert.equal(data.complaintDraft.editable, true);
      assert.equal(data.complaintDraft.generatedBy, 'verified-knowledge-template');
    });
  }

  test('rejects empty input with a useful response', async () => {
    const { response, data } = await post({ problem: '   ' });
    assert.equal(response.status, 400);
    assert.equal(data.error, 'EMPTY_PROBLEM');
    assert.match(data.message, /describe/i);
  });

  test('rejects very short input', async () => {
    const { response, data } = await post({ problem: 'rent' });
    assert.equal(response.status, 400);
    assert.equal(data.error, 'PROBLEM_TOO_SHORT');
  });

  test('rejects unsupported input with supported category guidance', async () => {
    const { response, data } = await post({ problem: 'My bicycle chain keeps slipping while I ride.' });
    assert.equal(response.status, 422);
    assert.equal(data.error, 'UNSUPPORTED_CATEGORY');
    assert.match(data.message, /consumer.*cyber fraud.*rental.*salary.*government grievance/i);
  });
});

test('malformed AI output becomes a controlled 502 error', async () => {
  const badAi = { analyzeProblem: async () => ({ category: 'rental' }) };
  const failingServer = createApp({ aiService: badAi }).listen(0, '127.0.0.1');
  await new Promise((resolve) => failingServer.once('listening', resolve));
  const url = `http://127.0.0.1:${failingServer.address().port}`;
  const { response, data } = await post({ problem: 'My landlord kept the security deposit.' }, url);
  await new Promise((resolve) => failingServer.close(resolve));
  assert.equal(response.status, 502);
  assert.equal(data.error, 'MALFORMED_CLASSIFICATION');
});

test('complaint generation failure is returned without leaking details', async () => {
  const complaintService = { generateDraft: async () => { throw new Error('internal template failure'); } };
  const failingServer = createApp({ aiService: fakeAiService, complaintService }).listen(0, '127.0.0.1');
  await new Promise((resolve) => failingServer.once('listening', resolve));
  const url = `http://127.0.0.1:${failingServer.address().port}`;
  const { response, data } = await post({ problem: 'My landlord kept the security deposit.' }, url);
  await new Promise((resolve) => failingServer.close(resolve));
  assert.equal(response.status, 503);
  assert.equal(data.error, 'LEGAL_SERVICE_UNAVAILABLE');
  assert.doesNotMatch(data.message, /internal template failure/);
});
