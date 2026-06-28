const { Kid } = require("../kids/kid.model");
const { User } = require("../users/user.model");
const { ROLES } = require("../../constants/roles");
const { ApiError } = require("../../utils/ApiError");

const allowedKeys = [
  "language",
  "gridSize",
  "childTheme",
  "childVoice",
  "childPictogramSize",
  "childSuggestions",
  "childLevel",
];

const pickPreferences = (payload = {}) =>
  allowedKeys.reduce((acc, key) => {
    if (payload[key] !== undefined && payload[key] !== null) acc[key] = String(payload[key]);
    return acc;
  }, {});

const defaultPreferences = {
  language: "fr",
  gridSize: "medium",
  childTheme: "sky",
  childVoice: "fr",
  childPictogramSize: "4",
  childSuggestions: "on",
  childLevel: "Debutant",
};

const getDefaultPreferences = () => ({ ...defaultPreferences });

const findPreferenceKid = async (user, kidId) => {
  if (user.role === ROLES.CHILD) {
    return Kid.findById(user.kidId || user._id);
  }

  const filter = {};
  if (kidId) filter._id = kidId;
  if (user.role === ROLES.PARENT) filter.assignedParents = user._id;
  if (user.role === ROLES.THERAPIST) filter.assignedTherapists = user._id;

  if (!Object.keys(filter).length || user.role === ROLES.ADMIN) return null;
  return Kid.findOne(filter).sort({ createdAt: -1 });
};

const getPreferences = async (user, kidId = null) => {
  if (!user) {
    return {
      ownerType: "guest",
      preferences: getDefaultPreferences(),
    };
  }

  const kid = await findPreferenceKid(user, kidId);
  if (kid) {
    return {
      ownerType: "kid",
      kidId: String(kid._id),
      preferences: { ...defaultPreferences, ...(kid.trackingPreferences?.toObject?.() || kid.trackingPreferences || {}) },
    };
  }

  const freshUser = await User.findById(user._id).select("uiPreferences language");
  if (!freshUser) throw new ApiError(404, "User not found");

  return {
    ownerType: "user",
    userId: String(freshUser._id),
    preferences: {
      ...defaultPreferences,
      language: freshUser.language || defaultPreferences.language,
      ...(freshUser.uiPreferences?.toObject?.() || freshUser.uiPreferences || {}),
    },
  };
};

const updatePreferences = async (user, payload) => {
  const preferences = pickPreferences(payload);
  const kid = await findPreferenceKid(user, payload.kidId);

  if (kid) {
    kid.trackingPreferences = {
      ...(kid.trackingPreferences?.toObject?.() || kid.trackingPreferences || {}),
      ...preferences,
    };
    if (preferences.childLevel) kid.currentLevel = preferences.childLevel;
    await kid.save();
    return getPreferences(user, kid._id);
  }

  const updated = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        uiPreferences: preferences,
        ...(preferences.language ? { language: preferences.language } : {}),
      },
    },
    { new: true },
  ).select("uiPreferences language");

  if (!updated) throw new ApiError(404, "User not found");
  return getPreferences(user);
};

module.exports = { getDefaultPreferences, getPreferences, updatePreferences };
