const mongoose = require("mongoose");
const dns = require("dns");

// Node.js's libuv DNS resolver can fail to resolve MongoDB SRV records on some
// Windows network configurations. Explicitly using Google's public DNS fixes this.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

// Ensure the email_1 index is sparse so multiple users with null email are allowed.
const runMigrations = async () => {
  try {
    const users = mongoose.connection.collection("users");
    const indexes = await users.indexes();
    const emailIndex = indexes.find((idx) => idx.name === "email_1");
    if (emailIndex && !emailIndex.sparse) {
      await users.dropIndex("email_1");
      await users.createIndex({ email: 1 }, { unique: true, sparse: true, name: "email_1" });
      console.log("DB migration: email_1 index updated to sparse.");
    }
  } catch (migrationError) {
    console.error("DB migration error:", migrationError.message || migrationError);
  }
};

const connectDB = async () => {
  const URL = process.env.MONGO_URI;
  if (!URL) {
    console.error("MONGO_URI is not set in environment variables.");
    return;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const conn = await mongoose.connect(URL, {
        serverSelectionTimeoutMS: 10000,
        family: 4, // Force IPv4 to avoid SRV DNS resolution failures on some networks
      });

      // Run migrations before the server starts accepting requests
      await runMigrations();

      console.log(
        "\x1b[36m%s\x1b[0m",
        `MongoDB Connected: ${conn.connection.host}`
      );
      return; // success — stop retrying
    } catch (error) {
      console.error(`mongoose connection error (attempt ${attempt}/${MAX_RETRIES + 1}):`, error.message || error);
      if (attempt <= MAX_RETRIES) {
        console.log(`Retrying DB connection in ${RETRY_INTERVAL_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      } else {
        console.error("Failed to connect to MongoDB after maximum retries. Server will continue running without DB.");
      }
    }
  }
};

module.exports = connectDB;
