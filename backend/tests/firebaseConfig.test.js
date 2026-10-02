const assert = require('node:assert/strict');
const { test } = require('node:test');

const { FIREBASE_ENVIRONMENT_KEYS, getFirebaseClientConfig } = require('../services/firebaseConfigService');

test('Firebase client config includes only the six public web identifiers', () => {
  const environment = Object.fromEntries(Object.values(FIREBASE_ENVIRONMENT_KEYS).map((key) => [key, `value-for-${key}`]));
  const config = getFirebaseClientConfig(environment);
  assert.deepEqual(Object.keys(config).sort(), Object.keys(FIREBASE_ENVIRONMENT_KEYS).sort());
  assert.equal(config.projectId, 'value-for-EXPO_PUBLIC_FIREBASE_PROJECT_ID');
});

test('missing Firebase config is rejected without exposing partial values', () => {
  assert.throws(
    () => getFirebaseClientConfig({ EXPO_PUBLIC_FIREBASE_API_KEY: 'partial-value' }),
    (error) => error.code === 'FIREBASE_NOT_CONFIGURED' && !error.message.includes('partial-value'),
  );
});
