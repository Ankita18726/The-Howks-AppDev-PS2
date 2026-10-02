const HISTORY_SAVE_MARKER = Symbol('historySaveMarker');

let markerSequence = 0;

/**
 * Completes the frontend success flow without making results navigation wait for
 * Firestore's remote write acknowledgement.
 */
async function executeAnalysisSubmission({
  analyze,
  problem,
  setProblem,
  setAnalysis,
  saveHistory,
  navigate,
  onNavigationError,
}) {
  const result = await analyze();
  const marker = `${Date.now()}-${markerSequence += 1}`;

  setProblem(problem);
  setAnalysis({
    ...result,
    historySaved: null,
    [HISTORY_SAVE_MARKER]: marker,
  });

  // Start persistence, but do not await it before showing the completed result.
  // Firestore can commit locally while its acknowledgement remains pending.
  let saveOperation;
  try {
    saveOperation = saveHistory(result);
  } catch (saveError) {
    saveOperation = Promise.reject(saveError);
  }

  const historyPromise = Promise.resolve(saveOperation)
    .then(() => {
      setAnalysis((current) => (
        current?.[HISTORY_SAVE_MARKER] === marker
          ? { ...current, historySaved: true }
          : current
      ));
      return true;
    })
    .catch(() => {
      setAnalysis((current) => (
        current?.[HISTORY_SAVE_MARKER] === marker
          ? { ...current, historySaved: false }
          : current
      ));
      return false;
    });

  let navigationError = null;
  try {
    navigate();
  } catch (error) {
    navigationError = error;
    onNavigationError?.(error);
  }

  return { result, historyPromise, navigationError };
}

module.exports = { executeAnalysisSubmission };
