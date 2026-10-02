const fs = require('node:fs/promises');
const path = require('node:path');

const { SUPPORTED_CATEGORIES } = require('../utils/validation');

const DATA_DIRECTORY = path.resolve(__dirname, '..', '..', 'data');
const CATEGORY_FILES = Object.freeze({
  consumer: 'consumer.json',
  cyber_fraud: 'cyber_fraud.json',
  rental: 'rental.json',
  salary: 'salary.json',
  government_grievance: 'government_grievance.json',
});
const SUPPORTED_LANGUAGES = new Set(['en', 'hi', 'hinglish']);
const UNIVERSAL_EXTRACTION_FIELDS = [
  'issue', 'amount', 'date', 'name', 'phone', 'address', 'location',
  'landlordName', 'propertyAddress', 'moveOutDate', 'requestedRemedy',
];

class KnowledgeBaseError extends Error {
  constructor(message, code = 'KNOWLEDGE_BASE_UNAVAILABLE', status = 503) {
    super(message);
    this.name = 'KnowledgeBaseError';
    this.code = code;
    this.status = status;
    this.expose = true;
  }
}

function normalizeLanguage(language) {
  return SUPPORTED_LANGUAGES.has(language) ? language : 'en';
}

function localized(value, language = 'en') {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return '';
  return value[normalizeLanguage(language)] || value.en || Object.values(value).find((item) => typeof item === 'string') || '';
}

function localizedList(value, language = 'en') {
  const selected = Array.isArray(value) ? value : value?.[normalizeLanguage(language)] || value?.en;
  if (!Array.isArray(selected)) return [];
  return selected.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
}

function normalizeScenarios(scenarios) {
  if (Array.isArray(scenarios)) return scenarios;
  if (!scenarios || typeof scenarios !== 'object') return [];
  return Object.entries(scenarios).map(([id, scenario]) => ({ id, ...scenario }));
}

function normalizeTemplates(templates) {
  if (Array.isArray(templates)) return templates;
  if (!templates || typeof templates !== 'object') return [];
  return Object.entries(templates).map(([id, template]) => ({ id, ...template }));
}

function normalizeProblemType(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function selectScenario(data, problemType) {
  const normalizedType = normalizeProblemType(problemType);
  return normalizeScenarios(data.scenarios).find((scenario) => normalizeProblemType(scenario.id) === normalizedType) || null;
}

function selectTemplate(data, problemType) {
  const templates = normalizeTemplates(data.complaintTemplates);
  if (templates.length <= 1) return templates[0] || null;

  const problemTokens = new Set(normalizeProblemType(problemType).split('_').filter((token) => token.length > 2));
  let best = templates[0];
  let bestScore = -1;
  for (const template of templates) {
    const templateTokens = normalizeProblemType(template.id).split('_');
    const score = templateTokens.filter((token) => problemTokens.has(token)).length;
    if (score > bestScore) {
      best = template;
      bestScore = score;
    }
  }
  return best;
}

function normalizeAuthority(authority, language) {
  if (!authority || typeof authority !== 'object') return {};
  const contact = Array.isArray(authority.contact)
    ? authority.contact.join(', ')
    : localized(authority.contact, language);
  const description = localized(authority.purpose, language)
    || localized(authority.note, language)
    || contact;

  return {
    name: localized(authority.name, language),
    description,
    url: typeof authority.website === 'string' ? authority.website : '',
    contact,
    email: typeof authority.email === 'string' ? authority.email : '',
    type: typeof authority.type === 'string' ? authority.type : '',
  };
}

function normalizeSources(sources, language) {
  if (!Array.isArray(sources)) return [];
  return sources.map((source) => ({
    label: localized(source.title, language) || localized(source.label, language),
    url: typeof source.url === 'string' ? source.url : '',
    status: typeof source.status === 'string' ? source.status : 'curated',
  })).filter((source) => source.label || source.url);
}

function validateCategoryData(data, category) {
  return Boolean(
    data
      && typeof data === 'object'
      && data.id === category
      && data.summary
      && data.rights
      && data.steps
      && data.documents
      && Array.isArray(data.authorities)
      && Array.isArray(data.sources),
  );
}

async function loadJson(fileName) {
  const filePath = path.join(DATA_DIRECTORY, fileName);
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new KnowledgeBaseError('Verified legal information is not available for this category.');
    }
    if (error instanceof SyntaxError) {
      throw new KnowledgeBaseError('The verified legal information file is malformed.', 'INVALID_KNOWLEDGE_BASE');
    }
    if (error instanceof KnowledgeBaseError) throw error;
    throw new KnowledgeBaseError('The verified legal information could not be loaded.');
  }
}

async function loadCategory(category) {
  if (!SUPPORTED_CATEGORIES.includes(category) || !CATEGORY_FILES[category]) {
    throw new KnowledgeBaseError('No verified legal information exists for this category.', 'UNSUPPORTED_CATEGORY', 422);
  }

  const data = await loadJson(CATEGORY_FILES[category]);
  if (!validateCategoryData(data, category)) {
    throw new KnowledgeBaseError('The verified legal information has an unexpected format.', 'INVALID_KNOWLEDGE_BASE');
  }
  return data;
}

async function loadCommon() {
  const data = await loadJson('common.json');
  if (!data || typeof data !== 'object' || !data.disclaimer || !Array.isArray(data.categories)) {
    throw new KnowledgeBaseError('The shared legal information has an unexpected format.', 'INVALID_KNOWLEDGE_BASE');
  }
  return data;
}

async function getClassificationCatalog() {
  const entries = await Promise.all(SUPPORTED_CATEGORIES.map(async (category) => {
    const data = await loadCategory(category);
    const fields = [...new Set([
      ...(data.extractFields || []).map((field) => typeof field === 'string' ? field : field?.id).filter(Boolean),
      ...UNIVERSAL_EXTRACTION_FIELDS,
    ])];
    const problemTypes = normalizeScenarios(data.scenarios).map((scenario) => scenario.id).filter(Boolean);
    return [category, { fields, problemTypes }];
  }));
  return Object.fromEntries(entries);
}

async function getInformation(category, problemType, { language = 'en' } = {}) {
  const selectedLanguage = normalizeLanguage(language);
  const [data, common] = await Promise.all([loadCategory(category), loadCommon()]);
  const scenario = selectScenario(data, problemType);
  const scenarioGuidance = localizedList(
    scenario?.extraGuidance || scenario?.guidance || scenario?.advice,
    selectedLanguage,
  );
  const sources = normalizeSources(data.sources, selectedLanguage);
  const authority = normalizeAuthority(data.authorities[0], selectedLanguage);

  return {
    summary: localized(data.summary, selectedLanguage),
    rights: localizedList(data.rights, selectedLanguage),
    nextSteps: [...localizedList(data.steps, selectedLanguage), ...scenarioGuidance],
    documents: localizedList(data.documents, selectedLanguage),
    authority,
    complaintTemplate: selectTemplate(data, problemType),
    language: selectedLanguage,
    disclaimer: localized(data.disclaimer, selectedLanguage) || localized(common.disclaimer, selectedLanguage),
    source: {
      status: 'verified',
      label: sources[0]?.label || `${category} curated legal knowledge`,
      reference: sources[0]?.url || '',
      lastVerified: typeof data.lastVerified === 'string' ? data.lastVerified : '',
      references: sources,
    },
  };
}

module.exports = {
  CATEGORY_FILES,
  DATA_DIRECTORY,
  KnowledgeBaseError,
  getClassificationCatalog,
  getInformation,
  loadCategory,
  loadCommon,
  localized,
  normalizeLanguage,
  validateCategoryData,
};
