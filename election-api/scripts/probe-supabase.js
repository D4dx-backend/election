require("dotenv").config({ path: "./.env" });
const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key);

async function main() {
  const tables = [
    "users",
    "franchises",
    "elections",
    "nominees",
    "votes",
    "election_groups",
    "voter_groups",
    "election_analytics",
    "audit_logs",
    "user_election_access",
    "voter_group_members",
    "voter_group_elections",
  ];
  for (const table of tables) {
    const { error, count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });
    console.log(table, error ? `ERROR: ${error.message}` : `OK (${count ?? 0} rows)`);
  }
}

main().catch(console.error);
