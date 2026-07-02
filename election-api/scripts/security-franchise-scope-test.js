/**
 * Franchise scope security regression test.
 *
 * Verifies cross-franchise access is blocked for franchise admins.
 *
 * Usage:
 *   npm run security:test:franchise
 *
 * Required env (can be set in election-api/.env):
 *   SCOPE_ADMIN_A_USERNAME
 *   SCOPE_ADMIN_A_PASSWORD
 *   SCOPE_ADMIN_B_USERNAME
 *   SCOPE_ADMIN_B_PASSWORD
 *
 * Optional:
 *   SCOPE_API_URL (default: http://localhost:${PORT||8000})
 */
require("dotenv").config({ path: "./.env" });

const BASE = (process.env.SCOPE_API_URL || `http://localhost:${process.env.PORT || 8000}`).replace(/\/$/, "");
const ADMIN_A_USER = process.env.SCOPE_ADMIN_A_USERNAME;
const ADMIN_A_PASS = process.env.SCOPE_ADMIN_A_PASSWORD;
const ADMIN_B_USER = process.env.SCOPE_ADMIN_B_USERNAME;
const ADMIN_B_PASS = process.env.SCOPE_ADMIN_B_PASSWORD;

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
}

async function request(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

async function login(username, password) {
  const { res, json } = await request("POST", "/api/v1/auth/login", {
    body: { username, password },
  });
  if (!res.ok || !json.token) {
    throw new Error(json.message || `Login failed for ${username}`);
  }
  return { token: json.token, user: json.user || null };
}

async function getFirst(path, token, label) {
  const { res, json } = await request("GET", path, { token });
  if (!res.ok) throw new Error(`${label} list failed: ${res.status} ${json.message || ""}`.trim());
  const list = Array.isArray(json.data) ? json.data : [];
  return list[0] || null;
}

async function expectStatus(path, token, expected, label) {
  const { res, json } = await request("GET", path, { token });
  const ok = res.status === expected;
  record(label, ok, `got ${res.status}${json?.message ? ` (${json.message})` : ""}`);
  return ok;
}

async function main() {
  requireEnv("SCOPE_ADMIN_A_USERNAME", ADMIN_A_USER);
  requireEnv("SCOPE_ADMIN_A_PASSWORD", ADMIN_A_PASS);
  requireEnv("SCOPE_ADMIN_B_USERNAME", ADMIN_B_USER);
  requireEnv("SCOPE_ADMIN_B_PASSWORD", ADMIN_B_PASS);

  console.log(`Franchise scope test against ${BASE}\n`);

  const { token: tokenA, user: userA } = await login(ADMIN_A_USER, ADMIN_A_PASS);
  const { token: tokenB, user: userB } = await login(ADMIN_B_USER, ADMIN_B_PASS);

  record("Admin A login", true, ADMIN_A_USER);
  record("Admin B login", true, ADMIN_B_USER);

  if (!userA?.franchiseId || !userB?.franchiseId) {
    throw new Error("Both test admins must have franchiseId.");
  }
  if (String(userA.franchiseId) === String(userB.franchiseId)) {
    throw new Error("Test admins must belong to different franchises.");
  }

  const franchiseB = await getFirst("/api/v1/franchise", tokenB, "franchise");
  const electionGroupB = await getFirst("/api/v1/electionGroup", tokenB, "electionGroup");
  const voterGroupB = await getFirst("/api/v1/voterGroup", tokenB, "voterGroup");
  const nomineeB = await getFirst("/api/v1/nominee", tokenB, "nominee");
  const auditB = await getFirst("/api/v1/auditLog?page=1&limit=10", tokenB, "auditLog");

  if (franchiseB?._id) {
    await expectStatus(`/api/v1/franchise/${franchiseB._id}`, tokenA, 403, "A cannot view B franchise");
  } else {
    record("A cannot view B franchise", true, "skipped (no B franchise)");
  }

  if (electionGroupB?._id) {
    await expectStatus(`/api/v1/electionGroup/${electionGroupB._id}`, tokenA, 403, "A cannot view B election group");
  } else {
    record("A cannot view B election group", true, "skipped (no B election group)");
  }

  if (voterGroupB?._id) {
    await expectStatus(`/api/v1/voterGroup/${voterGroupB._id}`, tokenA, 403, "A cannot view B voter group");
    await expectStatus(`/api/v1/voterGroup/${voterGroupB._id}/voters`, tokenA, 403, "A cannot list B group voters");
  } else {
    record("A cannot view B voter group", true, "skipped (no B voter group)");
    record("A cannot list B group voters", true, "skipped (no B voter group)");
  }

  if (nomineeB?._id) {
    await expectStatus(`/api/v1/nominee/${nomineeB._id}`, tokenA, 403, "A cannot view B nominee");
  } else {
    record("A cannot view B nominee", true, "skipped (no B nominee)");
  }

  if (auditB?._id) {
    await expectStatus(`/api/v1/auditLog/${auditB._id}`, tokenA, 403, "A cannot read B audit log");
  } else {
    record("A cannot read B audit log", true, "skipped (no B audit log)");
  }

  // Positive checks for same-franchise visibility on admin A
  const { res: ownFrRes, json: ownFrJson } = await request("GET", `/api/v1/franchise/${userA.franchiseId}`, {
    token: tokenA,
  });
  record("A can view own franchise", ownFrRes.ok, `${ownFrRes.status}${ownFrJson?.message ? ` (${ownFrJson.message})` : ""}`);

  const { res: ownAuditRes } = await request("GET", "/api/v1/auditLog?page=1&limit=10", { token: tokenA });
  record("A can list own audit logs", ownAuditRes.ok, String(ownAuditRes.status));

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed.`);
}

main().catch((err) => {
  console.error("Scope security test crashed:", err.message || err);
  process.exit(1);
});
