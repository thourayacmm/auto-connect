const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 80, index: true },
    description: { type: String, default: "", trim: true },
    icon: { type: String, default: null, trim: true },
    color: { type: String, default: "#3b82f6", trim: true, maxlength: 16 },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);
categorySchema.set("toJSON", { virtuals: true });
categorySchema.set("toObject", { virtuals: true });
const Category = mongoose.model("Category", categorySchema);

module.exports = { Category };
