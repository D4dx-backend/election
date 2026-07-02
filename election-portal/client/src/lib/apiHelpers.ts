/** Normalize list endpoints that may return T[] or { data: T[] }. */
export function extractApiList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray((raw as { data?: T[] }).data)) {
    return (raw as { data: T[] }).data;
  }
  return [];
}

export { isEntityId, isUuid, isLegacyMongoId } from "@shared/entityId";

/** Normalize API entity ids (_id and id — Supabase UUID strings). */
export function normalizeEntityId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const rec = value as { _id?: unknown; id?: unknown; toString?: () => string };
    if (rec._id != null) return normalizeEntityId(rec._id);
    if (rec.id != null) return normalizeEntityId(rec.id);
    if (typeof rec.toString === "function") {
      const s = rec.toString();
      if (s && s !== "[object Object]") return s;
    }
    return "";
  }
  return String(value).trim();
}
