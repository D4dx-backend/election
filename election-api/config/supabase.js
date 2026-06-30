const { createClient } = require("@supabase/supabase-js");

let client;

function getSupabaseUrl() {
  return (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).trim();
}

function getSupabaseServiceKey() {
  return (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
}

function getSupabase() {
  if (client) return client;

  const url = getSupabaseUrl();
  const key = getSupabaseServiceKey();

  if (!url || !key) {
    throw new Error(
      "Missing Supabase config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in election-api/.env"
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}

module.exports = { getSupabase, getSupabaseUrl, getSupabaseServiceKey };
