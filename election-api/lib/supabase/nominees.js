const { getSupabase } = require("../../config/supabase");
const { mapNominee, nomineeToRow } = require("./map");
const { isUuid } = require("./users");

async function create(data) {
  const supabase = getSupabase();
  const row = nomineeToRow(data);
  row.created_at = new Date().toISOString();
  row.updated_at = row.created_at;
  if (!row.status) row.status = "active";

  const { data: created, error } = await supabase.from("nominees").insert(row).select().single();
  if (error) throw error;
  return mapNominee(created);
}

async function insertMany(docs) {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const rows = docs.map((d) => {
    const row = nomineeToRow(d);
    row.created_at = now;
    row.updated_at = now;
    if (!row.status) row.status = "active";
    return row;
  });

  const { data, error } = await supabase.from("nominees").insert(rows).select();
  if (error) throw error;
  return (data || []).map(mapNominee);
}

async function findById(id) {
  if (!isUuid(id)) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase.from("nominees").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return mapNominee(data);
}

async function updateById(id, data) {
  if (!isUuid(id)) return null;
  const supabase = getSupabase();
  const row = nomineeToRow(data);

  const { data: updated, error } = await supabase
    .from("nominees")
    .update(row)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return mapNominee(updated);
}

async function deleteById(id) {
  if (!isUuid(id)) return null;
  const nominee = await findById(id);
  if (!nominee) return null;

  const supabase = getSupabase();
  const { error } = await supabase.from("nominees").delete().eq("id", id);
  if (error) throw error;
  return nominee;
}

async function findByElection(electionId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("nominees")
    .select("*")
    .eq("election_id", electionId);
  if (error) throw error;
  return (data || []).map(mapNominee);
}

async function findByIdsAndElection(nomineeIds, electionId) {
  if (!nomineeIds.length) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("nominees")
    .select("*")
    .in("id", nomineeIds)
    .eq("election_id", electionId);
  if (error) throw error;
  return (data || []).map(mapNominee);
}

async function countDocuments(filter = {}) {
  const supabase = getSupabase();
  let query = supabase.from("nominees").select("id", { count: "exact", head: true });
  if (filter.electionId) query = query.eq("election_id", filter.electionId);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function find(filter = {}, { page, limit } = {}) {
  const supabase = getSupabase();
  let query = supabase.from("nominees").select("*", { count: page !== undefined ? "exact" : undefined });
  if (filter.electionId) query = query.eq("election_id", filter.electionId);

  if (page !== undefined) {
    const pageNum = Math.max(page, 1);
    const pageSize = Math.max(limit || 10, 1);
    query = query.order("created_at", { ascending: false });
    query = query.range((pageNum - 1) * pageSize, pageNum * pageSize - 1);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { nominees: (data || []).map(mapNominee), total: count };
}

module.exports = {
  create,
  insertMany,
  findById,
  updateById,
  deleteById,
  findByElection,
  findByIdsAndElection,
  countDocuments,
  find,
};
