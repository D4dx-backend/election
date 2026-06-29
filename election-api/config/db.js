const { getSupabase } = require("./supabase");

const connectDB = async () => {
  const supabase = getSupabase();
  const { error } = await supabase.from("users").select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(`Supabase connection failed: ${error.message}`);
  }

  console.log("\x1b[36m%s\x1b[0m", "Supabase connected");
};

module.exports = connectDB;
