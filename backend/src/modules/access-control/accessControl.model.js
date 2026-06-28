const mongoose = require("mongoose");
const { ROLES } = require("../../constants/roles");

const accessControlSchema = new mongoose.Schema(
  {
    role: { type: String, enum: Object.values(ROLES), required: true, index: true },
    resource: { type: String, required: true, trim: true, index: true },
    actions: { type: [String], default: [] },
  },
  { timestamps: true },
);

accessControlSchema.index({ role: 1, resource: 1 }, { unique: true });

const AccessControl = mongoose.model("AccessControl", accessControlSchema);

module.exports = { AccessControl };
