const mongoose = require("mongoose");
require("dotenv").config();

const { Kid } = require("../src/modules/kids/kid.model");
const { Scenario } = require("../src/modules/scenarios/scenario.model");
const { ScoreHistory } = require("../src/modules/scores/scoreHistory.model");
const { User } = require("../src/modules/users/user.model");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auto_connect";

const deterministicScore = (kid) => {
  const name = `${kid.firstName} ${kid.lastName}`;
  const base = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 55 + (base % 31);
};

const ensureScore = async (kid, preferredScore = null) => {
  const existing = await ScoreHistory.exists({ kid: kid._id });
  if (existing) return false;

  await ScoreHistory.create({
    kid: kid._id,
    scoreType: "communication",
    value: preferredScore ?? deterministicScore(kid),
    explanation: "Score de demonstration ajoute pour verifier l affichage therapeute.",
    basedOn: { seed: "nahla-demo-data" },
    createdBy: "system",
  });

  return true;
};

const ensureScenarios = async (kid) => {
  const existingCount = await Scenario.countDocuments({ isActive: true, assignedKids: kid._id });
  if (existingCount > 0) return 0;

  const scenarios = await Scenario.find({
    isActive: true,
    targetLevel: { $in: ["Debutant", "Niveau 1", kid.currentLevel, kid.communicationLevel] },
  }).limit(5);

  await Promise.all(
    scenarios.map((scenario) =>
      Scenario.updateOne({ _id: scenario._id }, { $addToSet: { assignedKids: kid._id } }),
    ),
  );

  return scenarios.length;
};

const run = async () => {
  await mongoose.connect(MONGO_URI);

  const therapist = await User.findOne({ email: "therapist1@autoconnect.app" });
  if (!therapist) throw new Error("Therapeute therapist1@autoconnect.app introuvable.");

  const followedKidsForParents = await Kid.find({ assignedTherapists: therapist._id }).select("assignedParents");
  const linkedParentIds = followedKidsForParents.flatMap((kid) => kid.assignedParents || []);
  await User.updateMany(
    {
      role: "parent",
      $or: [
        { createdBy: therapist._id },
        { _id: { $in: linkedParentIds } },
      ],
    },
    { $set: { isActive: true } },
  );

  const sonia = await User.findOne({ email: "sonia.kammoun@autoconnect.app" });
  const youssef = sonia
    ? await Kid.findOne({ firstName: "Youssef", lastName: "Kammoun", assignedParents: sonia._id })
    : null;

  if (youssef) {
    await Kid.updateOne(
      { _id: youssef._id },
      { $addToSet: { assignedTherapists: therapist._id }, $set: { status: "active" } },
    );
    await ensureScore(youssef, 68);
    await ensureScenarios(youssef);
  }

  const kids = await Kid.find({ assignedTherapists: therapist._id });
  let scoresCreated = 0;
  let scenarioAssignments = 0;

  for (const kid of kids) {
    scoresCreated += (await ensureScore(kid)) ? 1 : 0;
    scenarioAssignments += await ensureScenarios(kid);
  }

  console.log(
    `Donnees Nahla Kefi verifiees: ${kids.length} enfant(s), ${scoresCreated} score(s) cree(s), ${scenarioAssignments} scenario(s) assigne(s).`,
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
