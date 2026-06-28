const mongoose = require("mongoose");

const sessionActionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, trim: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const sessionSchema = new mongoose.Schema(
  {
    kid: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", required: true, index: true },
    startedAt: { type: Date, required: true, default: Date.now, index: true },
    endedAt: { type: Date, default: null },
    duration: { type: Number, default: 0, min: 0 },
    score: { type: Number, default: null, min: 0, max: 100, index: true },
    scenario: { type: mongoose.Schema.Types.ObjectId, ref: "Scenario", default: null, index: true },
    actions: { type: [sessionActionSchema], default: [] },
    aiSummary: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    recommendationsSnapshot: { type: [String], default: [] },
  },
  { timestamps: true },
);

sessionSchema.index({ kid: 1, startedAt: -1 });

const Session = mongoose.model("Session", sessionSchema);

module.exports = { Session };
