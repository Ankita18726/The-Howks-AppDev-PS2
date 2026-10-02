const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || '').trim().replace(/\/+$/, '');
const DEFAULT_TIMEOUT_MS = 10000;

export class ApiError extends Error {
  constructor(message, { status = null, code = 'API_ERROR', data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export function getApiUrl(path) {
  const safePath = typeof path === 'string' ? path.trim() : '';

  if (!safePath) {
    throw new ApiError('A request path is required.', { code: 'INVALID_PATH' });
  }

  if (/^https?:\/\//i.test(safePath)) {
    return safePath;
  }

  if (!API_BASE_URL) {
    throw new ApiError('API base URL is not configured. Add EXPO_PUBLIC_API_BASE_URL to your .env file.', {
      code: 'MISSING_BASE_URL',
    });
  }

  return `${API_BASE_URL}/${safePath.replace(/^\/+/, '')}`;
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getResponseErrorMessage(data, response) {
  if (data && typeof data === 'object') {
    const serverMessage = data.message || data.error || data.detail;
    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      return serverMessage.trim();
    }
  }

  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  return `Request failed with status ${response.status}${response.statusText ? ` (${response.statusText})` : ''}.`;
}

async function request(path, { method = 'GET', body, headers = {}, timeout = DEFAULT_TIMEOUT_MS, signal } = {}) {
  const controller = new AbortController();
  const timeoutMs = Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller, { once: true });

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const requestHeaders = {
    Accept: 'application/json',
    ...(!isFormData && body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  };

  try {
    const response = await fetch(getApiUrl(path), {
      method,
      headers: requestHeaders,
      body: body === undefined || isFormData || typeof body === 'string' ? body : JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await parseResponse(response);

    if (!response.ok) {
      throw new ApiError(getResponseErrorMessage(data, response), {
        status: response.status,
        code: 'HTTP_ERROR',
        data,
      });
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error?.name === 'AbortError') {
      if (signal?.aborted) {
        throw new ApiError('Request cancelled.', { code: 'CANCELLED' });
      }
      throw new ApiError(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please try again.`, {
        code: 'TIMEOUT',
      });
    }

    throw new ApiError('Could not reach the server. Check your internet connection and try again.', {
      code: 'NETWORK_ERROR',
    });
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

export const api = {
  get(path, options = {}) {
    return request(path, { ...options, method: 'GET' });
  },
  post(path, body, options = {}) {
    return request(path, { ...options, method: 'POST', body });
  },
};

export default api;
