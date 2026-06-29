require("dotenv").config({ path: "./.env" });
const { getSupabase } = require("../config/supabase");

async function main() {
  const supabase = getSupabase();
  for (const table of ["users", "franchises", "elections", "voter_groups"]) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    console.log("\n===", table, "===");
    if (error) console.log("ERROR", error.message);
    else console.log(JSON.stringify(data?.[0] ?? null, null, 2));
  }
}

main().catch(console.error);
