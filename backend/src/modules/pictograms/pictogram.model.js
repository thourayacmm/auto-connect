const mongoose = require("mongoose");

const pictogramSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120, index: true },
    imageUrl: { type: String, required: true, trim: true },
    audioUrl: { type: String, default: null, trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    keywords: [{ type: String, trim: true, index: true }],
    level: { type: String, default: "Niveau 1", index: true },
    ageMin: { type: Number, default: 2, min: 2, max: 25, index: true },
    ageMax: { type: Number, default: 25, min: 2, max: 25, index: true },
    icon: { type: String, default: "Bot", trim: true, maxlength: 80 },
    subcategory: { type: String, default: "General", trim: true, maxlength: 120, index: true },
    description: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

pictogramSchema.index({ name: "text", keywords: "text" });
pictogramSchema.set("toJSON", { virtuals: true });
pictogramSchema.set("toObject", { virtuals: true });
const Pictogram = mongoose.model("Pictogram", pictogramSchema);

module.exports = { Pictogram };
