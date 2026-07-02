/**
 * Election status rules:
 * - Election date ended → status completed, voting closed
 * - Open voting enabled → status active (if date not ended)
 * - Voting closed → status draft (unless archived/completed by date)
 */

function parseElectionDate(value) {
  if (!value) return null;
  const str = String(value);
  const datePart = str.includes("T") ? str.split("T")[0] : str.slice(0, 10);
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  return new Date(year, month - 1, day);
}

function isElectionDatePassed(electionDate) {
  const date = parseElectionDate(electionDate);
  if (!date) return false;
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return Date.now() > endOfDay.getTime();
}

/**
 * Mutates/returns patch object with status + votingOpen based on date and votingOpen flag.
 */
function applyElectionLifecycleRules(patch, existing = {}) {
  const electionDate =
    patch.electionDate !== undefined ? patch.electionDate : existing.electionDate;
  const votingOpen =
    patch.votingOpen !== undefined ? patch.votingOpen : existing.votingOpen;
  const currentStatus = patch.status !== undefined ? patch.status : existing.status;

  if (currentStatus === "archived") {
    return patch;
  }

  if (isElectionDatePassed(electionDate)) {
    patch.status = "completed";
    patch.votingOpen = false;
    return patch;
  }

  if (votingOpen === true) {
    patch.status = "active";
    patch.votingOpen = true;
    return patch;
  }

  if (patch.votingOpen === false || votingOpen === false) {
    patch.votingOpen = false;
    if (currentStatus === "active" || !currentStatus) {
      patch.status = "draft";
    }
    return patch;
  }

  if (!patch.status && !existing.status) {
    patch.status = "draft";
  }

  return patch;
}

async function syncElectionLifecycle(election, updateFn) {
  if (!election || election.status === "archived" || !updateFn) {
    return election;
  }

  const patch = applyElectionLifecycleRules({}, election);
  const statusChanged = patch.status && patch.status !== election.status;
  const votingChanged =
    patch.votingOpen !== undefined && patch.votingOpen !== election.votingOpen;

  if (!statusChanged && !votingChanged) {
    return election;
  }

  const id = election._id || election.id;
  if (!id) return { ...election, ...patch };

  const updated = await updateFn(id, patch);
  return updated || { ...election, ...patch };
}

module.exports = {
  isElectionDatePassed,
  applyElectionLifecycleRules,
  syncElectionLifecycle,
};
