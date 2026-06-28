const mongoose = require("mongoose");

const trackingPreferencesSchema = new mongoose.Schema(
  {
    difficulty: { type: String, default: "medium", trim: true, maxlength: 30 },
    recommendationFrequency: { type: String, default: "daily", trim: true, maxlength: 30 },
    assignedScenariosMode: { type: String, default: "standard", trim: true, maxlength: 30 },
    visualTheme: { type: String, default: "soft", trim: true, maxlength: 40 },
    language: { type: String, default: "fr", trim: true, maxlength: 10 },
    gridSize: { type: String, default: "medium", trim: true, maxlength: 20 },
    childTheme: { type: String, default: "sky", trim: true, maxlength: 30 },
    childVoice: { type: String, default: "fr", trim: true, maxlength: 10 },
    childPictogramSize: { type: String, default: "4", trim: true, maxlength: 10 },
    childSuggestions: { type: String, default: "on", trim: true, maxlength: 10 },
    childLevel: { type: String, default: "Debutant", trim: true, maxlength: 40 },
  },
  { _id: false },
);

const kidSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    age: { type: Number, required: true, min: 2, max: 25 },
    gender: { type: String, enum: ["M", "F", "other"], default: "other" },
    communicationLevel: { type: String, required: true, trim: true, maxlength: 80 },
    difficultyType: { type: String, required: true, trim: true, maxlength: 120 },
    preferences: { type: [String], default: [] },
    currentLevel: { type: String, default: "Debutant", trim: true, maxlength: 60, index: true },
    notes: { type: String, default: "" },
    assignedParents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    assignedTherapists: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    status: { type: String, enum: ["active", "paused", "archived"], default: "active", index: true },
    sessionAccessCode: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    trackingPreferences: { type: trackingPreferencesSchema, default: () => ({}) },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

kidSchema.index({ firstName: 1, lastName: 1 });
kidSchema.index({ assignedParents: 1, status: 1 });
kidSchema.index({ assignedTherapists: 1, status: 1 });
kidSchema.set("toJSON", { virtuals: true });
kidSchema.set("toObject", { virtuals: true });
const Kid = mongoose.model("Kid", kidSchema);

module.exports = { Kid };
