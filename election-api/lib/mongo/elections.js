const Election = require("../../model/Election");
const { isLegacyMongoId } = require("../entityId");
const { mapMongoElection, electionDataToMongoUpdate } = require("./mapElection");

function buildMongoFilter(filter = {}) {
  const mongoFilter = {};
  if (filter.franchiseId) mongoFilter.franchiseId = filter.franchiseId;
  if (filter.status) mongoFilter.status = filter.status;
  if (filter.ids !== undefined) {
    mongoFilter._id = { $in: filter.ids };
  }
  if (filter.votingOpen !== undefined) mongoFilter.votingOpen = filter.votingOpen;
  return mongoFilter;
}

async function create(data) {
  const created = await Election.create(electionDataToMongoUpdate(data));
  return mapMongoElection(created);
}

async function findById(id) {
  if (!isLegacyMongoId(id)) return null;
  const doc = await Election.findById(id);
  return mapMongoElection(doc);
}

async function updateById(id, data) {
  if (!isLegacyMongoId(id)) return null;
  const update = electionDataToMongoUpdate(data);
  const doc = await Election.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  return mapMongoElection(doc);
}

async function deleteById(id) {
  if (!isLegacyMongoId(id)) return null;
  const existing = await findById(id);
  if (!existing) return null;
  await Election.findByIdAndDelete(id);
  return existing;
}

async function find(filter = {}, { page, limit, sortByCreated = false } = {}) {
  if (filter.ids !== undefined && !filter.ids.length) return [];
  const mongoFilter = buildMongoFilter(filter);
  let query = Election.find(mongoFilter);
  if (sortByCreated) query = query.sort({ createdAt: -1 });
  if (page !== undefined) {
    const pageNum = Math.max(page, 1);
    const pageSize = Math.max(limit || 10, 1);
    query = query.skip((pageNum - 1) * pageSize).limit(pageSize);
  }
  const docs = await query.exec();
  return docs.map(mapMongoElection);
}

async function findWithPagination(filter = {}, page = 1, limit = 10) {
  if (filter.ids !== undefined && !filter.ids.length) {
    return { elections: [], total: 0 };
  }
  const mongoFilter = buildMongoFilter(filter);
  const pageNum = Math.max(page, 1);
  const pageSize = Math.max(limit, 1);
  const [total, docs] = await Promise.all([
    Election.countDocuments(mongoFilter),
    Election.find(mongoFilter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize),
  ]);
  return { elections: docs.map(mapMongoElection), total };
}

async function countDocuments(filter = {}) {
  if (filter.ids !== undefined && !filter.ids.length) return 0;
  return Election.countDocuments(buildMongoFilter(filter));
}

async function findByIdsWithFranchise(ids, { votingOpen } = {}) {
  if (!ids.length) return [];
  const filter = { _id: { $in: ids.filter(isLegacyMongoId) } };
  if (votingOpen !== undefined) filter.votingOpen = votingOpen;
  const docs = await Election.find(filter).populate("franchiseId", "name logo");
  return docs.map((doc) => {
    const election = mapMongoElection(doc);
    const franchise = doc.franchiseId;
    if (franchise && typeof franchise === "object" && franchise._id) {
      election.franchiseId = {
        _id: String(franchise._id),
        id: String(franchise._id),
        name: franchise.name,
        logo: franchise.logo,
      };
    }
    return election;
  });
}

async function countByFranchise() {
  const rows = await Election.aggregate([
    { $match: { franchiseId: { $ne: null } } },
    { $group: { _id: "$franchiseId", count: { $sum: 1 } } },
  ]);
  const countMap = {};
  rows.forEach((row) => {
    countMap[String(row._id)] = row.count;
  });
  return countMap;
}

async function findLean(filter = {}) {
  const mongoFilter = buildMongoFilter(filter);
  const docs = await Election.find(mongoFilter)
    .select(
      "organization title status votingOpen franchiseId createdAt electionDate resultsPublished resultsPublishedAt"
    )
    .lean();
  return docs.map((row) => ({
    _id: String(row._id),
    id: String(row._id),
    title: row.title,
    organization: row.organization,
    status: row.status,
    votingOpen: row.votingOpen,
    franchiseId: row.franchiseId ? String(row.franchiseId) : null,
    electionDate: row.electionDate,
    resultsPublished: row.resultsPublished,
    resultsPublishedAt: row.resultsPublishedAt,
    createdAt: row.createdAt,
  }));
}

module.exports = {
  create,
  findById,
  updateById,
  deleteById,
  find,
  findWithPagination,
  countDocuments,
  findByIdsWithFranchise,
  countByFranchise,
  findLean,
};
