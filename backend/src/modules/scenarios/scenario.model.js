const mongoose = require("mongoose");

const scenarioSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150, index: true },
    description: { type: String, default: "", trim: true },
    ageTarget: { type: String, default: "", trim: true, maxlength: 80 },
    childGoal: { type: String, default: "", trim: true, maxlength: 1000 },
    blockageHelp: { type: String, default: "", trim: true, maxlength: 1000 },
    steps: [{ type: String, trim: true, maxlength: 220 }],
    targetLevel: { type: String, default: "Niveau 1", index: true },
    ageMin: { type: Number, default: 2, min: 2, max: 25, index: true },
    ageMax: { type: Number, default: 25, min: 2, max: 25, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    pictogramSequence: [{ type: mongoose.Schema.Types.ObjectId, ref: "Pictogram" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedKids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Kid", index: true }],
    estimatedDuration: { type: Number, default: 10, min: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

scenarioSchema.index({ createdBy: 1, isActive: 1 });
scenarioSchema.set("toJSON", { virtuals: true });
scenarioSchema.set("toObject", { virtuals: true });
const Scenario = mongoose.model("Scenario", scenarioSchema);

module.exports = { Scenario };
