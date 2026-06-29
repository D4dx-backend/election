const { getSupabase } = require("../../config/supabase");
const { mapElectionAnalytics } = require("./map");
const { isUuid } = require("./users");

function analyticsToRow(data) {
  const row = {};
  if (data.electionId !== undefined) row.election_id = data.electionId;
  if (data.totalVoters !== undefined) row.total_voters = data.totalVoters;
  if (data.totalVotesCast !== undefined) row.total_votes_cast = data.totalVotesCast;
  if (data.pendingVoters !== undefined) row.pending_voters = data.pendingVoters;
  if (data.nomineeResults !== undefined) row.nominee_results = data.nomineeResults;
  if (data.lastUpdated !== undefined) row.last_updated = data.lastUpdated;
  if (data.isFinalized !== undefined) row.is_finalized = data.isFinalized;
  row.updated_at = new Date().toISOString();
  return row;
}

async function create(data) {
  const supabase = getSupabase();
  const row = analyticsToRow(data);
  row.created_at = new Date().toISOString();
  if (!row.last_updated) row.last_updated = row.created_at;

  const { data: created, error } = await supabase.from("election_analytics").insert(row).select().single();
  if (error) throw error;
  return mapElectionAnalytics(created);
}

async function findById(id) {
  if (!isUuid(id)) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase.from("election_analytics").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return mapElectionAnalytics(data);
}

async function updateById(id, data) {
  if (!isUuid(id)) return null;
  const supabase = getSupabase();
  const row = analyticsToRow(data);

  const { data: updated, error } = await supabase
    .from("election_analytics")
    .update(row)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return mapElectionAnalytics(updated);
}

async function deleteById(id) {
  if (!isUuid(id)) return null;
  const analytic = await findById(id);
  if (!analytic) return null;

  const supabase = getSupabase();
  const { error } = await supabase.from("election_analytics").delete().eq("id", id);
  if (error) throw error;
  return analytic;
}

async function findAll() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("election_analytics").select("*");
  if (error) throw error;
  return (data || []).map(mapElectionAnalytics);
}

module.exports = {
  create,
  findById,
  updateById,
  deleteById,
  findAll,
};
