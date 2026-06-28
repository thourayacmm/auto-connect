const { Pictogram } = require("./pictogram.model");
const { ROLES } = require("../../constants/roles");
const { ApiError } = require("../../utils/ApiError");
const { parsePaginationQuery } = require("../../utils/pagination");

const createPictogram = async (payload, user) =>
  Pictogram.create({
    ...payload,
    isActive: user.role === ROLES.ADMIN ? payload.isActive ?? true : false,
    createdBy: user._id,
  });

const buildListFilter = (query) => {
  const filter = {};
  if (query.category) filter.category = query.category;
  if (query.level) filter.level = query.level;
  if (query.age) {
    filter.ageMin = { $lte: query.age };
    filter.ageMax = { $gte: query.age };
  }
  if (typeof query.isActive === "boolean") filter.isActive = query.isActive;
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { keywords: { $elemMatch: { $regex: query.search, $options: "i" } } },
    ];
  }
  return filter;
};

const listPictograms = async (query) => {
  const { page, limit, skip } = parsePaginationQuery(query);
  const filter = buildListFilter(query);

  const [items, total] = await Promise.all([
    Pictogram.find(filter).populate("category", "name color icon").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Pictogram.countDocuments(filter),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const getPictogramById = async (id) => {
  const pictogram = await Pictogram.findById(id).populate("category", "name color icon");
  if (!pictogram) throw new ApiError(404, "Pictogram not found");
  return pictogram;
};

const updatePictogram = async (id, payload, user) => {
  const nextPayload = { ...payload };
  if (user.role !== ROLES.ADMIN) {
    delete nextPayload.isActive;
  }

  const pictogram = await Pictogram.findByIdAndUpdate(id, nextPayload, { new: true }).populate("category", "name color icon");
  if (!pictogram) throw new ApiError(404, "Pictogram not found");
  return pictogram;
};

const deletePictogram = async (id) => {
  const pictogram = await Pictogram.findByIdAndDelete(id);
  if (!pictogram) throw new ApiError(404, "Pictogram not found");
  return { id };
};

const searchPictograms = async (query) =>
  Pictogram.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { keywords: { $elemMatch: { $regex: query, $options: "i" } } },
    ],
    isActive: true,
  })
    .populate("category", "name color icon")
    .limit(50);

const listByCategory = async (categoryId) =>
  Pictogram.find({ category: categoryId, isActive: true }).populate("category", "name color icon").sort({ name: 1 });

module.exports = {
  createPictogram,
  listPictograms,
  getPictogramById,
  updatePictogram,
  deletePictogram,
  searchPictograms,
  listByCategory,
};
