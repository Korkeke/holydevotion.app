import { auth } from "../firebase";

const BASE_URL = "https://devotion-backend-production.up.railway.app";

export async function api(path, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Token expired or invalid — redirect to login
    window.location.href = "/portal/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export function get(path) {
  return api(path);
}

export function post(path, body) {
  return api(path, { method: "POST", body: JSON.stringify(body) });
}

export function put(path, body) {
  return api(path, { method: "PUT", body: JSON.stringify(body) });
}

export function del(path) {
  return api(path, { method: "DELETE" });
}
