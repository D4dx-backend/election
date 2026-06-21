const AuditLog = require("../model/AuditLog");

/**
 * Records a user activity entry in the audit log.
 * Logging failures are swallowed so they never break the calling operation.
 *
 * @param {*} userId      ID of the acting user (may be undefined)
 * @param {string} ipAddress  Request IP address
 * @param {string} action     Action performed (e.g. "Created", "Deleted")
 * @param {string} entityName  Human-readable name/identifier of the entity
 * @param {string} entityType  Type of the entity (e.g. "User", "Election")
 */
async function logUserActivity(userId, ipAddress, action, entityName, entityType) {
  try {
    await AuditLog.create({
      userId: userId || null,
      action,
      entityType,
      ipAddress,
      details: { entity: entityName },
    });
  } catch (err) {
    // Audit logging must never break the primary operation.
    console.error("logUserActivity failed:", err.message);
  }
}

module.exports = { logUserActivity };
