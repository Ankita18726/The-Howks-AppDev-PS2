import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import { initializeFirebase } from './firebase';

const HISTORY_SAVE_TIMEOUT_MS = 10000;

function historyCollection(db, uid) {
  return collection(db, 'users', uid, 'queries');
}

function serializableAnalysis(analysis) {
  return JSON.parse(JSON.stringify(analysis));
}

export async function saveQueryHistory(user, problem, analysis, options = {}) {
  if (!user?.uid) throw new Error('Sign in before saving query history.');
  const timeout = options.timeout ?? HISTORY_SAVE_TIMEOUT_MS;
  let timeoutId;
  const saveOperation = (async () => {
    const { db } = await initializeFirebase();
    const saved = serializableAnalysis(analysis);
    delete saved.historySaved;
    await addDoc(historyCollection(db, user.uid), {
      uid: user.uid,
      problem: problem.trim(),
      analysis: saved,
      createdAt: serverTimestamp(),
    });
  })();

  try {
    await Promise.race([
      saveOperation,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          const error = new Error('Saving query history timed out.');
          error.code = 'HISTORY_SAVE_TIMEOUT';
          reject(error);
        }, timeout);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getQueryHistory(user, maximum = 25) {
  if (!user?.uid) throw new Error('Sign in to view query history.');
  const { db } = await initializeFirebase();
  const snapshot = await getDocs(query(
    historyCollection(db, user.uid),
    orderBy('createdAt', 'desc'),
    limit(maximum),
  ));
  return snapshot.docs.map((document) => {
    const data = document.data();
    return {
      id: document.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || null,
    };
  });
}
