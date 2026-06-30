import { normalizeEntityId } from "@/lib/apiHelpers";

export type VoterForAssign = {
  _id?: string;
  id?: string;
  electionAccess?: string[];
};

function getAuthHeaders(includeContentType = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeContentType) headers["Content-Type"] = "application/json";
  const token = localStorage.getItem("authToken");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data.message || data.error || res.statusText;
  } catch {
    try {
      return (await res.text()) || res.statusText;
    } catch {
      return res.statusText;
    }
  }
}

/** Assign voters to an election via Supabase-backed election-api. */
export async function assignVotersToElection(
  voterIds: string[],
  electionId: string,
  _knownVoters: VoterForAssign[] = [],
  onProgress?: (done: number, total: number) => void
): Promise<{ modified: number }> {
  const normalizedElectionId = normalizeEntityId(electionId);
  const normalizedVoterIds = voterIds.map(normalizeEntityId).filter(Boolean);

  if (!normalizedElectionId) {
    throw new Error("A valid election UUID is required.");
  }
  if (!normalizedVoterIds.length) {
    throw new Error("Select at least one voter with a valid UUID.");
  }

  const res = await fetch("/api/users/voters/assign-election", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(true),
    body: JSON.stringify({
      voterIds: normalizedVoterIds,
      electionId: normalizedElectionId,
    }),
  });

  if (!res.ok) {
    throw new Error(`${res.status}: ${await parseError(res)}`);
  }

  const data = await res.json();
  onProgress?.(normalizedVoterIds.length, normalizedVoterIds.length);
  return { modified: data.modified ?? normalizedVoterIds.length };
}
