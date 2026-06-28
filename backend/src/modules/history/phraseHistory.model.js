const mongoose = require("mongoose");

const phraseHistorySchema = new mongoose.Schema(
  {
    kid: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", required: true, index: true },
    pictograms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Pictogram" }],
    generatedText: { type: String, required: true, trim: true },
    correctedText: { type: String, default: null, trim: true },
    audioPlayed: { type: Boolean, default: false },
    score: { type: Number, default: null, min: 0, max: 100, index: true },
    duration: { type: Number, default: 0, min: 0 },
    source: { type: String, enum: ["manual", "scenario", "ai"], default: "manual", index: true },
    usedAt: { type: Date, default: Date.now, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  },
  { timestamps: true },
);

phraseHistorySchema.index({ kid: 1, usedAt: -1 });
phraseHistorySchema.index({ kid: 1, score: -1 });

const PhraseHistory = mongoose.model("PhraseHistory", phraseHistorySchema);

module.exports = { PhraseHistory };
