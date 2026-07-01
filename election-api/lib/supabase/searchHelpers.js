/**
 * Case-insensitive match against voter text fields.
 */
function matchesVoterSearch(row, search) {
  const term = String(search || "").trim().toLowerCase();
  if (!term) return true;
  const fields = [row.username, row.full_name, row.registration_number].map((f) =>
    (f || "").toLowerCase()
  );
  return fields.some((f) => f.includes(term));
}

module.exports = { matchesVoterSearch };
