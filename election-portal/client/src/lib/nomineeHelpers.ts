export const NOMINEE_DEFAULT_AVATAR = "/nominee-default-avatar.svg";

export type NomineePhotoSource = {
  photo?: { url?: string } | string | null;
  photoUrl?: string | null;
  photo_url?: string | null;
} | null | undefined;

/** Raw photo URL from API (Mongo, Supabase, or legacy shapes). Empty if none assigned. */
export function extractNomineePhotoRaw(nominee: NomineePhotoSource): string {
  if (!nominee) return "";

  const photo = nominee.photo;
  if (typeof photo === "string" && photo.trim()) {
    return photo.trim();
  }
  if (photo && typeof photo === "object" && photo.url) {
    const url = String(photo.url).trim();
    if (url) return url;
  }

  const legacy = nominee.photoUrl || nominee.photo_url;
  return legacy ? String(legacy).trim() : "";
}

/** Make stored paths loadable in the portal (relative /uploads, etc.). */
export function resolveNomineeImageUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("uploads/")) return `/${trimmed}`;

  return trimmed;
}

/** Assigned photo URL, or the default avatar when the nominee has no photo. */
export function getNomineePhotoUrl(nominee: NomineePhotoSource): string {
  const raw = extractNomineePhotoRaw(nominee);
  return raw ? resolveNomineeImageUrl(raw) : NOMINEE_DEFAULT_AVATAR;
}

export function hasNomineePhoto(nominee: NomineePhotoSource): boolean {
  return Boolean(extractNomineePhotoRaw(nominee));
}
