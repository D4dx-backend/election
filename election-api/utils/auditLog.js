const auditLogs = require("../lib/supabase/auditLogs");
const { isUuid } = require("../lib/entityId");

function resolveActorId(user) {
  if (!user) return null;
  return user._id || user.id || null;
}

function safeEntityId(id) {
  if (!id) return null;
  const s = String(id);
  return isUuid(s) ? s : null;
}

async function logUserActivity(userId, ipAddress, action, entityName, entityType, entityId = null) {
  try {
    await auditLogs.create({
      userId: userId || null,
      action,
      entityType,
      entityId: safeEntityId(entityId),
      ipAddress,
      details: { entity: entityName },
    });
  } catch (err) {
    console.error("logUserActivity failed:", err.message);
  }
}

/** Convenience wrapper for controller handlers. */
function logAuditFromReq(req, action, entityName, entityType, entityId = null) {
  return logUserActivity(
    resolveActorId(req.user),
    req.ip,
    action,
    entityName,
    entityType,
    entityId
  );
}

module.exports = { logUserActivity, logAuditFromReq, resolveActorId };
