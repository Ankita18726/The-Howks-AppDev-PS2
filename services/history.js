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

function historyCollection(db, uid) {
  return collection(db, 'users', uid, 'queries');
}

function serializableAnalysis(analysis) {
  return JSON.parse(JSON.stringify(analysis));
}

export async function saveQueryHistory(user, problem, analysis) {
  if (!user?.uid) throw new Error('Sign in before saving query history.');
  const { db } = await initializeFirebase();
  const saved = serializableAnalysis(analysis);
  delete saved.historySaved;
  await addDoc(historyCollection(db, user.uid), {
    uid: user.uid,
    problem: problem.trim(),
    analysis: saved,
    createdAt: serverTimestamp(),
  });
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
