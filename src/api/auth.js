import { apiRequest } from "./client.js";

export const ACCESS_TOKEN_KEY = "taskflow_access_token";
export const REFRESH_TOKEN_KEY = "taskflow_refresh_token";
export const USER_KEY = "taskflow_user";

function getStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function unwrapData(payload) {
  return payload?.data ?? payload;
}

function getTokenData(payload) {
  const data = unwrapData(payload);
  const accessToken = data?.access;
  const refreshToken = data?.refresh;

  if (!accessToken || !refreshToken) {
    throw new Error("Login succeeded, but tokens were missing from the response.");
  }

  return { accessToken, refreshToken };
}

export async function login({ username, password }) {
  const payload = await apiRequest("/api/auth/login/", {
    method: "POST",
    body: {
      username,
      email: username,
      password,
    },
  });

  return {
    payload,
    ...getTokenData(payload),
  };
}

export async function fetchCurrentUser(accessToken) {
  const payload = await apiRequest("/api/auth/me/", {
    method: "GET",
    token: accessToken,
  });

  return unwrapData(payload);
}

export async function logoutFromServer() {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  if (!accessToken) {
    return null;
  }

  const payload = await apiRequest("/api/auth/logout/", {
    method: "POST",
    token: accessToken,
    body: {
      refresh: refreshToken,
    },
  });

  return unwrapData(payload);
}

export function saveAuthSession({ accessToken, refreshToken, user }) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (accessToken) {
    storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  if (user) {
    storage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getAccessToken() {
  return getStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export function getRefreshToken() {
  return getStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export function getStoredUser() {
  const storedUser = getStorage()?.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

export function getStoredUserRole() {
  return getStoredUser()?.role ?? null;
}

export function getStoredUserModules() {
  return getStoredUser()?.modules ?? [];
}

export function hasModuleAccess(moduleName, user = getStoredUser()) {
  return user?.modules?.includes(moduleName) ?? false;
}

export function getDefaultAuthenticatedPath(user = getStoredUser()) {
  if (hasModuleAccess("projects", user)) {
    return "/projects";
  }

  if (hasModuleAccess("tasks", user)) {
    return "/tasks";
  }

  return "/login";
}

export function getUserInitials(user) {
  if (!user) {
    return "";
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  const source = fullName || user.username || user.email || "";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);

  if (!parts.length) {
    return "";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function clearAuthSession() {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(USER_KEY);
}

export function logout(navigate) {
  clearAuthSession();
  navigate("/login", { replace: true });
}
