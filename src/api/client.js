const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const inflightGetRequests = new Map();

export class ApiError extends Error {
  constructor(message, { status, payload } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

function getMethod(method) {
  return (method || "GET").toUpperCase();
}

function getTokenFingerprint(token) {
  if (!token) {
    return "anonymous";
  }

  let hash = 0;

  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}

function getNormalizedUrl(url) {
  const parsedUrl = new URL(url);
  const sortedParams = [...parsedUrl.searchParams.entries()].sort(([keyA, valueA], [keyB, valueB]) => {
    if (keyA === keyB) {
      return valueA.localeCompare(valueB);
    }

    return keyA.localeCompare(keyB);
  });

  parsedUrl.search = "";
  sortedParams.forEach(([key, value]) => {
    parsedUrl.searchParams.append(key, value);
  });

  return parsedUrl.toString();
}

function getInflightGetKey({ method, url, token }) {
  return [
    method,
    getNormalizedUrl(url),
    getTokenFingerprint(token),
  ].join(":");
}

function createAbortError() {
  if (typeof DOMException !== "undefined") {
    return new DOMException("The operation was aborted.", "AbortError");
  }

  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
}

function attachConsumerAbort(promise, signal) {
  if (!signal) {
    return promise;
  }

  if (signal.aborted) {
    return Promise.reject(createAbortError());
  }

  return new Promise((resolve, reject) => {
    function handleAbort() {
      reject(createAbortError());
    }

    signal.addEventListener("abort", handleAbort, { once: true });

    promise
      .then(resolve, reject)
      .finally(() => {
        signal.removeEventListener("abort", handleAbort);
      });
  });
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

async function fetchPayload(url, { body, token, headers, fetchOptions }) {
  const response = await fetch(url, {
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
    throw new ApiError(getErrorMessage(payload, "Request failed"), {
      status: response.status,
      payload,
    });
  }

  return payload;
}

export function clearInflightGetRequests() {
  inflightGetRequests.clear();
}

export async function apiRequest(path, options = {}) {
  const { body, token, headers, signal, ...fetchOptions } = options;
  const method = getMethod(fetchOptions.method);
  const url = buildUrl(path);

  if (method !== "GET") {
    return fetchPayload(url, {
      body,
      token,
      headers,
      fetchOptions: {
        ...fetchOptions,
        method,
        signal,
      },
    });
  }

  const key = getInflightGetKey({ method, url, token });

  if (!inflightGetRequests.has(key)) {
    const request = fetchPayload(url, {
      body,
      token,
      headers,
      fetchOptions: {
        ...fetchOptions,
        method,
      },
    }).finally(() => {
      inflightGetRequests.delete(key);
    });

    inflightGetRequests.set(key, request);
  }

  return attachConsumerAbort(inflightGetRequests.get(key), signal);
}
