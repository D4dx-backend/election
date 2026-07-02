const { resolvePublicImageUrl } = require("../spacesStorage");

function toId(value) {
  if (value == null) return null;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
}

function mapMongoElection(doc) {
  if (!doc) return null;
  const row = doc.toObject ? doc.toObject({ virtuals: false }) : doc;
  const id = toId(row._id);
  const logoUrl = row.logo?.url;

  return {
    _id: id,
    id,
    franchiseId: toId(row.franchiseId),
    organization: row.organization,
    title: row.title,
    electionDate: row.electionDate,
    numberToBeElected: row.numberToBeElected,
    nomineeDisplayOrder: row.nomineeDisplayOrder,
    maxVoters: row.maxVoters,
    maxNominees: row.maxNominees,
    genderBasedSelection: !!row.genderBasedSelection,
    maleMinimum: row.maleMinimum,
    femaleMinimum: row.femaleMinimum,
    selfRegOpen: !!row.selfRegOpen,
    votingOpen: !!row.votingOpen,
    resultsPublished: !!row.resultsPublished,
    resultsPublishedAt: row.resultsPublishedAt,
    voterResultDisplay: row.voterResultDisplay || "full",
    adminVotingDetailsEnabled: !!row.adminVotingDetailsEnabled,
    manualWinnerSelection: !!row.manualWinnerSelection,
    manualWinnerIds: Array.isArray(row.manualWinnerIds)
      ? row.manualWinnerIds.map((n) => toId(n))
      : [],
    createdBy: toId(row.createdBy),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    status: row.status,
    logo: logoUrl
      ? { url: resolvePublicImageUrl(logoUrl), alt: row.logo?.alt }
      : undefined,
    electionGroupId: toId(row.electionGroupId),
  };
}

const UPDATABLE_FIELDS = [
  "franchiseId",
  "organization",
  "title",
  "electionDate",
  "numberToBeElected",
  "nomineeDisplayOrder",
  "maxVoters",
  "maxNominees",
  "genderBasedSelection",
  "maleMinimum",
  "femaleMinimum",
  "selfRegOpen",
  "votingOpen",
  "resultsPublished",
  "resultsPublishedAt",
  "voterResultDisplay",
  "adminVotingDetailsEnabled",
  "manualWinnerSelection",
  "manualWinnerIds",
  "status",
  "logo",
  "electionGroupId",
];

function electionDataToMongoUpdate(data) {
  const update = {};
  for (const key of UPDATABLE_FIELDS) {
    if (data[key] !== undefined) update[key] = data[key];
  }
  if (data.maxNominees !== undefined && data.numberToBeElected === undefined) {
    update.numberToBeElected = data.maxNominees;
  }
  if (data.numberToBeElected !== undefined) {
    update.numberToBeElected = data.numberToBeElected;
    update.maxNominees = data.numberToBeElected;
  }
  return update;
}

module.exports = { mapMongoElection, electionDataToMongoUpdate };
