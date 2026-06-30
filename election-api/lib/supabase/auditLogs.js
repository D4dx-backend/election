const { getSupabase } = require("../../config/supabase");
const { mapAuditLog } = require("./map");
const { isUuid } = require("./users");

function auditLogToRow(data) {
  const row = {};
  if (data.userId !== undefined) row.user_id = data.userId || null;
  if (data.action !== undefined) row.action = data.action;
  if (data.entityType !== undefined) row.entity_type = data.entityType;
  if (data.entityId !== undefined) row.entity_id = data.entityId || null;
  if (data.ipAddress !== undefined) row.ip_address = data.ipAddress;
  if (data.details !== undefined) row.details = data.details;
  row.created_at = new Date().toISOString();
  return row;
}

async function populateUser(userId) {
  if (!userId || !isUuid(userId)) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("users")
    .select("id, username, full_name, email")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return userId;
  return {
    _id: data.id,
    id: data.id,
    username: data.username,
    fullName: data.full_name,
    email: data.email,
  };
}

async function create(data) {
  const supabase = getSupabase();
  const row = auditLogToRow(data);

  const { data: created, error } = await supabase.from("audit_logs").insert(row).select().single();
  if (error) throw error;
  return mapAuditLog(created);
}

async function findById(id, { populateUser: pop = true } = {}) {
  if (!isUuid(id)) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase.from("audit_logs").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const user = pop ? await populateUser(data.user_id) : data.user_id;
  return mapAuditLog(data, user);
}

async function findAll({ page = 1, limit = 10 } = {}) {
  const supabase = getSupabase();
  const pageNum = Math.max(page, 1);
  const pageSize = Math.max(limit, 1);
  const from = (pageNum - 1) * pageSize;

  const { data, count, error } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);
  if (error) throw error;

  const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))];
  let userMap = {};
  if (userIds.length) {
    const { data: users, error: uErr } = await supabase
      .from("users")
      .select("id, username, full_name, email")
      .in("id", userIds);
    if (uErr) throw uErr;
    (users || []).forEach((u) => {
      userMap[u.id] = {
        _id: u.id,
        id: u.id,
        username: u.username,
        fullName: u.full_name,
        email: u.email,
      };
    });
  }

  const logs = (data || []).map((row) => mapAuditLog(row, userMap[row.user_id] || row.user_id));
  return { logs, total: count || 0 };
}

async function findRecent({ limit = 10, sinceHours = 48 } = {}) {
  const supabase = getSupabase();
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  const userIds = [...new Set((data || []).map((r) => r.user_id).filter(Boolean))];
  let userMap = {};
  if (userIds.length) {
    const { data: users, error: uErr } = await supabase
      .from("users")
      .select("id, username, full_name")
      .in("id", userIds);
    if (uErr) throw uErr;
    (users || []).forEach((u) => {
      userMap[u.id] = {
        _id: u.id,
        username: u.username,
        fullName: u.full_name,
      };
    });
  }

  return (data || []).map((row) => mapAuditLog(row, userMap[row.user_id] || row.user_id));
}

async function countDocuments() {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

module.exports = {
  create,
  findById,
  findAll,
  findRecent,
  countDocuments,
};
