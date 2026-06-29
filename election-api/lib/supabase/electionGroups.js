const { getSupabase } = require("../../config/supabase");
const { mapElectionGroup, electionGroupToRow } = require("./map");
const { isUuid } = require("./users");

function isRecordId(id) {
  const s = String(id);
  return isUuid(s) || /^[0-9a-fA-F]{24}$/.test(s);
}

async function loadElectionIds(groupIds) {
  const map = new Map();
  if (!groupIds.length) return map;
  groupIds.forEach((id) => map.set(String(id), []));

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("election_group_elections")
    .select("election_group_id, election_id")
    .in("election_group_id", groupIds);
  if (error) throw error;

  (data || []).forEach((row) => {
    map.get(String(row.election_group_id)).push(row.election_id);
  });
  return map;
}

async function mapGroups(rows) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const electionsMap = await loadElectionIds(ids);
  return rows.map((row) =>
    mapElectionGroup(row, { elections: electionsMap.get(String(row.id)) || [] })
  );
}

async function syncElections(groupId, elections) {
  const supabase = getSupabase();
  await supabase.from("election_group_elections").delete().eq("election_group_id", groupId);
  const electionIds = (elections || [])
    .map((e) => (typeof e === "object" ? e._id || e.id : e))
    .filter(isRecordId);
  if (electionIds.length) {
    const rows = electionIds.map((electionId) => ({
      election_group_id: groupId,
      election_id: electionId,
    }));
    const { error } = await supabase.from("election_group_elections").insert(rows);
    if (error) throw error;
  }
}

async function create(data) {
  const supabase = getSupabase();
  const { elections, ...rest } = data;
  const row = electionGroupToRow(rest);
  row.created_at = new Date().toISOString();
  row.updated_at = row.created_at;

  const { data: created, error } = await supabase.from("election_groups").insert(row).select().single();
  if (error) throw error;

  if (elections && elections.length) await syncElections(created.id, elections);
  const [group] = await mapGroups([created]);
  return group;
}

async function findById(id) {
  if (!isUuid(id)) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase.from("election_groups").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [group] = await mapGroups([data]);
  return group;
}

async function updateById(id, data) {
  if (!isUuid(id)) return null;
  const supabase = getSupabase();
  const { elections, ...rest } = data;
  const row = electionGroupToRow(rest);

  const { data: updated, error } = await supabase
    .from("election_groups")
    .update(row)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!updated) return null;

  if (elections !== undefined) await syncElections(id, elections);
  const [group] = await mapGroups([updated]);
  return group;
}

async function deleteById(id) {
  if (!isUuid(id)) return null;
  const group = await findById(id);
  if (!group) return null;

  const supabase = getSupabase();
  await supabase.from("election_group_elections").delete().eq("election_group_id", id);
  const { error } = await supabase.from("election_groups").delete().eq("id", id);
  if (error) throw error;
  return group;
}

async function countDocuments(filter = {}) {
  const supabase = getSupabase();
  let query = supabase.from("election_groups").select("id", { count: "exact", head: true });
  if (filter.franchiseId) query = query.eq("franchise_id", filter.franchiseId);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function find(filter = {}, { page, limit } = {}) {
  const supabase = getSupabase();
  let query = supabase
    .from("election_groups")
    .select("*", { count: page !== undefined ? "exact" : undefined });
  if (filter.franchiseId) query = query.eq("franchise_id", filter.franchiseId);

  if (page !== undefined) {
    const pageNum = Math.max(page, 1);
    const pageSize = Math.max(limit || 10, 1);
    query = query.order("created_at", { ascending: false });
    query = query.range((pageNum - 1) * pageSize, pageNum * pageSize - 1);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { groups: await mapGroups(data || []), total: count };
}

module.exports = {
  create,
  findById,
  updateById,
  deleteById,
  countDocuments,
  find,
};
