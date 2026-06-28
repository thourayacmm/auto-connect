const { Category } = require("./category.model");
const { ApiError } = require("../../utils/ApiError");
const { parsePaginationQuery } = require("../../utils/pagination");

const createCategory = async (payload) => {
  const exists = await Category.findOne({ name: payload.name });
  if (exists) throw new ApiError(409, "Category name already exists");
  return Category.create(payload);
};

const listCategories = async (query) => {
  const { page, limit, skip } = parsePaginationQuery(query);
  const filter = {};
  if (typeof query.isActive === "boolean") filter.isActive = query.isActive;

  const [items, total] = await Promise.all([
    Category.find(filter).sort({ order: 1, name: 1 }).skip(skip).limit(limit),
    Category.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

const getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new ApiError(404, "Category not found");
  return category;
};

const updateCategory = async (id, payload) => {
  const category = await Category.findByIdAndUpdate(id, payload, { new: true });
  if (!category) throw new ApiError(404, "Category not found");
  return category;
};

const deleteCategory = async (id) => {
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new ApiError(404, "Category not found");
  return { id };
};

module.exports = { createCategory, listCategories, getCategoryById, updateCategory, deleteCategory };
