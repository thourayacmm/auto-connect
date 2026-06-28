const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    kid: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", required: true, index: true },
    type: { type: String, enum: ["pictogram", "scenario", "level", "message"], required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    content: { type: String, required: true, trim: true },
    relatedPictograms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Pictogram" }],
    relatedScenario: { type: mongoose.Schema.Types.ObjectId, ref: "Scenario", default: null },
    reason: { type: String, default: "", trim: true },
    generatedBy: { type: String, enum: ["ai", "therapist", "system"], default: "ai", index: true },
  },
  { timestamps: true },
);

recommendationSchema.index({ kid: 1, createdAt: -1 });

const Recommendation = mongoose.model("Recommendation", recommendationSchema);

module.exports = { Recommendation };
