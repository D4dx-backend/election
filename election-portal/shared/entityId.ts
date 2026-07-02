import { z } from "zod";

/** Supabase / Postgres UUID */
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Legacy MongoDB ObjectId (24 hex chars) — still returned by older production APIs */
export const LEGACY_MONGO_ID_RE = /^[0-9a-f]{24}$/i;

const INVALID_ID_MESSAGE = "Invalid ID";

export function isUuid(value: unknown): boolean {
  if (value == null || value === "") return false;
  return UUID_RE.test(String(value).trim());
}

export function isLegacyMongoId(value: unknown): boolean {
  if (value == null || value === "") return false;
  return LEGACY_MONGO_ID_RE.test(String(value).trim());
}

/**
 * Valid entity id from any supported API (Supabase UUID or legacy Mongo ObjectId).
 * Use for forms, routes, and client-side validation — never use z.string().uuid() directly.
 */
export function isEntityId(value: unknown): boolean {
  return isUuid(value) || isLegacyMongoId(value);
}

export function normalizeEntityIdString(value: unknown): string | undefined {
  if (value == null || value === "") return undefined;
  const trimmed = String(value).trim();
  return isEntityId(trimmed) ? trimmed : undefined;
}

/**
 * Build a Zod string schema for entity IDs.
 * Apply `.min()` / `.max()` on the string BEFORE `.refine()` — refined schemas (ZodEffects)
 * do not expose string methods and will throw at module load (e.g. `.min is not a function`).
 */
function entityIdString(requiredMessage?: string) {
  let schema = z.string();
  if (requiredMessage) {
    schema = schema.min(1, { message: requiredMessage });
  }
  return schema.refine(isEntityId, { message: INVALID_ID_MESSAGE });
}

/** UUID or legacy Mongo id (empty or invalid format fails). */
export const entityIdSchema = entityIdString();

/** Optional entity id — empty string / null / undefined are treated as absent. */
export const optionalEntityIdSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  entityIdSchema.optional()
);

/** Required non-empty entity id. */
export const requiredEntityIdSchema = entityIdString("ID is required");

/** For required Select fields — empty value fails with a friendly message. */
export function selectedEntityIdSchema(requiredMessage = "Please select an option") {
  return entityIdString(requiredMessage);
}
