const { getSupabase } = require("./supabase");
const { connectMongo, isMongoEnabled } = require("./mongo");

const connectDB = async () => {
  if (isMongoEnabled()) {
    await connectMongo();
  }

  const supabase = getSupabase();
  const { error } = await supabase.from("users").select("id", { count: "exact", head: true });

  if (error) {
    if (!isMongoEnabled()) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    console.warn("\x1b[33m%s\x1b[0m", `Supabase unavailable (${error.message}); using MongoDB for legacy data`);
    return;
  }

  console.log("\x1b[36m%s\x1b[0m", "Supabase connected");
};

module.exports = connectDB;
