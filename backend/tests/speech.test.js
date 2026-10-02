const assert = require('node:assert/strict');
const { after, before, describe, test } = require('node:test');

const { createApp } = require('../app');
const { MAX_AUDIO_BYTES } = require('../routes/speech');

let server;
let baseUrl;
let behavior;

const transcriptionService = {
  transcribe: async (input) => behavior(input),
};

before(async () => {
  server = createApp({ transcriptionService }).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function postAudio(body, contentType = 'audio/mp4') {
  const response = await fetch(`${baseUrl}/api/speech/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  });
  return { response, data: await response.json() };
}

describe('POST /api/speech/transcribe', () => {
  test('returns only normalized transcription text', async () => {
    behavior = async ({ audio, mimeType, filename }) => {
      assert.equal(Buffer.isBuffer(audio), true);
      assert.equal(mimeType, 'audio/mp4');
      assert.equal(filename, 'recording.m4a');
      return { text: '  My landlord kept my deposit.  ', provider: 'test' };
    };
    const { response, data } = await postAudio(Buffer.from('test-audio'));
    assert.equal(response.status, 200);
    assert.deepEqual(data, { text: 'My landlord kept my deposit.' });
  });

  test('rejects an empty recording', async () => {
    behavior = async () => { throw new Error('should not be called'); };
    const { response, data } = await postAudio(Buffer.alloc(0));
    assert.equal(response.status, 400);
    assert.equal(data.error, 'EMPTY_AUDIO');
  });

  test('rejects unsupported media types', async () => {
    const { response, data } = await postAudio(Buffer.from('not-audio'), 'text/plain');
    assert.equal(response.status, 415);
    assert.equal(data.error, 'UNSUPPORTED_AUDIO_TYPE');
  });

  test('rejects a malformed provider result', async () => {
    behavior = async () => ({ nope: true });
    const { response, data } = await postAudio(Buffer.from('test-audio'));
    assert.equal(response.status, 502);
    assert.equal(data.error, 'MALFORMED_TRANSCRIPTION');
  });

  test('returns controlled provider failures', async () => {
    behavior = async () => {
      const error = new Error('Speech provider is unavailable.');
      error.code = 'PROVIDER_ERROR';
      error.status = 502;
      throw error;
    };
    const { response, data } = await postAudio(Buffer.from('test-audio'));
    assert.equal(response.status, 502);
    assert.equal(data.error, 'PROVIDER_ERROR');
    assert.equal(data.message, 'Speech provider is unavailable.');
  });

  test('enforces an 8 MB maximum before provider forwarding', async () => {
    assert.equal(MAX_AUDIO_BYTES, 8 * 1024 * 1024);
    behavior = async () => { throw new Error('should not be called'); };
    const { response, data } = await postAudio(Buffer.alloc(MAX_AUDIO_BYTES + 1));
    assert.equal(response.status, 413);
    assert.equal(data.error, 'REQUEST_TOO_LARGE');
    assert.match(data.message, /recording is too large/i);
  });
});
