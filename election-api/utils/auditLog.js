const auditLogs = require("../lib/supabase/auditLogs");

async function logUserActivity(userId, ipAddress, action, entityName, entityType) {
  try {
    await auditLogs.create({
      userId: userId || null,
      action,
      entityType,
      ipAddress,
      details: { entity: entityName },
    });
  } catch (err) {
    console.error("logUserActivity failed:", err.message);
  }
}

module.exports = { logUserActivity };
