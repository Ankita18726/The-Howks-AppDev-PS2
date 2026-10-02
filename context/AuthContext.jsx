import * as FirebaseAuth from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { initializeFirebase, resetFirebaseInitialization } from '../services/firebase';

const AuthContext = createContext(null);

function friendlyAuthError(error) {
  const messages = {
    'auth/email-already-in-use': 'An account already exists for this email. Try signing in.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/network-request-failed': 'Firebase could not be reached. Check your internet connection.',
    'auth/too-many-requests': 'Too many attempts. Wait a little and try again.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
    'permission-denied': 'Firebase denied access. Check the deployed Firestore security rules.',
  };
  const wrapped = new Error(messages[error?.code] || error?.message || 'Authentication could not be completed.');
  wrapped.code = error?.code || 'AUTH_ERROR';
  return wrapped;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configurationError, setConfigurationError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let unsubscribe = () => {};
    let active = true;
    setLoading(true);
    setConfigurationError('');
    initializeFirebase()
      .then(({ auth }) => {
        if (!active) return;
        unsubscribe = FirebaseAuth.onAuthStateChanged(auth, (nextUser) => {
          if (!active) return;
          setUser(nextUser);
          setLoading(false);
        });
      })
      .catch((error) => {
        if (!active) return;
        setConfigurationError(error?.message || 'Firebase could not be initialized.');
        setLoading(false);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [attempt]);

  const signIn = useCallback(async (email, password) => {
    try {
      const { auth } = await initializeFirebase();
      return await FirebaseAuth.signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw friendlyAuthError(error);
    }
  }, []);

  const signUp = useCallback(async (email, password) => {
    try {
      const { auth } = await initializeFirebase();
      return await FirebaseAuth.createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw friendlyAuthError(error);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { auth } = await initializeFirebase();
      await FirebaseAuth.signOut(auth);
    } catch (error) {
      throw friendlyAuthError(error);
    }
  }, []);

  const retryInitialization = useCallback(() => {
    resetFirebaseInitialization();
    setAttempt((value) => value + 1);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    configurationError,
    signIn,
    signUp,
    signOut,
    retryInitialization,
  }), [configurationError, loading, retryInitialization, signIn, signOut, signUp, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
