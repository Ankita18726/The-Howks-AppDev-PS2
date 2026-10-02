const assert = require('node:assert/strict');
const test = require('node:test');

const { executeAnalysisSubmission } = require('../../utils/analysisSubmission');

const result = {
  category: 'rental',
  problemType: 'security_deposit',
  confidence: 0.95,
};

function stateSetter(initial = null) {
  let value = initial;
  return {
    get value() { return value; },
    set(next) { value = typeof next === 'function' ? next(value) : next; },
  };
}

test('successful analysis navigates without waiting for a pending history save', async () => {
  const problemState = stateSetter('');
  const analysisState = stateSetter();
  let navigated = false;
  let releaseSave;
  const pendingSave = new Promise((resolve) => { releaseSave = resolve; });

  const completed = await executeAnalysisSubmission({
    analyze: async () => result,
    problem: 'My landlord has not returned my security deposit.',
    setProblem: problemState.set,
    setAnalysis: analysisState.set,
    saveHistory: () => pendingSave,
    navigate: () => { navigated = true; },
  });

  assert.equal(navigated, true);
  assert.equal(analysisState.value.category, 'rental');
  assert.equal(analysisState.value.historySaved, null);
  releaseSave();
  assert.equal(await completed.historyPromise, true);
  assert.equal(analysisState.value.historySaved, true);
});

test('history failure does not block navigation and is exposed in result state', async () => {
  const analysisState = stateSetter();
  let navigated = false;
  const completed = await executeAnalysisSubmission({
    analyze: async () => result,
    problem: 'A sufficiently detailed legal problem.',
    setProblem: () => {},
    setAnalysis: analysisState.set,
    saveHistory: async () => { throw new Error('Firestore unavailable'); },
    navigate: () => { navigated = true; },
  });

  assert.equal(navigated, true);
  assert.equal(await completed.historyPromise, false);
  assert.equal(analysisState.value.historySaved, false);
});

test('navigation errors are reported and do not leave history rejection unhandled', async () => {
  const analysisState = stateSetter();
  let reportedError;
  const completed = await executeAnalysisSubmission({
    analyze: async () => result,
    problem: 'A sufficiently detailed legal problem.',
    setProblem: () => {},
    setAnalysis: analysisState.set,
    saveHistory: async () => {},
    navigate: () => { throw new Error('Route unavailable'); },
    onNavigationError: (error) => { reportedError = error; },
  });

  assert.equal(completed.navigationError.message, 'Route unavailable');
  assert.equal(reportedError.message, 'Route unavailable');
  assert.equal(await completed.historyPromise, true);
});

test('analysis and malformed-response failures stop before save or navigation', async () => {
  for (const errorCode of ['AI_SERVICE_UNAVAILABLE', 'MALFORMED_RESPONSE']) {
    let saved = false;
    let navigated = false;
    const error = Object.assign(new Error(errorCode), { code: errorCode });

    await assert.rejects(() => executeAnalysisSubmission({
      analyze: async () => { throw error; },
      problem: 'A sufficiently detailed legal problem.',
      setProblem: () => {},
      setAnalysis: () => {},
      saveHistory: () => { saved = true; },
      navigate: () => { navigated = true; },
    }), (caught) => caught.code === errorCode);

    assert.equal(saved, false);
    assert.equal(navigated, false);
  }
});

test('a late history completion cannot overwrite a newer displayed analysis', async () => {
  const analysisState = stateSetter();
  let releaseSave;
  const pendingSave = new Promise((resolve) => { releaseSave = resolve; });
  const completed = await executeAnalysisSubmission({
    analyze: async () => result,
    problem: 'A sufficiently detailed legal problem.',
    setProblem: () => {},
    setAnalysis: analysisState.set,
    saveHistory: () => pendingSave,
    navigate: () => {},
  });

  analysisState.set({ category: 'consumer', historySaved: true });
  releaseSave();
  await completed.historyPromise;
  assert.deepEqual(analysisState.value, { category: 'consumer', historySaved: true });
});
