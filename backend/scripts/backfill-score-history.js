const mongoose = require("mongoose");
const env = require("../src/config/env");
const { PhraseHistory } = require("../src/modules/history/phraseHistory.model");
const { ScoreHistory } = require("../src/modules/scores/scoreHistory.model");

const main = async () => {
  await mongoose.connect(env.mongodbUri);

  const histories = await PhraseHistory.find({ score: { $type: "number" } }).select("_id kid score generatedText usedAt");
  let created = 0;

  for (const history of histories) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await ScoreHistory.exists({ "basedOn.phraseHistory": history._id });
    if (exists) continue;

    // eslint-disable-next-line no-await-in-loop
    await ScoreHistory.create({
      kid: history.kid,
      scoreType: "phrase",
      value: history.score,
      explanation: "Score recupere depuis l'historique des phrases.",
      basedOn: { phraseHistory: history._id, generatedText: history.generatedText },
      createdBy: "system",
      createdAt: history.usedAt || history.createdAt,
      updatedAt: history.usedAt || history.updatedAt || history.createdAt,
    });
    created += 1;
  }

  console.log(`ScoreHistory backfill: ${created} entree(s) creee(s).`);
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
