/**
 * Reset a user's password in Supabase (local/dev use).
 * Usage: node scripts/reset-user-password.js <username> <newPassword>
 */
require("dotenv").config({ path: "./.env" });
const bcrypt = require("bcryptjs");
const users = require("../lib/supabase/users");

async function main() {
  const username = process.argv[2];
  const newPassword = process.argv[3];

  if (!username || !newPassword) {
    console.error("Usage: node scripts/reset-user-password.js <username> <newPassword>");
    process.exit(1);
  }

  if (String(newPassword).length < 6) {
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }

  const user = await users.findByUsername(username);
  if (!user) {
    console.error(`User not found: ${username}`);
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(String(newPassword), 10);
  await users.updateById(user._id, { password: hashedPassword, status: "active" });

  const verified = await bcrypt.compare(String(newPassword), hashedPassword);
  console.log(
    JSON.stringify({
      success: true,
      username: user.username,
      role: user.role,
      verified,
    })
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
