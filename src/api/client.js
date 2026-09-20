const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getErrorMessage(payload, fallback) {
  if (payload?.message) {
    return payload.message;
  }

  if (payload?.detail) {
    return payload.detail;
  }

  return fallback;
}

export async function apiRequest(path, options = {}) {
  const { body, token, headers, ...fetchOptions } = options;

  const response = await fetch(buildUrl(path), {
    ...fetchOptions,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Request failed"));
  }

  return payload;
}
