/** Supabase / Postgres UUID */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Legacy MongoDB ObjectId (24 hex chars) */
const LEGACY_MONGO_ID_RE = /^[0-9a-f]{24}$/i;

function isUuid(id) {
  if (id == null || id === "") return false;
  return UUID_RE.test(String(id).trim());
}

function isLegacyMongoId(id) {
  if (id == null || id === "") return false;
  return LEGACY_MONGO_ID_RE.test(String(id).trim());
}

/** UUID or legacy Mongo ObjectId — use for request validation and API compatibility. */
function isEntityId(id) {
  return isUuid(id) || isLegacyMongoId(id);
}

function normalizeEntityIdString(value) {
  if (value == null || value === "") return undefined;
  const trimmed = String(value).trim();
  return isEntityId(trimmed) ? trimmed : undefined;
}

module.exports = {
  UUID_RE,
  LEGACY_MONGO_ID_RE,
  isUuid,
  isLegacyMongoId,
  isEntityId,
  normalizeEntityIdString,
};
