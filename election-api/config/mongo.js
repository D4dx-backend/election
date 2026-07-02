const mongoose = require("mongoose");

let connected = false;

async function connectMongo() {
  const uri = (process.env.MONGO_URI || "").trim();
  if (!uri) return false;
  if (connected) return true;

  await mongoose.connect(uri);
  connected = true;
  console.log("\x1b[36m%s\x1b[0m", "MongoDB connected (legacy elections)");
  return true;
}

function isMongoEnabled() {
  return Boolean((process.env.MONGO_URI || "").trim());
}

module.exports = { connectMongo, isMongoEnabled };
