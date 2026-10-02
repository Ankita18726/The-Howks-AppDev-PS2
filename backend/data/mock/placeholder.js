const DEVELOPMENT_NOTICE = 'DEVELOPMENT MOCK DATA - NOT REAL LEGAL GUIDANCE';

function createPlaceholder(category, problemType) {
  return {
    summary: 'The legal knowledge base is not connected yet. No legal conclusion has been generated.',
    rights: [],
    nextSteps: [],
    documents: [],
    authority: {
      name: '',
      description: 'Authority information will appear after the verified knowledge base is added.',
      url: '',
    },
    source: {
      label: DEVELOPMENT_NOTICE,
      reference: '',
      status: 'mock',
      category,
      problemType,
    },
  };
}

module.exports = { createPlaceholder, DEVELOPMENT_NOTICE };
