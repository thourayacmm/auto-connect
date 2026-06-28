const mongoose = require("mongoose");
const { ROLES } = require("../../constants/roles");

const STATUSES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const accessRequestSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    requesterName: { type: String, required: true, trim: true },
    requesterRole: { type: String, enum: Object.values(ROLES), required: true, index: true },
    kid: { type: mongoose.Schema.Types.ObjectId, ref: "Kid", default: null, index: true },
    patientName: { type: String, required: true, trim: true },
    permission: { type: String, required: true, trim: true, maxlength: 160 },
    type: { type: String, required: true, trim: true, maxlength: 120 },
    justification: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: Object.values(STATUSES), default: STATUSES.PENDING, index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

accessRequestSchema.index({ requester: 1, createdAt: -1 });
accessRequestSchema.index({ status: 1, createdAt: -1 });

const AccessRequest = mongoose.model("AccessRequest", accessRequestSchema);

module.exports = { AccessRequest, STATUSES };
