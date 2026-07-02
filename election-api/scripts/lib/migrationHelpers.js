const crypto = require("crypto");

function extractList(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.elections)) return json.elections;
  return [];
}

function entityId(value) {
  if (value == null) return null;
  if (typeof value === "object") return String(value._id || value.id || "");
  return String(value);
}

function toIsoDate(value) {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function createIdMapper() {
  const map = new Map();
  return {
    map(oldId, existingNewId) {
      const key = entityId(oldId);
      if (!key) return null;
      if (existingNewId) {
        map.set(key, String(existingNewId));
        return String(existingNewId);
      }
      if (!map.has(key)) map.set(key, crypto.randomUUID());
      return map.get(key);
    },
    get(oldId) {
      const key = entityId(oldId);
      return key ? map.get(key) || null : null;
    },
    entries() {
      return [...map.entries()];
    },
  };
}

async function apiLogin(baseUrl, username, password) {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || `Login failed (${res.status})`);
  }
  if (!json.token) throw new Error("Login response missing token");
  return json.token;
}

async function apiGet(baseUrl, token, path) {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || `GET ${path} failed (${res.status})`);
  }
  return json;
}

async function fetchAllPaginated(baseUrl, token, path, { pageSize = 100 } = {}) {
  const all = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const sep = path.includes("?") ? "&" : "?";
    const json = await apiGet(baseUrl, token, `${path}${sep}page=${page}&pageSize=${pageSize}&limit=${pageSize}`);
    const batch = extractList(json);
    all.push(...batch);
    const pagination = json.pagination || {};
    totalPages = pagination.totalPages || pagination.pages || 1;
    if (!batch.length) break;
    page += 1;
    if (page > 200) break;
  }
  return all;
}

module.exports = {
  extractList,
  entityId,
  toIsoDate,
  createIdMapper,
  apiLogin,
  apiGet,
  fetchAllPaginated,
};
