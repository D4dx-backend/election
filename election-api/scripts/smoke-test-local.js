/**
 * Authenticated smoke tests against local election-api (Supabase).
 * Usage: npm run smoke:test
 */
require("dotenv").config({ path: "./.env" });

const BASE = (process.env.SMOKE_API_URL || `http://localhost:${process.env.PORT || 8000}`).replace(/\/$/, "");
const ADMIN_USER = process.env.SMOKE_USERNAME || "admin";
const ADMIN_PASS = process.env.SMOKE_PASSWORD || process.env.SEED_ADMIN_PASSWORD || "SmokeTest123!";
const VOTER_USER = process.env.SMOKE_VOTER_USERNAME || "smokevoter1";
const VOTER_PASS = process.env.SMOKE_VOTER_PASSWORD || process.env.SEED_VOTER_PASSWORD || "voter1234";

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  const icon = ok ? "PASS" : "FAIL";
  console.log(`${icon}  ${name}${detail ? ` — ${detail}` : ""}`);
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
  return json.token;
}

async function main() {
  console.log(`Smoke testing ${BASE}\n`);

  const { res: healthRes } = await request("GET", "/health");
  record("Health check", healthRes.ok, String(healthRes.status));

  let adminToken;
  try {
    adminToken = await login(ADMIN_USER, ADMIN_PASS);
    record("Admin login", true, ADMIN_USER);
  } catch (err) {
    record("Admin login", false, err.message);
    printSummary();
    process.exit(1);
  }

  const { res: meRes, json: meJson } = await request("GET", "/api/v1/auth/me", { token: adminToken });
  record("GET /auth/me", meRes.ok && meJson.user?.username, meJson.user?.role);

  const { res: electionsRes, json: electionsJson } = await request("GET", "/api/v1/election", { token: adminToken });
  const elections = Array.isArray(electionsJson.data) ? electionsJson.data : [];
  record("GET /election (list)", electionsRes.ok, `${elections.length} election(s)`);

  const electionId = elections[0]?._id || elections[0]?.id;
  if (electionId) {
    const { res: eRes } = await request("GET", `/api/v1/election/${electionId}`, { token: adminToken });
    record("GET /election/:id", eRes.ok, electionId);

    const { res: nRes, json: nJson } = await request("GET", `/api/v1/nominee/election/${electionId}`, {
      token: adminToken,
    });
    const nominees = Array.isArray(nJson.data) ? nJson.data : Array.isArray(nJson) ? nJson : [];
    record("GET /nominee/election/:id", nRes.ok, `${nominees.length} nominee(s)`);

    const { res: vRes, json: vJson } = await request("GET", "/api/v1/user/voters?pageSize=50", { token: adminToken });
    const voters = Array.isArray(vJson.data) ? vJson.data : [];
    record("GET /user/voters", vRes.ok, `${voters.length} voter(s)`);

    const { res: rRes } = await request("GET", `/api/v1/vote/results/${electionId}`, { token: adminToken });
    record("GET /vote/results/:electionId", rRes.ok);

    const { res: notifRes } = await request("GET", "/api/v1/notifications", { token: adminToken });
    record("GET /notifications", notifRes.ok, String(notifRes.status));
  } else {
    record("GET /election/:id", false, "No elections — run npm run seed:smoke");
    record("GET /nominee/election/:id", false, "skipped");
    record("GET /user/voters", false, "skipped");
  }

  const { res: frRes, json: frJson } = await request("GET", "/api/v1/franchise", { token: adminToken });
  const franchises = Array.isArray(frJson.data) ? frJson.data : [];
  record("GET /franchise", frRes.ok, `${franchises.length} franchise(s)`);

  const { res: vgRes } = await request("GET", "/api/v1/voterGroup", { token: adminToken });
  record("GET /voterGroup", vgRes.ok, String(vgRes.status));

  let voterToken;
  try {
    voterToken = await login(VOTER_USER, VOTER_PASS);
    record("Voter login", true, VOTER_USER);
  } catch (err) {
    record("Voter login", false, err.message);
    voterToken = null;
  }

  if (voterToken && electionId) {
    const { res: availRes, json: availJson } = await request("GET", "/api/v1/vote/available-elections", {
      token: voterToken,
    });
    const available = Array.isArray(availJson.data) ? availJson.data : [];
    record("GET /vote/available-elections", availRes.ok, `${available.length} available`);

    const { res: statusRes } = await request("GET", "/api/v1/vote/voter-status", { token: voterToken });
    record("GET /vote/voter-status", statusRes.ok);
  }

  printSummary();
  const failed = results.filter((r) => !r.ok).length;
  process.exit(failed ? 1 : 0);
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} checks passed.`);
}

main().catch((err) => {
  console.error("Smoke test crashed:", err.message || err);
  process.exit(1);
});
