const mongoose = require("mongoose");
const env = require("../src/config/env");
const { Category } = require("../src/modules/categories/category.model");
const { Kid } = require("../src/modules/kids/kid.model");
const { Pictogram } = require("../src/modules/pictograms/pictogram.model");
const { Scenario } = require("../src/modules/scenarios/scenario.model");
const { User } = require("../src/modules/users/user.model");
const { ROLES } = require("../src/constants/roles");

const requiredPictograms = [
  {
    name: "J'ai soif",
    category: "Besoins essentiels",
    subcategory: "Faim et soif",
    icon: "Droplets",
    keywords: ["soif", "boire", "eau"],
  },
  {
    name: "Aide-moi",
    category: "Actions",
    subcategory: "Demandes",
    icon: "CircleHelp",
    keywords: ["aide", "demande"],
  },
  {
    name: "Je suis content",
    category: "Emotions",
    subcategory: "Joie",
    icon: "Laugh",
    keywords: ["content", "joie", "emotion"],
  },
];

const requiredScenarios = [
  {
    title: "Demander a boire",
    description: "Ecoute la consigne puis touche les pictogrammes dans l'ordre.",
    childGoal: "J'ai soif",
    sequence: ["J'ai soif"],
  },
  {
    title: "Demander de l'aide",
    description: "Ecoute la consigne puis touche les pictogrammes dans l'ordre.",
    childGoal: "Aide-moi",
    sequence: ["Aide-moi"],
  },
  {
    title: "Exprimer une emotion",
    description: "Ecoute la consigne puis touche les pictogrammes dans l'ordre.",
    childGoal: "Je suis content",
    sequence: ["Je suis content"],
  },
];

const getAdminUser = async () => {
  let admin = await User.findOne({ role: ROLES.ADMIN }).sort({ createdAt: 1 });
  if (admin) return admin;

  admin = await User.create({
    firstName: "Thuraya",
    lastName: "Admin",
    email: "admin@autoconnect.app",
    passwordHash: "seed-placeholder",
    role: ROLES.ADMIN,
    status: "active",
  });
  return admin;
};

const ensureCategory = async (name, createdBy) => {
  const existing = await Category.findOne({ name });
  if (existing) return existing;

  return Category.create({
    name,
    description: name,
    color: "#93c5fd",
    order: 99,
    createdBy,
  });
};

const ensureMohamed = async (createdBy) => {
  let kid = await Kid.findOne({ firstName: "Mohamed", lastName: "Jebali" });
  if (kid) {
    if (kid.status !== "active" || kid.currentLevel !== "Debutant") {
      kid.status = "active";
      kid.currentLevel = "Debutant";
      kid.communicationLevel = kid.communicationLevel || "Debutant";
      kid.trackingPreferences = {
        ...(kid.trackingPreferences || {}),
        childLevel: "Debutant",
      };
      await kid.save();
    }
    return kid;
  }

  kid = await Kid.create({
    firstName: "Mohamed",
    lastName: "Jebali",
    age: 7,
    currentLevel: "Debutant",
    communicationLevel: "Debutant",
    difficultyType: "Communication expressive",
    sessionAccessCode: "KID-MOHAMED-JEBALI",
    notes: "Compte enfant de test pour scenarios debutants.",
    trackingPreferences: {
      difficulty: "easy",
      recommendationFrequency: "daily",
      assignedScenariosMode: "guided",
      visualTheme: "soft",
      language: "fr",
      gridSize: "medium",
      childTheme: "sky",
      childVoice: "fr",
      childPictogramSize: "5",
      childSuggestions: "on",
      childLevel: "Debutant",
    },
    assignedParents: [],
    assignedTherapists: [],
    status: "active",
    createdBy,
  });

  return kid;
};

const main = async () => {
  await mongoose.connect(env.mongodbUri);

  const admin = await getAdminUser();
  const mohamed = await ensureMohamed(admin._id);

  const categoriesByName = {};
  for (const picto of requiredPictograms) {
    categoriesByName[picto.category] = await ensureCategory(picto.category, admin._id);
  }

  const pictogramsByName = {};
  for (const picto of requiredPictograms) {
    const category = categoriesByName[picto.category];
    const doc = await Pictogram.findOneAndUpdate(
      { name: picto.name },
      {
        $set: {
          name: picto.name,
          imageUrl: `https://api.dicebear.com/7.x/icons/svg?seed=${encodeURIComponent(picto.name)}`,
          category: category._id,
          subcategory: picto.subcategory,
          icon: picto.icon,
          keywords: picto.keywords,
          level: "Debutant",
          ageMin: 2,
          ageMax: 25,
          isActive: true,
          createdBy: admin._id,
        },
      },
      { upsert: true, new: true },
    );
    pictogramsByName[picto.name] = doc;
  }

  for (const scenario of requiredScenarios) {
    const sequence = scenario.sequence.map((name) => pictogramsByName[name]?._id).filter(Boolean);
    if (!sequence.length) {
      throw new Error(`Sequence vide pour le scenario ${scenario.title}`);
    }

    await Scenario.findOneAndUpdate(
      { title: scenario.title },
      {
        $set: {
          title: scenario.title,
          description: scenario.description,
          childGoal: scenario.childGoal,
          blockageHelp: "Si l'enfant bloque, proposer deux choix puis montrer le premier pictogramme attendu.",
          steps: scenario.sequence,
          targetLevel: "Debutant",
          ageTarget: "Debutant",
          ageMin: 2,
          ageMax: 25,
          category: categoriesByName.Actions?._id || categoriesByName["Besoins essentiels"]?._id,
          pictogramSequence: sequence,
          assignedKids: [mohamed._id],
          estimatedDuration: 5,
          isActive: true,
          createdBy: admin._id,
        },
      },
      { upsert: true, new: true },
    );
  }

  const scenarios = await Scenario.find({
    title: { $in: requiredScenarios.map((scenario) => scenario.title) },
    assignedKids: mohamed._id,
    isActive: true,
  }).populate("pictogramSequence", "name isActive");

  console.log(`Mohamed Jebali: ${mohamed._id}`);
  console.log(`Code enfant: ${mohamed.sessionAccessCode}`);
  scenarios.forEach((scenario) => {
    console.log(
      `${scenario.title}: active=${scenario.isActive}, pictos=${scenario.pictogramSequence
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
