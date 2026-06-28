const mongoose = require("mongoose");
const { ROLES } = require("../../constants/roles");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), required: true, index: true },
    language: { type: String, default: "fr", trim: true, maxlength: 10 },
    avatar: { type: String, default: null },
    phone: { type: String, default: null, trim: true, maxlength: 32 },
    address: { type: String, default: "", trim: true, maxlength: 240 },
    specialty: { type: String, default: "", trim: true, maxlength: 120 },
    uiPreferences: {
      language: { type: String, default: "fr", trim: true, maxlength: 10 },
      gridSize: { type: String, default: "medium", trim: true, maxlength: 20 },
      childTheme: { type: String, default: "sky", trim: true, maxlength: 30 },
      childVoice: { type: String, default: "fr", trim: true, maxlength: 10 },
      childPictogramSize: { type: String, default: "4", trim: true, maxlength: 10 },
      childSuggestions: { type: String, default: "on", trim: true, maxlength: 10 },
      childLevel: { type: String, default: "Debutant", trim: true, maxlength: 40 },
    },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  },
  { timestamps: true },
);

userSchema.virtual("fullName").get(function fullName() {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", userSchema);

module.exports = { User };
