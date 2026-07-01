/**
 * Build a PostgREST `.or()` filter for case-insensitive search across columns.
 * Uses * wildcards (PostgREST alias for %) with quoted values so patterns parse correctly.
 */
function buildIlikeOrFilter(columns, search) {
  const raw = String(search || "").trim();
  if (!raw || !Array.isArray(columns) || columns.length === 0) return null;

  const escaped = raw
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '""')
    .replace(/\*/g, "");

  const pattern = `"*${escaped}*"`;
  return columns.map((col) => `${col}.ilike.${pattern}`).join(",");
}

module.exports = { buildIlikeOrFilter };
