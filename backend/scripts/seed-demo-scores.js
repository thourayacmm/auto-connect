/* eslint-disable no-console */
const { connectDb } = require("../src/config/db");
const { Kid } = require("../src/modules/kids/kid.model");
const { ScoreHistory } = require("../src/modules/scores/scoreHistory.model");

const seedDemoScores = async () => {
  await connectDb();

  const kids = await Kid.find({}).select("_id firstName lastName");
  let created = 0;

  for (const [index, kid] of kids.entries()) {
    const existing = await ScoreHistory.find({ kid: kid._id }).sort({ createdAt: -1 }).limit(5);

    if (existing.length && existing.some((entry) => Number(entry.value) > 0)) {
      continue;
    }

    const baseValue = 58 + (index % 6) * 5;
    const values = [baseValue, Math.min(96, baseValue + 8), Math.min(98, baseValue + 16)];

    await ScoreHistory.insertMany(
      values.map((value, offset) => ({
        kid: kid._id,
        scoreType: "demo-seed",
        value,
        explanation: `Score de démonstration généré pour ${kid.firstName || "l'enfant"}.`,
        basedOn: { seed: true, generatedAt: new Date().toISOString() },
        createdBy: "system",
        createdAt: new Date(Date.now() - (values.length - 1 - offset) * 24 * 60 * 60 * 1000),
      })),
    );

    created += values.length;
  }

  console.log(`Seeded ${created} demo score entries for ${kids.length} child(ren).`);
};

seedDemoScores()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed demo scores:", error);
    process.exit(1);
  });
