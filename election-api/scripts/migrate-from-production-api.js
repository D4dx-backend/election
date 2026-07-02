/**
 * Migrate data from legacy production election-api (Mongo IDs) into Supabase.
 *
 * Requires in election-api/.env:
 *   MIGRATION_SOURCE_API_URL=https://election-api-vbpil.ondigitalocean.app
 *   MIGRATION_USERNAME=<production admin username>
 *   MIGRATION_PASSWORD=<production password>
 *
 * Usage: node scripts/migrate-from-production-api.js
 */
require("dotenv").config({ path: "./.env" });
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { getSupabase } = require("../config/supabase");
const {
  entityId,
  toIsoDate,
  createIdMapper,
  apiLogin,
  fetchAllPaginated,
  extractList,
} = require("./lib/migrationHelpers");
const {
  franchiseToRow,
  electionToRow,
  nomineeToRow,
  userToRow,
  voterGroupToRow,
  electionGroupToRow,
} = require("../lib/supabase/map");

const SOURCE = (process.env.MIGRATION_SOURCE_API_URL || "").trim();
const USERNAME = (process.env.MIGRATION_USERNAME || "").trim();
const PASSWORD = process.env.MIGRATION_PASSWORD || "";

async function upsertByUsername(supabase, row, id) {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .ilike("username", row.username)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await supabase.from("users").insert({ ...row, id }).select("id").single();
  if (error) throw error;
  return data.id;
}

