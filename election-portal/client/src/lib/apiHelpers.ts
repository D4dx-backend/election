/** Normalize list endpoints that may return T[] or { data: T[] }. */
export function extractApiList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray((raw as { data?: T[] }).data)) {
    return (raw as { data: T[] }).data;
  }
  return [];
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): boolean {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/** Normalize Supabase/API entity ids (_id and id are both UUID strings). */
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
