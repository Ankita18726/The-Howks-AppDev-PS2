import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

import api from './api';

let initializationPromise;

function initializeFirebaseAuth(app) {
  if (Platform.OS === 'web') return FirebaseAuth.getAuth(app);
  try {
    const persistenceFactory = FirebaseAuth.getReactNativePersistence;
    return FirebaseAuth.initializeAuth(app, persistenceFactory
      ? { persistence: persistenceFactory(AsyncStorage) }
      : undefined);
  } catch (error) {
    if (error?.code === 'auth/already-initialized') return FirebaseAuth.getAuth(app);
    throw error;
  }
}

export function initializeFirebase() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const config = await api.get('/api/config/firebase', { timeout: 10000 });
      const app = getApps().length ? getApp() : initializeApp(config);
      return {
        app,
        auth: initializeFirebaseAuth(app),
        db: getFirestore(app),
      };
    })().catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }
  return initializationPromise;
}

export function resetFirebaseInitialization() {
  initializationPromise = null;
}
