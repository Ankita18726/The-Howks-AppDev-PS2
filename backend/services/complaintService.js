const { localized } = require('./legalKnowledgeService');

function templateFields(template) {
  if (!Array.isArray(template?.fields)) return [];
  return template.fields.map((field) => (
    typeof field === 'string' ? { key: field } : field
  )).filter((field) => typeof field?.key === 'string');
}

function placeholderLabel(field, language) {
  return localized(field?.label, language) || field?.key || 'detail';
}

function buildValues(problem, classification, template, language) {
  const extracted = classification.extractedData || {};
  const fields = templateFields(template);
  const today = new Date().toISOString().slice(0, 10);
  const values = {
    ...extracted,
    issue: extracted.issue || problem,
    today,
    requestedResponseDays: extracted.requestedResponseDays || template.defaultRequestedResponseDays,
  };

  for (const field of fields) {
    if ((values[field.key] === undefined || values[field.key] === null || values[field.key] === '') && field.default !== undefined) {
      values[field.key] = field.default;
    }
    if (values[field.key] === undefined || values[field.key] === null || values[field.key] === '') {
      values[field.key] = `[${placeholderLabel(field, language)}]`;
    }
  }
  return values;
}

function fillTemplate(body, values) {
  const withMustacheValues = body.replace(/{{\s*([A-Za-z][A-Za-z0-9_]*)\s*}}/g, (_, key) => {
    const value = values[key];
    return value === undefined || value === null || value === '' ? `[${key}]` : String(value);
  });

  const aliases = {
    amount: ['amount'],
    landlordownername: ['landlordName', 'ownerName'],
    propertyaddress: ['propertyAddress', 'location', 'address'],
    date: ['moveOutDate', 'date'],
    name: ['name'],
    phone: ['phone'],
    requestedresponsedays: ['requestedResponseDays'],
    'राशि': ['amount'],
    'मकानमालिककानाम': ['landlordName', 'ownerName'],
    'संपत्तिकापता': ['propertyAddress', 'location', 'address'],
    'तारीख': ['moveOutDate', 'date'],
    'नाम': ['name'],
    'फोन': ['phone'],
  };
  const normalizedValues = Object.fromEntries(Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]));

  return withMustacheValues.replace(/\[([^\]\n]+)\]/g, (placeholder, label) => {
    const normalizedLabel = label.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
    const candidateKeys = aliases[normalizedLabel] || [label.trim(), normalizedLabel];
    const key = candidateKeys.find((candidate) => {
      const value = values[candidate] ?? normalizedValues[String(candidate).toLowerCase()];
      return value !== undefined && value !== null && value !== '';
    });
    if (!key) return placeholder;
    return String(values[key] ?? normalizedValues[String(key).toLowerCase()]);
  });
}

async function generateDraft(problem, classification, legalInfo) {
  if (!problem || !classification || !legalInfo) {
    throw new Error('Complaint draft inputs are incomplete.');
  }

  const template = legalInfo.complaintTemplate;
  const language = legalInfo.language || classification.language || 'en';
  const body = localized(template?.body || template?.template, language);
  if (!template || !body) {
    throw new Error('No verified complaint template is available for this issue.');
  }

  const values = buildValues(problem, classification, template, language);
  return {
    title: localized(template.title, language) || localized(template.subject, language) || 'Editable complaint draft',
    content: fillTemplate(body, values),
    generatedBy: 'verified-knowledge-template',
    editable: true,
  };
}

module.exports = { buildValues, fillTemplate, generateDraft };
