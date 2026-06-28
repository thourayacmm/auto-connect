const mongoose = require("mongoose");
const env = require("../src/config/env");
const { Kid } = require("../src/modules/kids/kid.model");
const { Scenario } = require("../src/modules/scenarios/scenario.model");
require("../src/modules/pictograms/pictogram.model");

const levelRank = (level = "") => {
  const normalized = String(level).toLowerCase();
  if (normalized.includes("3") || normalized.includes("avanc")) return 3;
  if (normalized.includes("2") || normalized.includes("inter")) return 2;
  return 1;
};

const kidLevelRank = (kid) =>
  Math.max(
    levelRank(kid.trackingPreferences?.childLevel),
    levelRank(kid.currentLevel),
    levelRank(kid.communicationLevel),
  );

const main = async () => {
  await mongoose.connect(env.mongodbUri);

  const [kids, scenarios] = await Promise.all([
    Kid.find({ status: "active" }).select("_id firstName lastName currentLevel communicationLevel trackingPreferences"),
    Scenario.find({ isActive: true }).populate("pictogramSequence", "name"),
  ]);

  for (const scenario of scenarios) {
    if (!scenario.pictogramSequence.length) continue;

    const targetRank = levelRank(scenario.targetLevel);
    const assignedKids = kids.filter((kid) => kidLevelRank(kid) >= targetRank).map((kid) => kid._id);

    // eslint-disable-next-line no-await-in-loop
    await Scenario.updateOne({ _id: scenario._id }, { $set: { assignedKids } });
    console.log(
      `${scenario.title}: ${scenario.targetLevel || "Debutant"} -> ${assignedKids.length} enfant(s)`,
    );
  }

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
