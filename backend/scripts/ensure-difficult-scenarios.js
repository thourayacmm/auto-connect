const mongoose = require("mongoose");
const env = require("../src/config/env");
const { Category } = require("../src/modules/categories/category.model");
const { Kid } = require("../src/modules/kids/kid.model");
const { Pictogram } = require("../src/modules/pictograms/pictogram.model");
const { Scenario } = require("../src/modules/scenarios/scenario.model");
const { User } = require("../src/modules/users/user.model");
const { ROLES } = require("../src/constants/roles");

const scenarios = [
  {
    title: "Aller a la pharmacie",
    description: "L'enfant signale une douleur puis demande une aide adaptee.",
    childGoal: "J'ai mal Pharmacie Aide-moi",
    level: "Intermediaire",
    sequence: ["J'ai mal", "Pharmacie", "Aide-moi"],
  },
  {
    title: "Sortie au parc en bus",
    description: "L'enfant construit une phrase de sortie avec transport, lieu et emotion.",
    childGoal: "Bus Parc du Belvedere Je suis content",
    level: "Intermediaire",
    sequence: ["Bus", "Parc du Belvedere", "Je suis content"],
  },
  {
    title: "Demander pendant le repas",
    description: "L'enfant exprime un besoin alimentaire et implique un parent.",
    childGoal: "J'ai faim Couscous Maman",
    level: "Intermediaire",
    sequence: ["J'ai faim", "Couscous", "Maman"],
  },
  {
    title: "Retour a l'ecole",
    description: "L'enfant exprime une situation scolaire avec demande d'aide et emotion.",
    childGoal: "Ecole Aide-moi Je suis content",
    level: "Avance",
    sequence: ["Ecole", "Aide-moi", "Je suis content"],
  },
  {
    title: "Trajet en metro leger",
    description: "L'enfant prepare un trajet complexe avec transport, destination et besoin d'aide.",
    childGoal: "Metro leger Ecole Aide-moi",
    level: "Avance",
    sequence: ["Metro leger", "Ecole", "Aide-moi"],
  },
  {
    title: "Expliquer une emotion difficile",
    description: "L'enfant dit son emotion puis demande le soutien d'un parent.",
    childGoal: "Je suis triste Aide-moi Maman",
    level: "Avance",
    sequence: ["Je suis triste", "Aide-moi", "Maman"],
  },
];

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

  const creator =
    (await User.findOne({ role: ROLES.THERAPIST }).sort({ createdAt: 1 })) ||
    (await User.findOne({ role: ROLES.ADMIN }).sort({ createdAt: 1 }));
  const category = await Category.findOne({ name: "Actions" });
  const kids = await Kid.find({ status: "active" }).select("_id currentLevel communicationLevel trackingPreferences");
  const pictograms = await Pictogram.find({
    name: { $in: [...new Set(scenarios.flatMap((scenario) => scenario.sequence))] },
    isActive: true,
  }).select("_id name");
  const pictogramByName = Object.fromEntries(pictograms.map((pictogram) => [pictogram.name, pictogram]));

  for (const scenario of scenarios) {
    const pictogramSequence = scenario.sequence.map((name) => pictogramByName[name]?._id).filter(Boolean);
    if (pictogramSequence.length !== scenario.sequence.length) {
      throw new Error(`Pictogrammes manquants pour ${scenario.title}: ${scenario.sequence.join(", ")}`);
    }

    const assignedKids = kids
      .filter((kid) => kidLevelRank(kid) >= levelRank(scenario.level))
      .map((kid) => kid._id);

    // eslint-disable-next-line no-await-in-loop
    await Scenario.findOneAndUpdate(
      { title: scenario.title },
      {
        $set: {
          title: scenario.title,
          description: scenario.description,
          childGoal: scenario.childGoal,
          blockageHelp: "Si l'enfant bloque, reduire a deux choix puis guider le premier pictogramme.",
          steps: scenario.sequence,
          targetLevel: scenario.level,
          ageTarget: scenario.level,
          ageMin: 2,
          ageMax: 25,
          category: category?._id || null,
          pictogramSequence,
          assignedKids,
          estimatedDuration: 8,
          isActive: true,
          createdBy: creator?._id,
        },
      },
      { upsert: true, new: true },
    );
  }

  const saved = await Scenario.find({ title: { $in: scenarios.map((scenario) => scenario.title) } })
    .populate("pictogramSequence", "name")
    .select("title targetLevel isActive assignedKids pictogramSequence")
    .lean();

  saved.forEach((scenario) => {
    console.log(
      `${scenario.title}: ${scenario.targetLevel}, active=${scenario.isActive}, kids=${scenario.assignedKids.length}, pictos=${scenario.pictogramSequence
        .map((pictogram) => pictogram.name)
        .join(" > ")}`,
    );
  });

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
