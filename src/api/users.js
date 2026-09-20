import { getAccessToken } from "./auth.js";
import { apiRequest } from "./client.js";

function unwrapData(payload) {
  return payload?.data ?? payload;
}

function getToken() {
  const token = getAccessToken();

  if (!token) {
    throw new Error("You need to sign in again.");
  }

  return token;
}

export async function getUsers() {
  const payload = await apiRequest("/api/users/", {
    method: "GET",
    token: getToken(),
  });

  return unwrapData(payload);
}

export async function createUser(data) {
  const payload = await apiRequest("/api/users/", {
    method: "POST",
    token: getToken(),
    body: data,
  });

  return unwrapData(payload);
}

export async function updateUser(id, data) {
  const payload = await apiRequest(`/api/users/${id}/`, {
    method: "PATCH",
    token: getToken(),
    body: data,
  });

  return unwrapData(payload);
}
