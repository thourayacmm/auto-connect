const mongoose = require("mongoose");

const scoreHistorySchema = new mongoose.Schema(
  {
    kid: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", required: true, index: true },
    scoreType: { type: String, required: true, trim: true, index: true },
    value: { type: Number, required: true, min: 0, max: 100, index: true },
    explanation: { type: String, default: "", trim: true },
    basedOn: { type: mongoose.Schema.Types.Mixed, default: null },
    createdBy: { type: String, enum: ["ai", "therapist", "system"], default: "system" },
  },
  { timestamps: true },
);

scoreHistorySchema.index({ kid: 1, createdAt: -1 });

const ScoreHistory = mongoose.model("ScoreHistory", scoreHistorySchema);

module.exports = { ScoreHistory };
