const FIREBASE_ENVIRONMENT_KEYS = Object.freeze({
  apiKey: 'EXPO_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'EXPO_PUBLIC_FIREBASE_APP_ID',
});

function getFirebaseClientConfig(environment = process.env) {
  const config = Object.fromEntries(Object.entries(FIREBASE_ENVIRONMENT_KEYS).map(([key, environmentKey]) => (
    [key, String(environment[environmentKey] || '').trim()]
  )));
  const missing = Object.entries(config).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) {
    const error = new Error('Firebase authentication is not configured on the backend.');
    error.code = 'FIREBASE_NOT_CONFIGURED';
    error.status = 503;
    error.expose = true;
    throw error;
  }
  return config;
}

function isFirebaseConfigured(environment = process.env) {
  try {
    getFirebaseClientConfig(environment);
    return true;
  } catch {
    return false;
  }
}

module.exports = { FIREBASE_ENVIRONMENT_KEYS, getFirebaseClientConfig, isFirebaseConfigured };
