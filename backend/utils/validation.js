const SUPPORTED_CATEGORIES = [
  'consumer',
  'cyber_fraud',
  'rental',
  'salary',
  'government_grievance',
];

const MAX_PROBLEM_LENGTH = 4000;

class ValidationError extends Error {
  constructor(message, code = 'VALIDATION_ERROR', status = 400) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.status = status;
  }
}

function validateProblem(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Please describe the problem before asking for guidance.', 'EMPTY_PROBLEM');
  }

  const problem = value.trim();
  if (problem.length < 10) {
    throw new ValidationError(
      'Please add a little more detail so the problem can be identified (at least 10 characters).',
      'PROBLEM_TOO_SHORT',
    );
  }
  if (problem.length > MAX_PROBLEM_LENGTH) {
    throw new ValidationError(
      `Please shorten the description to ${MAX_PROBLEM_LENGTH} characters or fewer.`,
      'PROBLEM_TOO_LONG',
      413,
    );
  }
  return problem;
}

function validateClassification(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(
      'The classification service returned an invalid response. Please try again.',
      'MALFORMED_CLASSIFICATION',
      502,
    );
  }

  const { category, problemType, confidence, extractedData, language } = value;
  if (
    typeof category !== 'string' ||
    typeof problemType !== 'string' ||
    typeof confidence !== 'number' ||
    confidence < 0 ||
    confidence > 1 ||
    !extractedData ||
    typeof extractedData !== 'object' ||
    Array.isArray(extractedData)
    || (language !== undefined && !['en', 'hi', 'hinglish'].includes(language))
  ) {
    throw new ValidationError(
      'The classification service returned incomplete information. Please try again.',
      'MALFORMED_CLASSIFICATION',
      502,
    );
  }

  if (!SUPPORTED_CATEGORIES.includes(category)) {
    throw new ValidationError(
      'This issue is outside the categories currently supported by Kayda Sathi. Try describing a consumer, cyber fraud, rental, salary, or government grievance issue.',
      'UNSUPPORTED_CATEGORY',
      422,
    );
  }
  return value;
}

module.exports = {
  MAX_PROBLEM_LENGTH,
  SUPPORTED_CATEGORIES,
  ValidationError,
  validateClassification,
  validateProblem,
};
