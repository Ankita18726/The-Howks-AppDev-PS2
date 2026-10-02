import { useCallback, useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '../utils/getErrorMessage';

export default function useAsync(asyncFunction) {
  const mountedRef = useRef(true);
  const [state, setState] = useState({
    data: null,
    error: null,
    errorMessage: '',
    loading: false,
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args) => {
      setState((current) => ({ ...current, error: null, errorMessage: '', loading: true }));

      try {
        const data = await asyncFunction(...args);
        if (mountedRef.current) {
          setState({ data: data ?? null, error: null, errorMessage: '', loading: false });
        }
        return data;
      } catch (error) {
        if (mountedRef.current) {
          setState((current) => ({
            ...current,
            error,
            errorMessage: getErrorMessage(error),
            loading: false,
          }));
        }
        return null;
      }
    },
    [asyncFunction],
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, errorMessage: '', loading: false });
  }, []);

  return { ...state, execute, reset };
}
