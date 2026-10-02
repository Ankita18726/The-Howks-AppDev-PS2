import { createContext, useContext, useMemo, useState } from 'react';

const LegalCaseContext = createContext(null);

export function LegalCaseProvider({ children }) {
  const [problem, setProblem] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const value = useMemo(
    () => ({
      problem,
      setProblem,
      analysis,
      setAnalysis,
      clearCase: () => { setProblem(''); setAnalysis(null); },
    }),
    [problem, analysis],
  );
  return <LegalCaseContext.Provider value={value}>{children}</LegalCaseContext.Provider>;
}

export function useLegalCase() {
  const context = useContext(LegalCaseContext);
  if (!context) throw new Error('useLegalCase must be used inside LegalCaseProvider.');
  return context;
}
