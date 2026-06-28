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

const pickPictograms = async (names) => {
  const pictograms = await Pictogram.find({ name: { $in: names }, isActive: true }).select("_id name");
  const byName = new Map(pictograms.map((item) => [item.name.toLowerCase(), item._id]));
  return names.map((name) => byName.get(name.toLowerCase())).filter(Boolean);
};

const run = async () => {
  await mongoose.connect(MONGO_URI);

  const therapist = await User.findOne({ email: "therapist1@autoconnect.app" }).select("_id email");
  const kid = await Kid.findOne({ firstName: /^mohamed$/i, lastName: /^yaya$/i });
  if (!therapist) throw new Error("Therapeute therapist1@autoconnect.app introuvable.");
  if (!kid) throw new Error("Enfant mohamed yaya introuvable.");

  await Kid.updateOne(
    { _id: kid._id },
    { $addToSet: { assignedTherapists: therapist._id }, $set: { status: "active" } },
  );

  const allPictoIds = await pickPictograms([
    "Je suis",
    "Content",
    "Aide-moi",
    "Boire",
    "Eau",
    "Manger",
    "Maman",
    "Medecin",
  ]);
  if (allPictoIds.length < 4) throw new Error("Pictogrammes insuffisants pour remplir le rapport.");

  const scenarios = await Scenario.find({ isActive: true }).limit(3).select("_id title");
  await Promise.all(
    scenarios.map((scenario) =>
      Scenario.updateOne({ _id: scenario._id }, { $addToSet: { assignedKids: kid._id } }),
    ),
  );

  await Promise.all([
    ScoreHistory.deleteMany({ kid: kid._id, "basedOn.seed": "yasmine-reports-data" }),
    PhraseHistory.deleteMany({ kid: kid._id, createdBy: therapist._id }),
    Session.deleteMany({ kid: kid._id, createdBy: therapist._id }),
    Recommendation.deleteMany({ kid: kid._id, reason: "Donnees rapport therapeute" }),
  ]);

  await ScoreHistory.insertMany([
    { kid: kid._id, scoreType: "communication", value: 76, explanation: "Phrase autonome reussie.", basedOn: { seed: "yasmine-reports-data" }, createdBy: "ai", createdAt: daysAgo(0, 9), updatedAt: daysAgo(0, 9) },
    { kid: kid._id, scoreType: "communication", value: 72, explanation: "Bonne selection des pictogrammes.", basedOn: { seed: "yasmine-reports-data" }, createdBy: "ai", createdAt: daysAgo(3, 10), updatedAt: daysAgo(3, 10) },
    { kid: kid._id, scoreType: "communication", value: 68, explanation: "Aide partielle necessaire.", basedOn: { seed: "yasmine-reports-data" }, createdBy: "ai", createdAt: daysAgo(7, 11), updatedAt: daysAgo(7, 11) },
    { kid: kid._id, scoreType: "communication", value: 81, explanation: "Objectif scenario atteint.", basedOn: { seed: "yasmine-reports-data" }, createdBy: "ai", createdAt: daysAgo(12, 9), updatedAt: daysAgo(12, 9) },
    { kid: kid._id, scoreType: "communication", value: 64, explanation: "Sequence incomplete puis corrigee.", basedOn: { seed: "yasmine-reports-data" }, createdBy: "ai", createdAt: daysAgo(18, 10), updatedAt: daysAgo(18, 10) },
  ]);

  const phraseRows = [
    ["Je suis content", 82, "manual", [0, 1], 0],
    ["Aide-moi", 73, "scenario", [2], 2],
    ["Je veux boire eau", 69, "manual", [3, 4], 5],
    ["Manger avec maman", 78, "scenario", [5, 6], 9],
    ["Medecin aide-moi", 58, "ai", [7, 2], 14],
    ["Je suis content", 86, "manual", [0, 1], 21],
  ];

  await PhraseHistory.insertMany(
    phraseRows.map(([text, score, source, indexes, days], index) => ({
      kid: kid._id,
      pictograms: indexes.map((itemIndex) => allPictoIds[itemIndex]).filter(Boolean),
      generatedText: text,
      correctedText: text,
      audioPlayed: true,
      score,
      duration: 35 + index * 8,
      source,
      usedAt: daysAgo(days, 15, index * 6),
      createdBy: therapist._id,
      createdAt: daysAgo(days, 15, index * 6),
      updatedAt: daysAgo(days, 15, index * 6),
    })),
  );

  await Session.insertMany(
    [0, 6, 13].map((days, index) => ({
      kid: kid._id,
      startedAt: daysAgo(days, 16, 10),
      endedAt: daysAgo(days, 16, 22),
      duration: 420 + index * 60,
      score: [76, 72, 81][index],
      scenario: scenarios[index % scenarios.length]?._id || null,
      actions: [
        { type: "pictogram_selected", payload: { count: 3 }, at: daysAgo(days, 16, 12) },
        { type: "phrase_validated", payload: { score: [76, 72, 81][index] }, at: daysAgo(days, 16, 18) },
      ],
      aiSummary: "Progression visible sur les phrases courtes et les demandes simples.",
      createdBy: therapist._id,
      recommendationsSnapshot: ["Continuer les scenarios courts.", "Renforcer les demandes d'aide."],
      createdAt: daysAgo(days, 16, 10),
      updatedAt: daysAgo(days, 16, 22),
    })),
  );

  await Recommendation.insertMany([
    {
      kid: kid._id,
      type: "scenario",
      title: "Renforcer les demandes simples",
      content: "Rejouer les demandes boire et aide-moi avec moins de guidance.",
      relatedPictograms: allPictoIds.slice(2, 5),
      relatedScenario: scenarios[0]?._id || null,
      reason: "Donnees rapport therapeute",
      generatedBy: "ai",
      createdAt: daysAgo(1, 12),
      updatedAt: daysAgo(1, 12),
    },
    {
      kid: kid._id,
      type: "pictogram",
      title: "Stabiliser les pictogrammes emotion",
      content: "Utiliser Je suis + emotion en debut de session.",
      relatedPictograms: allPictoIds.slice(0, 2),
      reason: "Donnees rapport therapeute",
      generatedBy: "ai",
      createdAt: daysAgo(4, 12),
      updatedAt: daysAgo(4, 12),
    },
  ]);

  console.log("Rapports IA remplis pour mohamed yaya: scores=5, phrases=6, sessions=3, suggestions=2.");
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
