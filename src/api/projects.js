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

export async function getProjects() {
  const payload = await apiRequest("/api/projects/", {
    method: "GET",
    token: getToken(),
  });

  return unwrapData(payload);
}

export async function createProject(data) {
  const payload = await apiRequest("/api/projects/", {
    method: "POST",
    token: getToken(),
    body: data,
  });

  return unwrapData(payload);
}

export async function updateProject(id, data) {
  const payload = await apiRequest(`/api/projects/${id}/`, {
    method: "PATCH",
    token: getToken(),
    body: data,
  });

  return unwrapData(payload);
}

export async function deleteProject(id) {
  const payload = await apiRequest(`/api/projects/${id}/`, {
    method: "DELETE",
    token: getToken(),
  });

  return unwrapData(payload);
}
