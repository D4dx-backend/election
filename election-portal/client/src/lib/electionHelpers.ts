export type ElectionStatus = "draft" | "active" | "completed" | "archived" | string;

/** Completed (or archived) elections cannot be edited or deleted. */
export function isElectionLocked(status?: ElectionStatus | null): boolean {
  return status === "completed" || status === "archived";
}

export function isElectionEditable(status?: ElectionStatus | null): boolean {
  return !isElectionLocked(status);
}

/** Primary display label for an election (organization only; title is legacy). */
export function getElectionLabel(election: {
  organization?: string | null;
  title?: string | null;
}): string {
  return (election.organization || election.title || "Untitled").trim();
}

/** Secondary line when label differs from organization (e.g. legacy title). */
export function getElectionSubtitle(election: {
  organization?: string | null;
  title?: string | null;
}): string | null {
  const label = getElectionLabel(election);
  const title = (election.title || "").trim();
  if (title && title !== label) return title;
  return null;
}
