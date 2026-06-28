const mongoose = require("mongoose");

const aiInteractionSchema = new mongoose.Schema(
  {
    kid: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", default: null, index: true },
    action: { type: String, required: true, index: true },
    requestPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    responsePayload: { type: mongoose.Schema.Types.Mixed, default: null },
    status: { type: String, enum: ["success", "error"], default: "success", index: true },
    errorMessage: { type: String, default: null },
    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  },
  { timestamps: true },
);

aiInteractionSchema.index({ action: 1, createdAt: -1 });

const AIInteraction = mongoose.model("AIInteraction", aiInteractionSchema);

module.exports = { AIInteraction };
