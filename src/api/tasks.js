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

export async function getTasks(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });

  const path = query.toString() ? `/api/tasks/?${query.toString()}` : "/api/tasks/";
  const payload = await apiRequest(path, {
    method: "GET",
    token: getToken(),
  });

  return unwrapData(payload);
}

export async function createTask(data) {
  const payload = await apiRequest("/api/tasks/", {
    method: "POST",
    token: getToken(),
    body: data,
  });

  return unwrapData(payload);
}

export async function updateTask(id, data) {
  const payload = await apiRequest(`/api/tasks/${id}/`, {
    method: "PATCH",
    token: getToken(),
    body: data,
  });

  return unwrapData(payload);
}

export async function deleteTask(id) {
  const payload = await apiRequest(`/api/tasks/${id}/`, {
    method: "DELETE",
    token: getToken(),
  });

  return unwrapData(payload);
}