async function main() {
  if (!SOURCE || !USERNAME || !PASSWORD) {
    console.error(
      "Missing migration credentials. Add to election-api/.env:\n" +
        "  MIGRATION_SOURCE_API_URL=https://election-api-vbpil.ondigitalocean.app\n" +
        "  MIGRATION_USERNAME=your_production_username\n" +
        "  MIGRATION_PASSWORD=your_production_password\n\n" +
        "Then run: node scripts/migrate-from-production-api.js\n" +
        "Or seed local test data: npm run seed:smoke"
    );
    process.exit(1);
  }

  console.log("Logging into production API…");
  const token = await apiLogin(SOURCE, USERNAME, PASSWORD);
  const supabase = getSupabase();
  const ids = createIdMapper();
  const report = { migratedAt: new Date().toISOString(), counts: {}, passwordResets: [] };

  console.log("Fetching franchises…");
  const franchises = extractList(await fetchAllPaginated(SOURCE, token, "/api/v1/franchise"));
  for (const f of franchises) {
    const newId = ids.map(f._id || f.id);
    const row = franchiseToRow({
      name: f.name,
      status: f.status || "active",
      settings: f.settings || {},
      websiteUrl: f.websiteUrl,
      contactNumber: f.contactNumber,
      logo: f.logo,
    });
    row.id = newId;
    row.created_at = toIsoDate(f.createdAt);
    const { error } = await supabase.from("franchises").upsert(row, { onConflict: "id" });
    if (error) throw error;
  }
  report.counts.franchises = franchises.length;

  console.log("Fetching elections…");
  const elections = extractList(await fetchAllPaginated(SOURCE, token, "/api/v1/election"));
  for (const e of elections) {
    const newId = ids.map(e._id || e.id);
    const row = electionToRow({
      franchiseId: ids.get(e.franchiseId) || ids.map(e.franchiseId),
      organization: e.organization || e.title,
      title: e.title,
      electionDate: e.electionDate,
      numberToBeElected: e.numberToBeElected || e.maxNominees || 1,
      nomineeDisplayOrder: e.nomineeDisplayOrder,
      maxVoters: e.maxVoters,
      maxNominees: e.maxNominees,
      genderBasedSelection: e.genderBasedSelection,
      maleMinimum: e.maleMinimum,
      femaleMinimum: e.femaleMinimum,
      selfRegOpen: e.selfRegOpen,
      votingOpen: e.votingOpen,
      resultsPublished: e.resultsPublished,
      resultsPublishedAt: e.resultsPublishedAt,
      voterResultDisplay: e.voterResultDisplay,
      adminVotingDetailsEnabled: e.adminVotingDetailsEnabled,
      manualWinnerSelection: e.manualWinnerSelection,
      manualWinnerIds: (e.manualWinnerIds || []).map((x) => ids.get(x) || ids.map(x)),
      status: e.status,
      logo: e.logo,
      createdBy: ids.get(e.createdBy),
    });
    row.id = newId;
    row.created_at = toIsoDate(e.createdAt);
    const { error } = await supabase.from("elections").upsert(row, { onConflict: "id" });
    if (error) throw error;
  }
  report.counts.elections = elections.length;

  console.log("Fetching nominees…");
  const nominees = extractList(await fetchAllPaginated(SOURCE, token, "/api/v1/nominee"));
  for (const n of nominees) {
    const electionId = ids.get(n.electionId);
    if (!electionId) continue;
    const newId = ids.map(n._id || n.id);
    const row = nomineeToRow({
      electionId,
      name: n.name,
      gender: n.gender,
      position: n.position,
      bio: n.bio || n.description,
      status: n.status || "active",
      photo: n.photo || (n.photoUrl ? { url: n.photoUrl, alt: n.photoAlt } : undefined),
    });
    row.id = newId;
    row.created_at = toIsoDate(n.createdAt);
    const { error } = await supabase.from("nominees").upsert(row, { onConflict: "id" });
    if (error) throw error;
  }
  report.counts.nominees = nominees.length;

  console.log("Fetching voters…");
  const voters = extractList(await fetchAllPaginated(SOURCE, token, "/api/v1/user/voters", { pageSize: 200 }));
  for (const v of voters) {
    const newId = ids.map(v._id || v.id);
    let password = v.password;
    if (!password) {
      password = await bcrypt.hash("changeme123", 10);
      report.passwordResets.push({ username: v.username, tempPassword: "changeme123" });
    }
    const row = userToRow({
      username: v.username,
      password,
      email: v.email,
      fullName: v.fullName,
      role: v.role || "voter",
      franchiseId: ids.get(v.franchiseId),
      registrationNumber: v.registrationNumber,
      status: v.status || "active",
      isVoter: v.isVoter !== false,
      onboardingCompleted: v.onboardingCompleted,
      voterMetadata: v.voterMetadata,
      createdBy: ids.get(v.createdBy),
    });
    row.id = newId;
    row.created_at = toIsoDate(v.createdAt);
    const insertedId = await upsertByUsername(supabase, row, newId);
    ids.map(v._id || v.id, insertedId);

    const access = (v.electionAccess || []).map((eid) => ids.get(eid)).filter(Boolean);
    if (access.length) {
      const accessRows = access.map((electionId) => ({ user_id: insertedId, election_id: electionId }));
      await supabase.from("user_election_access").upsert(accessRows, {
        onConflict: "user_id,election_id",
        ignoreDuplicates: true,
      });
    }
  }
  report.counts.voters = voters.length;

  console.log("Fetching votes…");
  let votes = [];
  try {
    votes = extractList(await fetchAllPaginated(SOURCE, token, "/api/v1/vote", { pageSize: 200 }));
  } catch (err) {
    console.warn("Votes skipped:", err.message);
  }
  for (const v of votes) {
    const electionId = ids.get(v.electionId);
    const voterId = ids.get(v.voterId);
    if (!electionId || !voterId) continue;
    const newId = ids.map(v._id || v.id);
    const voteRow = {
      id: newId,
      election_id: electionId,
      voter_id: voterId,
      ip_address: v.ipAddress || null,
      device_info: v.deviceInfo || null,
      status: v.status || "completed",
      voted_at: toIsoDate(v.timestamp || v.createdAt),
      created_at: toIsoDate(v.createdAt || v.timestamp),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("votes").upsert(voteRow, { onConflict: "id" });
    if (error && error.code !== "23505") throw error;

    const nomineeIds = (v.nominees || []).map((n) => ids.get(typeof n === "object" ? n._id || n.id : n)).filter(Boolean);
    if (nomineeIds.length) {
      await supabase.from("vote_nominees").delete().eq("vote_id", newId);
      await supabase.from("vote_nominees").insert(
        nomineeIds.map((nomineeId) => ({ vote_id: newId, nominee_id: nomineeId }))
      );
    }
  }
  report.counts.votes = votes.length;

  const outPath = path.join(__dirname, "migration-id-map.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify({ idMap: ids.entries(), report }, null, 2)
  );

  console.log("\nMigration complete.");
  console.log(JSON.stringify(report, null, 2));
  console.log(`ID map saved to ${outPath}`);
  if (report.passwordResets.length) {
    console.warn("\nSome users had no password hash in API — temp password changeme123 was set for:");
    report.passwordResets.slice(0, 20).forEach((r) => console.warn(`  - ${r.username}`));
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message || err);
  process.exit(1);
});
