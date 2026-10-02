export function getErrorMessage(error, fallback = 'The request could not be completed. Please try again.') {
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  if (error && typeof error.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}
