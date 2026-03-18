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

  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    // Token might be stale (common right after signup). Try refreshing once.
    try {
      const freshToken = await user.getIdToken(true); // force refresh
      const retryRes = await fetch(url, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${freshToken}` },
      });
      if (retryRes.ok) {
        if (retryRes.status === 204) return null;
        return retryRes.json();
      }
      // Retry also got 401 — token is genuinely invalid
    } catch {
      // Refresh failed entirely
    }

    // Only hard-redirect if we're sure the session is expired
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
