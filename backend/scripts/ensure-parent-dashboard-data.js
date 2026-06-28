const mongoose = require("mongoose");
require("dotenv").config();

const { Kid } = require("../src/modules/kids/kid.model");
const { PhraseHistory } = require("../src/modules/history/phraseHistory.model");
const { Pictogram } = require("../src/modules/pictograms/pictogram.model");
const { Recommendation } = require("../src/modules/recommendations/recommendation.model");
const { Scenario } = require("../src/modules/scenarios/scenario.model");
const { ScoreHistory } = require("../src/modules/scores/scoreHistory.model");
const { Session } = require("../src/modules/sessions/session.model");
const { User } = require("../src/modules/users/user.model");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auto_connect";

const daysAgo = (days, hour = 10, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
};

const childNameForParent = (parent) => {
  const key = String(parent.email || "").split("@")[0].replace(/[^a-z0-9]/gi, "-");
  return {
    firstName: parent.firstName === "Sami" ? "Yassine" : "Amine",
    lastName: parent.lastName || key || "Demo",
  };
};

const ensureParentName = async (parent) => {
  if (parent.email === "salem77boubaker456@gmail.com") {
    await User.updateOne(
      { _id: parent._id },
      { $set: { firstName: "Sami", lastName: "Sami", isActive: true } },
    );
    return User.findById(parent._id);
  }
  return parent;
};

const pickPictograms = async () => {
  const names = ["Je suis", "Content", "Aide-moi", "Boire", "Eau", "Maman", "Manger", "Medecin"];
  const pictograms = await Pictogram.find({ name: { $in: names }, isActive: true }).select("_id name");
  return pictograms.map((item) => item._id);
};

const ensureDashboardDataForParent = async (rawParent, therapist, pictograms, scenarios) => {
  const parent = await ensureParentName(rawParent);
  let kid = await Kid.findOne({ assignedParents: parent._id }).sort({ createdAt: -1 });

  if (!kid) {
    const childName = childNameForParent(parent);
    kid = await Kid.create({
      ...childName,
      age: 8,
      gender: "other",
      communicationLevel: "Debutant",
      difficultyType: "Communication",
      currentLevel: "Debutant",
      notes: "Donnees de demonstration pour remplir le dashboard parent.",
      assignedParents: [parent._id],
      assignedTherapists: therapist ? [therapist._id] : [],
      status: "active",
      sessionAccessCode: `KID-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      createdBy: parent._id,
    });
  } else if (therapist) {
    await Kid.updateOne(
      { _id: kid._id },
      { $addToSet: { assignedTherapists: therapist._id }, $set: { status: "active" } },
    );
  }

  await Promise.all(
    scenarios.map((scenario) =>
      Scenario.updateOne({ _id: scenario._id }, { $addToSet: { assignedKids: kid._id } }),
    ),
  );

  await Promise.all([
    ScoreHistory.deleteMany({ kid: kid._id, "basedOn.seed": "parent-dashboard-data" }),
    PhraseHistory.deleteMany({ kid: kid._id, createdBy: parent._id }),
    Session.deleteMany({ kid: kid._id, createdBy: parent._id }),
    Recommendation.deleteMany({ kid: kid._id, reason: "Donnees dashboard parent" }),
  ]);

  await ScoreHistory.insertMany([
    { kid: kid._id, scoreType: "communication", value: 76, explanation: "Phrase autonome reussie.", basedOn: { seed: "parent-dashboard-data" }, createdBy: "ai", createdAt: daysAgo(0), updatedAt: daysAgo(0) },
    { kid: kid._id, scoreType: "communication", value: 72, explanation: "Bonne progression hebdomadaire.", basedOn: { seed: "parent-dashboard-data" }, createdBy: "ai", createdAt: daysAgo(2), updatedAt: daysAgo(2) },
    { kid: kid._id, scoreType: "communication", value: 80, explanation: "Scenario termine avec succes.", basedOn: { seed: "parent-dashboard-data" }, createdBy: "ai", createdAt: daysAgo(4), updatedAt: daysAgo(4) },
    { kid: kid._id, scoreType: "communication", value: 68, explanation: "Aide partielle utilisee.", basedOn: { seed: "parent-dashboard-data" }, createdBy: "ai", createdAt: daysAgo(6), updatedAt: daysAgo(6) },
    { kid: kid._id, scoreType: "communication", value: 64, explanation: "Debut de routine accompagne.", basedOn: { seed: "parent-dashboard-data" }, createdBy: "ai", createdAt: daysAgo(8), updatedAt: daysAgo(8) },
  ]);

  const phrases = [
    ["Je suis content", 82, "manual", 0],
    ["Aide-moi", 74, "scenario", 1],
    ["Je veux boire eau", 70, "manual", 3],
    ["Maman manger", 78, "manual", 5],
  ];

  await PhraseHistory.insertMany(
    phrases.map(([text, score, source, days], index) => ({
      kid: kid._id,
      pictograms: pictograms.slice(index, index + 3),
      generatedText: text,
      correctedText: text,
      audioPlayed: true,
      score,
      duration: 40 + index * 8,
      source,
      usedAt: daysAgo(days, 15, index * 8),
      createdBy: parent._id,
      createdAt: daysAgo(days, 15, index * 8),
      updatedAt: daysAgo(days, 15, index * 8),
    })),
  );

  await Session.insertMany(
    [0, 2, 5].map((days, index) => ({
      kid: kid._id,
      startedAt: daysAgo(days, 16),
      endedAt: daysAgo(days, 16, 15),
      duration: 360 + index * 45,
      score: [76, 72, 80][index],
      scenario: scenarios[index % scenarios.length]?._id || null,
      actions: [{ type: "phrase_validated", payload: { score: [76, 72, 80][index] }, at: daysAgo(days, 16, 10) }],
      aiSummary: "Activite de demonstration pour le suivi parent.",
      createdBy: parent._id,
      recommendationsSnapshot: ["Continuer les phrases courtes.", "Repeter les demandes simples."],
      createdAt: daysAgo(days, 16),
      updatedAt: daysAgo(days, 16, 15),
    })),
  );

  await Recommendation.insertMany([
    {
      kid: kid._id,
      type: "scenario",
      title: "Routine de demande",
      content: "Rejouer deux demandes simples chaque jour.",
      relatedPictograms: pictograms.slice(0, 3),
      relatedScenario: scenarios[0]?._id || null,
      reason: "Donnees dashboard parent",
      generatedBy: "ai",
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  ]);

  return `${parent.firstName} ${parent.lastName}: ${kid.firstName} ${kid.lastName}`;
};

const run = async () => {
  await mongoose.connect(MONGO_URI);

  const therapist = await User.findOne({ email: "therapist1@autoconnect.app" }).select("_id");
  const pictograms = await pickPictograms();
  const scenarios = await Scenario.find({ isActive: true }).limit(4).select("_id title");
  const parents = await User.find({ role: "parent" });

  const emptyParents = [];
  for (const parent of parents) {
    const childCount = await Kid.countDocuments({ assignedParents: parent._id });
    if (childCount === 0 || parent.email === "salem77boubaker456@gmail.com") {
      emptyParents.push(parent);
    }
  }

  const rows = [];
  for (const parent of emptyParents) {
    rows.push(await ensureDashboardDataForParent(parent, therapist, pictograms, scenarios));
  }

  console.log(`Dashboard parent rempli pour ${rows.length} parent(s):`);
  rows.forEach((row) => console.log(`- ${row}`));
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
