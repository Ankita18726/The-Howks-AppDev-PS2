const assert = require('node:assert/strict');
const { test } = require('node:test');

const { generateDraft } = require('../services/complaintService');
const { getInformation, loadCategory, loadCommon } = require('../services/legalKnowledgeService');
const { SUPPORTED_CATEGORIES } = require('../utils/validation');

test('all supported category JSON files load with the expected curated schema', async () => {
  const common = await loadCommon();
  assert.deepEqual([...common.categories].sort(), [...SUPPORTED_CATEGORIES].sort());
  for (const category of SUPPORTED_CATEGORIES) {
    const data = await loadCategory(category);
    assert.equal(data.id, category);
    assert.ok(data.lastVerified);
    assert.ok(Array.isArray(data.sources));
  }
});

test('rental scenario guidance and official source are normalized from JSON', async () => {
  const info = await getInformation('rental', 'deposit_not_returned', { language: 'en' });
  assert.equal(info.source.status, 'verified');
  assert.ok(info.nextSteps.length > info.rights.length);
  assert.ok(info.source.references.length > 0);
  assert.ok(info.complaintTemplate);
});

test('complaint draft uses extracted details and the curated template', async () => {
  const info = await getInformation('rental', 'deposit_not_returned', { language: 'en' });
  const draft = await generateDraft(
    'My landlord has not returned my 20000 rupee deposit.',
    { language: 'en', extractedData: { amount: 20000, landlordName: 'Example Landlord' } },
    info,
  );
  assert.equal(draft.generatedBy, 'verified-knowledge-template');
  assert.match(draft.content, /20000/);
  assert.match(draft.content, /Example Landlord/);
  assert.equal(draft.editable, true);
});
