/**
 * Seed Supabase with realistic test data for local smoke testing.
 * Usage: node scripts/seed-smoke-data.js
 */
require("dotenv").config({ path: "./.env" });
const bcrypt = require("bcryptjs");
const franchises = require("../lib/supabase/franchises");
const elections = require("../lib/supabase/elections");
const nominees = require("../lib/supabase/nominees");
const users = require("../lib/supabase/users");
const voterGroups = require("../lib/supabase/voterGroups");

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "SmokeTest123!";
const VOTER_PASSWORD = process.env.SEED_VOTER_PASSWORD || "voter1234";
const FRANCHISE_ADMIN_PASSWORD = process.env.SEED_FRANCHISE_PASSWORD || "hello1234";

async function ensureAdminPassword() {
  const admin = await users.findByUsername("admin");
  if (!admin) throw new Error("No admin user in Supabase. Create one first.");
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await users.updateById(admin._id, { password: hash, status: "active" });
  return admin;
}

async function main() {
  console.log("Seeding Supabase smoke-test data…\n");
  const admin = await ensureAdminPassword();

  let franchiseList = (await franchises.findAll({})).franchises;
  let franchise = franchiseList[0];
  if (!franchise) {
    franchise = await franchises.create({ name: "Smoke Test Franchise", status: "active" });
  }

  let franchiseAdmin = await users.findByUsername("hello");
  if (!franchiseAdmin) {
    franchiseAdmin = await users.create({
      username: "hello",
      password: await bcrypt.hash(FRANCHISE_ADMIN_PASSWORD, 10),
      fullName: "Hello Franchise Admin",
      role: "franchise_admin",
      franchiseId: franchise._id,
      status: "active",
      createdBy: admin._id,
    });
  }

  const electionDate = new Date();
  electionDate.setMonth(electionDate.getMonth() + 1);
  const dateStr = electionDate.toISOString().split("T")[0];

  const election = await elections.create({
    franchiseId: franchise._id,
    organization: "Smoke Test Organization",
    title: "Smoke Test Organization",
    electionDate: dateStr,
    numberToBeElected: 2,
    maxNominees: 2,
    maxVoters: 50,
    nomineeDisplayOrder: "ALPHA",
    voterResultDisplay: "full",
    genderBasedSelection: true,
    maleMinimum: 1,
    femaleMinimum: 1,
    selfRegOpen: false,
    votingOpen: true,
    adminVotingDetailsEnabled: true,
    manualWinnerSelection: false,
    status: "active",
    createdBy: franchiseAdmin._id,
  });

  const nomineePayloads = [
    { name: "Alice Anderson", gender: "female" },
    { name: "Bob Brown", gender: "male" },
    { name: "Carol Chen", gender: "female" },
    { name: "David Diaz", gender: "male" },
  ];
  const createdNominees = await nominees.insertMany(
    nomineePayloads.map((n) => ({ ...n, electionId: election._id }))
  );

  const voterGroup = await voterGroups.create({
    franchiseId: franchise._id,
    name: "Smoke Test Voters",
    description: "Auto-seeded voter group for local testing",
    prefix: "SMK",
    startingNumber: 1001,
    createdBy: franchiseAdmin._id,
    voters: [],
    elections: [],
  });

  const voterHash = await bcrypt.hash(VOTER_PASSWORD, 10);
  const voterRecords = [];
  for (let i = 0; i < 5; i++) {
    const username = `smokevoter${i + 1}`;
    let voter = await users.findByUsername(username);
    if (!voter) {
      voter = await users.create({
        username,
        password: voterHash,
        fullName: `Smoke Voter ${i + 1}`,
        role: "voter",
        franchiseId: franchise._id,
        isVoter: true,
        status: "active",
        registrationNumber: `SMK${1001 + i}`,
        electionAccess: [election._id],
        voterMetadata: { prefix: "SMK", sequenceNumber: 1001 + i },
        createdBy: franchiseAdmin._id,
      });
    } else {
      await users.addElectionAccessToUsers([voter._id], [election._id]);
    }
    voterRecords.push(voter);
  }

  await voterGroups.addVotersToGroup(
    voterGroup._id,
    voterRecords.map((v) => v._id)
  );
  const { getSupabase } = require("../config/supabase");
  await getSupabase().from("voter_group_elections").upsert(
    [{ voter_group_id: voterGroup._id, election_id: election._id }],
    { onConflict: "voter_group_id,election_id", ignoreDuplicates: true }
  );
  await voterGroups.syncGroupVotersAccess({
    voters: voterRecords.map((v) => v._id),
    elections: [election._id],
  });

  const summary = {
    franchise: { id: franchise._id, name: franchise.name },
    election: { id: election._id, organization: election.organization, date: dateStr },
    nominees: createdNominees.length,
    voters: voterRecords.map((v) => v.username),
    voterGroup: { id: voterGroup._id, name: voterGroup.name },
    credentials: {
      super_admin: { username: "admin", password: ADMIN_PASSWORD },
      franchise_admin: { username: "hello", password: FRANCHISE_ADMIN_PASSWORD },
      voters: voterRecords.map((v) => ({ username: v.username, password: VOTER_PASSWORD })),
    },
  };

  console.log(JSON.stringify(summary, null, 2));
  console.log("\nSeed complete. Run: npm run smoke:test");
}

main().catch((err) => {
  console.error("Seed failed:", err.message || err);
  process.exit(1);
});
