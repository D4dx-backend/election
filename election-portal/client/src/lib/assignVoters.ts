type ElectionAccessEntry = string | number | { _id?: string; id?: string; toString?: () => string };

export type VoterForAssign = {
  _id?: string;
  id?: string;
  electionAccess?: ElectionAccessEntry[];
};

function normalizeRecordId(id: unknown): string {
  if (id == null) return "";
  if (typeof id === "object") {
    const rec = id as { _id?: unknown; id?: unknown; toString?: () => string };
    if (rec._id != null) return normalizeRecordId(rec._id);
    if (rec.id != null) return normalizeRecordId(rec.id);
    if (typeof rec.toString === "function") {
      const s = rec.toString();
      if (s && s !== "[object Object]") return s;
    }
    return "";
  }
  return String(id).trim();
}

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

/** Legacy Mongo API: merge election into each voter's electionAccess via PUT /api/users/:id */
async function assignVotersLegacy(
  voterIds: string[],
  electionId: string,
  votersById: Map<string, VoterForAssign>,
  onProgress?: (done: number, total: number) => void
): Promise<{ modified: number }> {
  const target = normalizeRecordId(electionId);
  let modified = 0;
  const batchSize = 10;

  for (let i = 0; i < voterIds.length; i += batchSize) {
    const batch = voterIds.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (voterId) => {
        let voter = votersById.get(voterId);
        if (!voter) {
          const getRes = await fetch(`/api/users/${voterId}`, {
            credentials: "include",
            headers: getAuthHeaders(),
          });
          if (!getRes.ok) {
            throw new Error(`${getRes.status}: ${await parseError(getRes)}`);
          }
          const payload = await getRes.json();
          voter = payload.data ?? payload;
        }

        const existing = (voter?.electionAccess ?? []).map(normalizeRecordId).filter(Boolean);
        if (existing.includes(target)) return;

        const electionAccess = [...new Set([...existing, target])];
        const putRes = await fetch(`/api/users/${voterId}`, {
          method: "PUT",
          credentials: "include",
          headers: getAuthHeaders(true),
          body: JSON.stringify({ id: voterId, electionAccess }),
        });
        if (!putRes.ok) {
          throw new Error(`${putRes.status}: ${await parseError(putRes)}`);
        }
        modified += 1;
      })
    );
    onProgress?.(Math.min(i + batch.length, voterIds.length), voterIds.length);
  }

  return { modified };
}

export async function assignVotersToElection(
  voterIds: string[],
  electionId: string,
  knownVoters: VoterForAssign[] = [],
  onProgress?: (done: number, total: number) => void
): Promise<{ modified: number }> {
  const votersById = new Map<string, VoterForAssign>();
  knownVoters.forEach((v) => {
    const id = normalizeRecordId(v._id ?? v.id);
    if (id) votersById.set(id, v);
  });

  const res = await fetch("/api/users/voters/assign-election", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(true),
    body: JSON.stringify({ voterIds, electionId }),
  });

  if (res.status === 404) {
    return assignVotersLegacy(voterIds, electionId, votersById, onProgress);
  }

  if (!res.ok) {
    throw new Error(`${res.status}: ${await parseError(res)}`);
  }

  const data = await res.json();
  return { modified: data.modified ?? voterIds.length };
}
