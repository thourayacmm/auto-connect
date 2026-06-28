/* eslint-disable no-console */
const bcrypt = require("bcryptjs");
const { connectDb } = require("../src/config/db");
const { User } = require("../src/modules/users/user.model");
const { Kid } = require("../src/modules/kids/kid.model");
const { Category } = require("../src/modules/categories/category.model");
const { Pictogram } = require("../src/modules/pictograms/pictogram.model");
const { Scenario } = require("../src/modules/scenarios/scenario.model");
const { PhraseHistory } = require("../src/modules/history/phraseHistory.model");
const { Session } = require("../src/modules/sessions/session.model");
const { Recommendation } = require("../src/modules/recommendations/recommendation.model");
const { ScoreHistory } = require("../src/modules/scores/scoreHistory.model");
const { AccessControl } = require("../src/modules/access-control/accessControl.model");
const { AccessRequest, STATUSES } = require("../src/modules/access-requests/accessRequest.model");
const { AIInteraction } = require("../src/modules/ai/aiInteraction.model");
const { ROLES } = require("../src/constants/roles");
const { roleDefaultPermissions } = require("../src/constants/default-access");

const seed = async () => {
  await connectDb();

  const adminEmail = "admin@autoconnect.local";
  const adminPassword = "Admin@123456";
  const hash = await bcrypt.hash(adminPassword, 12);

  await User.updateOne(
    { email: adminEmail },
    {
      $setOnInsert: {
        firstName: "System",
        lastName: "Admin",
        email: adminEmail,
        passwordHash: hash,
        role: ROLES.ADMIN,
        language: "fr",
        isActive: true,
      },
    },
    { upsert: true },
  );

  const demoPassword = "demo123";
  const demoHash = await bcrypt.hash(demoPassword, 12);

  const upsertUser = async ({
    firstName,
    lastName,
    email,
    role,
    phone = "",
    specialty = "",
    address = "",
    createdBy = null,
    uiPreferences = {},
    avatar = null,
  }) => {
    await User.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          firstName,
          lastName,
          email: email.toLowerCase(),
          role,
          phone,
          specialty,
          address,
          createdBy,
          language: "fr",
          avatar,
          uiPreferences: {
            language: "fr",
            gridSize: "medium",
            childTheme: "sky",
            childVoice: "fr",
            childPictogramSize: "4",
            childSuggestions: "on",
            childLevel: "Debutant",
            ...uiPreferences,
          },
          isActive: true,
          passwordHash: demoHash,
        },
      },
      { upsert: true },
    );
    return User.findOne({ email: email.toLowerCase() });
  };

  const admin = await upsertUser({
    firstName: "Thuraya",
    lastName: "Admin",
    email: "admin@autoconnect.app",
    role: ROLES.ADMIN,
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Thuraya%20Admin",
  });

  const therapist1 = await upsertUser({
    firstName: "Nahla",
    lastName: "Kefi",
    email: "therapist1@autoconnect.app",
    role: ROLES.THERAPIST,
    specialty: "Orthophonie",
    createdBy: admin._id,
    phone: "+216 21 100 201",
    address: "Centre de reeducation, Ariana",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Yasmine%20Kefi",
  });

  const therapist2 = await upsertUser({
    firstName: "Sara",
    lastName: "Saidi",
    email: "therapist2@autoconnect.app",
    role: ROLES.THERAPIST,
    specialty: "Psychomotricite",
    createdBy: admin._id,
    phone: "+216 21 300 401",
    address: "Cabinet enfant, Tunis",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Malek%20Saidi",
  });

  const therapist3 = await upsertUser({
    firstName: "Imen",
    lastName: "Hakimi",
    email: "therapist3@autoconnect.app",
    role: ROLES.THERAPIST,
    specialty: "Orthophonie",
    createdBy: admin._id,
    phone: "+216 21 400 402",
    address: "Centre de langage, Sousse",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Imen%20Hakimi",
  });

  const therapist4 = await upsertUser({
    firstName: "Karim",
    lastName: "Mokhtar",
    email: "therapist4@autoconnect.app",
    role: ROLES.THERAPIST,
    specialty: "Psychologie",
    createdBy: admin._id,
    phone: "+216 21 500 503",
    address: "Clinique pediatrique, La Marsa",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Karim%20Mokhtar",
  });

  const therapist5 = await upsertUser({
    firstName: "Leila",
    lastName: "Ben Hassen",
    email: "therapist5@autoconnect.app",
    role: ROLES.THERAPIST,
    specialty: "Ergotherapie",
    createdBy: admin._id,
    phone: "+216 21 600 604",
    address: "Cabinet ergonomie, Manar",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Leila%20Ben%20Hassen",
  });

  const therapist6 = await upsertUser({
    firstName: "Aymen",
    lastName: "Zitouni",
    email: "therapist6@autoconnect.app",
    role: ROLES.THERAPIST,
    specialty: "Neuropsychologie",
    createdBy: admin._id,
    phone: "+216 21 700 705",
    address: "Centre autism, Tunis",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Aymen%20Zitouni",
  });

  const therapist7 = await upsertUser({
    firstName: "Nadia",
    lastName: "Triki",
    email: "therapist7@autoconnect.app",
    role: ROLES.THERAPIST,
    specialty: "Orthophonie",
    createdBy: admin._id,
    phone: "+216 21 800 806",
    address: "Cabinet enfant, Bardo",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Nadia%20Triki",
  });

  const parent1 = await upsertUser({
    firstName: "Meriem",
    lastName: "Salem",
    email: "parent1@autoconnect.app",
    role: ROLES.PARENT,
    phone: "+216 20 123 456",
    address: "Ariana, Tunisie",
    createdBy: therapist1._id,
    uiPreferences: {
      language: "fr",
      gridSize: "medium",
      childTheme: "mint",
      childVoice: "fr",
      childPictogramSize: "5",
      childSuggestions: "on",
      childLevel: "Debutant",
    },
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Meriem%20Ben%20Amor",
  });

  const parent2 = await upsertUser({
    firstName: "Fadwa",
    lastName: "Jouiri",
    email: "parent2@autoconnect.app",
    role: ROLES.PARENT,
    phone: "+216 22 456 789",
    address: "Tunis, Tunisie",
    createdBy: therapist1._id,
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Hela%20Trabelsi",
  });

  const parent3 = await upsertUser({
    firstName: "Sonia",
    lastName: "Neji",
    email: "parent3@autoconnect.app",
    role: ROLES.PARENT,
    phone: "+216 24 789 123",
    address: "Sfax, Tunisie",
    createdBy: therapist2._id,
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Sonia%20Kammoun",
  });

  const kids = [
    {
      firstName: "Sami",
      lastName: "Loutfi",
      age: 7,
      currentLevel: "Niveau 1",
      communicationLevel: "Debutant",
      difficultyType: "Communication expressive",
      sessionAccessCode: "KID-SAMI01",
      parent: parent1,
      therapist: therapist1,
      gender: "M",
      notes:
        "Sami communique mieux pendant les routines du matin. Il utilise deja quelques demandes simples et repond bien aux renforcements visuels.",
      trackingPreferences: {
        difficulty: "medium",
        recommendationFrequency: "daily",
        assignedScenariosMode: "guided",
        visualTheme: "soft",
        language: "fr",
        gridSize: "medium",
        childTheme: "mint",
        childVoice: "fr",
        childPictogramSize: "5",
        childSuggestions: "on",
        childLevel: "Debutant",
      },
    },
    {
      firstName: "Aya",
      lastName: "Dehbi",
      age: 9,
      currentLevel: "Niveau 2",
      communicationLevel: "Intermediaire",
      difficultyType: "Communication sociale",
      sessionAccessCode: "KID-AYA02",
      parent: parent2,
      therapist: therapist1,
      gender: "F",
      notes: "Aya est a l'aise avec les routines scolaires et progresse dans l'expression des emotions.",
      trackingPreferences: {
        difficulty: "medium",
        recommendationFrequency: "weekly",
        assignedScenariosMode: "standard",
        visualTheme: "soft",
        language: "fr",
        gridSize: "medium",
        childTheme: "sky",
        childVoice: "fr",
        childPictogramSize: "4",
        childSuggestions: "on",
        childLevel: "Intermediaire",
      },
    },
    {
      firstName: "Nour",
      lastName: "Mani",
      age: 5,
      currentLevel: "Niveau 1",
      communicationLevel: "Debutant",
      difficultyType: "Retard de langage",
      sessionAccessCode: "KID-NOUR03",
      parent: parent2,
      therapist: therapist1,
      gender: "F",
      notes: "Nour commence a pointer volontairement les pictogrammes besoins et actions.",
      trackingPreferences: {
        difficulty: "easy",
        recommendationFrequency: "daily",
        assignedScenariosMode: "guided",
        visualTheme: "soft",
        language: "fr",
        gridSize: "small",
        childTheme: "peach",
        childVoice: "fr",
        childPictogramSize: "5",
        childSuggestions: "on",
        childLevel: "Debutant",
      },
    },
    {
      firstName: "Youssef",
      lastName: "Fewal",
      age: 6,
      currentLevel: "Niveau 1",
      communicationLevel: "Debutant",
      difficultyType: "Demande par pictogrammes",
      sessionAccessCode: "KID-YOUS04",
      parent: parent3,
      therapist: therapist2,
      gender: "M",
      notes: "Youssef a besoin de sequences tres courtes et d'une repetition forte des pictogrammes de demande.",
      trackingPreferences: {
        difficulty: "medium",
        recommendationFrequency: "daily",
        assignedScenariosMode: "guided",
        visualTheme: "soft",
        language: "fr",
        gridSize: "small",
        childTheme: "sky",
        childVoice: "fr",
        childPictogramSize: "5",
        childSuggestions: "on",
        childLevel: "Debutant",
      },
    },
    {
      firstName: "Lina",
      lastName: "Kammoun",
      age: 8,
      currentLevel: "Niveau 2",
      communicationLevel: "Intermediaire",
      difficultyType: "Transitions difficiles",
      sessionAccessCode: "KID-LINA05",
      parent: parent3,
      therapist: therapist2,
      gender: "F",
      notes: "Lina reussit mieux quand les scenarios sont annonces a l'avance avec supports visuels.",
      trackingPreferences: {
        difficulty: "medium",
        recommendationFrequency: "weekly",
        assignedScenariosMode: "standard",
        visualTheme: "soft",
        language: "fr",
        gridSize: "medium",
        childTheme: "lilac",
        childVoice: "fr",
        childPictogramSize: "4",
        childSuggestions: "on",
        childLevel: "Intermediaire",
      },
    },
    {
      firstName: "Adam",
      lastName: "Kammoun",
      age: 10,
      currentLevel: "Niveau 3",
      communicationLevel: "Avance",
      difficultyType: "Interactions sociales",
      sessionAccessCode: "KID-ADAM06",
      parent: parent3,
      therapist: therapist2,
      gender: "M",
      notes: "Adam utilise deja des phrases plus longues et travaille surtout les interactions sociales.",
      trackingPreferences: {
        difficulty: "advanced",
        recommendationFrequency: "weekly",
        assignedScenariosMode: "adaptive",
        visualTheme: "soft",
        language: "fr",
        gridSize: "large",
        childTheme: "sky",
        childVoice: "fr",
        childPictogramSize: "4",
        childSuggestions: "on",
        childLevel: "Avance",
      },
    },
  ];

  const upsertKid = async (kid) => {
    await Kid.updateOne(
      { sessionAccessCode: kid.sessionAccessCode },
      {
        $set: {
          firstName: kid.firstName,
          lastName: kid.lastName,
          age: kid.age,
          gender: kid.gender,
          currentLevel: kid.currentLevel,
          communicationLevel: kid.communicationLevel,
          difficultyType: kid.difficultyType,
          sessionAccessCode: kid.sessionAccessCode,
          notes: kid.notes,
          trackingPreferences: kid.trackingPreferences,
          assignedParents: [kid.parent._id],
          assignedTherapists: [kid.therapist._id],
          status: "active",
          createdBy: kid.parent._id,
        },
      },
      { upsert: true },
    );

    return Kid.findOne({ sessionAccessCode: kid.sessionAccessCode });
  };

  const seededKidDocs = [];
  for (const kid of kids) {
    // eslint-disable-next-line no-await-in-loop
    seededKidDocs.push(await upsertKid(kid));
  }

  const defaultCategories = [
    { name: "Besoins essentiels", description: "Eau, toilettes, faim", color: "#93c5fd", order: 1 },
    { name: "Emotions", description: "Heureux, triste, peur", color: "#86efac", order: 2 },
    { name: "Nourriture", description: "Aliments, repas, fruits", color: "#fdba74", order: 3 },
    { name: "Actions", description: "Manger, boire, jouer", color: "#f9a8d4", order: 4 },
    { name: "Ecole", description: "Classe, livre, ecrire", color: "#fcd34d", order: 5 },
    { name: "Famille", description: "Parents, fratrie, proches", color: "#f0abfc", order: 6 },
    { name: "Sante", description: "Medecin, pharmacie, douleur", color: "#67e8f9", order: 7 },
    { name: "Transport", description: "Bus, taxi, voiture", color: "#c4b5fd", order: 8 },
    { name: "Activites", description: "Jeux, sport, musique, sorties", color: "#bef264", order: 9 },
  ];

  for (const category of defaultCategories) {
    // eslint-disable-next-line no-await-in-loop
    await Category.updateOne({ name: category.name }, { $setOnInsert: category }, { upsert: true });
  }

  const categoryDocs = await Category.find();
  const categoryByName = Object.fromEntries(categoryDocs.map((category) => [category.name, category]));
  const besoinsCategory = categoryByName["Besoins essentiels"] || categoryDocs[0];
  const emotionsCategory = categoryByName.Emotions || categoryDocs[0];
  const actionsCategory = categoryByName.Actions || categoryDocs[0];
  const ecoleCategory = categoryByName.Ecole || categoryDocs[0];
  const nourritureCategory = categoryByName.Nourriture || categoryDocs[0];
  const familleCategory = categoryByName.Famille || categoryDocs[0];
  const santeCategory = categoryByName.Sante || categoryDocs[0];
  const transportCategory = categoryByName.Transport || categoryDocs[0];
  const activitesCategory = categoryByName.Activites || categoryDocs[0];

  const pictogramSeed = [
    { name: "J'ai faim", category: besoinsCategory, subcategory: "Faim et soif", keywords: ["faim", "manger"], level: "Debutant" },
    { name: "J'ai soif", category: besoinsCategory, subcategory: "Faim et soif", keywords: ["soif", "boire", "eau"], level: "Debutant" },
    { name: "Aide-moi", category: actionsCategory, subcategory: "Demandes", keywords: ["aide", "demande"], level: "Debutant" },
    { name: "Pause", category: actionsCategory, subcategory: "Demandes", keywords: ["pause", "calme"], level: "Debutant" },
    { name: "Je suis content", category: emotionsCategory, subcategory: "Joie", keywords: ["content", "joie"], level: "Debutant" },
    { name: "Je suis triste", category: emotionsCategory, subcategory: "Tristesse", keywords: ["triste", "emotion"], level: "Intermediaire" },
    { name: "Ecole", category: ecoleCategory, subcategory: "Lieux scolaires", keywords: ["ecole", "classe"], level: "Intermediaire" },
    { name: "Je veux jouer", category: actionsCategory, subcategory: "Jeux", keywords: ["jouer", "jeu"], level: "Debutant" },
    { name: "Toilette", category: besoinsCategory, subcategory: "Hygiene", keywords: ["toilette", "WC"], level: "Debutant" },
    { name: "Lire", category: ecoleCategory, subcategory: "Apprentissages", keywords: ["lire", "lecture"], level: "Intermediaire" },
    { name: "Ecrire", category: ecoleCategory, subcategory: "Apprentissages", keywords: ["ecrire", "stylo"], level: "Intermediaire" },
    { name: "Donner", category: actionsCategory, subcategory: "Actions simples", keywords: ["donner", "passer"], level: "Debutant" },
    { name: "Prendre", category: actionsCategory, subcategory: "Actions simples", keywords: ["prendre", "attraper"], level: "Debutant" },
    { name: "Boire", category: besoinsCategory, subcategory: "Faim et soif", keywords: ["boire", "eau", "hydratation"], level: "Debutant" },
    { name: "Eau", category: besoinsCategory, subcategory: "Faim et soif", keywords: ["eau", "boire", "rafraichissement"], level: "Debutant" },
    { name: "Manger", category: nourritureCategory, subcategory: "Repas", keywords: ["manger", "nourriture", "repas"], level: "Debutant" },
    { name: "Pomme", category: nourritureCategory, subcategory: "Fruits", keywords: ["pomme", "fruit", "manger"], level: "Debutant" },
    { name: "Sandwich", category: nourritureCategory, subcategory: "Repas", keywords: ["sandwich", "repas", "manger"], level: "Debutant" },
    { name: "Couscous", category: nourritureCategory, subcategory: "Repas tunisiens", keywords: ["couscous", "repas", "manger", "tunisie"], level: "Intermediaire" },
    { name: "Lablabi", category: nourritureCategory, subcategory: "Repas tunisiens", keywords: ["lablabi", "repas", "pois chiche", "tunisie"], level: "Intermediaire" },
    { name: "Effraye", category: emotionsCategory, subcategory: "Peur", keywords: ["peur", "effraye"], level: "Intermediaire" },
    { name: "Calme", category: emotionsCategory, subcategory: "Calme", keywords: ["calme", "detendu"], level: "Debutant" },
    { name: "Maman", category: familleCategory, subcategory: "Parents", keywords: ["maman", "mere", "parent", "famille"], level: "Debutant" },
    { name: "Papa", category: familleCategory, subcategory: "Parents", keywords: ["papa", "pere", "famille"], level: "Debutant" },
    { name: "Frere", category: familleCategory, subcategory: "Fratrie", keywords: ["frere", "famille"], level: "Debutant" },
    { name: "Soeur", category: familleCategory, subcategory: "Fratrie", keywords: ["soeur", "famille"], level: "Debutant" },
    { name: "Medecin", category: santeCategory, subcategory: "Soins", keywords: ["medecin", "docteur", "sante"], level: "Intermediaire" },
    { name: "J'ai mal", category: santeCategory, subcategory: "Douleur", keywords: ["mal", "douleur", "sante"], level: "Debutant" },
    { name: "Pharmacie", category: santeCategory, subcategory: "Soins", keywords: ["pharmacie", "medicament", "sante"], level: "Intermediaire" },
    { name: "Taxi", category: transportCategory, subcategory: "Transport tunisien", keywords: ["taxi", "transport", "sortie"], level: "Intermediaire" },
    { name: "Metro leger", category: transportCategory, subcategory: "Transport tunisien", keywords: ["metro", "transport", "tunis"], level: "Avance" },
    { name: "Bus", category: transportCategory, subcategory: "Transport", keywords: ["bus", "transport", "ecole"], level: "Intermediaire" },
    { name: "Parc du Belvedere", category: activitesCategory, subcategory: "Sorties Tunis", keywords: ["parc", "belvedere", "sortie", "tunis"], level: "Intermediaire" },
    { name: "Plage de La Marsa", category: activitesCategory, subcategory: "Sorties Tunis", keywords: ["plage", "marsa", "sortie"], level: "Intermediaire" },
    { name: "Musique", category: activitesCategory, subcategory: "Loisirs", keywords: ["musique", "ecouter", "chanter"], level: "Debutant" },
  ];

  const pictogramsByName = {};
  const iconByPictogramName = {
    "J'ai faim": "Soup",
    "J'ai soif": "Droplets",
    "Aide-moi": "CircleHelp",
    Pause: "AlarmClock",
    "Je suis content": "Laugh",
    "Je suis triste": "BookHeart",
    Ecole: "School",
    "Je veux jouer": "Gamepad2",
    Toilette: "Toilet",
    Lire: "MessageCircle",
    Ecrire: "Pencil",
    Donner: "Gift",
    Prendre: "UserRound",
    Boire: "Coffee",
    Eau: "Sun",
    Manger: "Utensils",
    Pomme: "Apple",
    Sandwich: "Salad",
    Couscous: "Pizza",
    Lablabi: "Cookie",
    Effraye: "Ambulance",
    Calme: "Smile",
    Maman: "HeartHandshake",
    Papa: "Home",
    Frere: "Baby",
    Soeur: "Star",
    Medecin: "Stethoscope",
    "J'ai mal": "Activity",
    Pharmacie: "Pill",
    Taxi: "Car",
    "Metro leger": "Train",
    Bus: "Bus",
    "Parc du Belvedere": "Trees",
    "Plage de La Marsa": "MapPin",
    Musique: "Music",
  };

  for (const pictogram of pictogramSeed) {
    // eslint-disable-next-line no-await-in-loop
    await Pictogram.updateOne(
      { name: pictogram.name },
      {
        $set: {
          name: pictogram.name,
          imageUrl: `https://dummyimage.com/256x256/eef6ff/17233c&text=${encodeURIComponent(pictogram.name)}`,
          category: pictogram.category._id,
          keywords: pictogram.keywords,
          level: pictogram.level,
          icon: iconByPictogramName[pictogram.name] || "Bot",
          subcategory: pictogram.subcategory || "General",
          description: pictogram.subcategory || "",
          isActive: true,
          createdBy: admin._id,
        },
      },
      { upsert: true },
    );
    // eslint-disable-next-line no-await-in-loop
    pictogramsByName[pictogram.name] = await Pictogram.findOne({ name: pictogram.name });
  }

  const kidDocs = await Kid.find({ sessionAccessCode: { $in: kids.map((kid) => kid.sessionAccessCode) } });
  const kidByCode = Object.fromEntries(kidDocs.map((kid) => [kid.sessionAccessCode, kid]));

  // Additional demo parents requested for PFE screenshots
  const parentAhmed = await upsertUser({
    firstName: "Ahmed",
    lastName: "Kammoun",
    email: "ahmed.kammoun@autoconnect.app",
    role: ROLES.PARENT,
    phone: "+216 98 111 222",
    address: "Tunis",
    createdBy: therapist1._id,
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Ahmed%20Kammoun",
  });

  const parentSonia = await upsertUser({
    firstName: "Sonia",
    lastName: "Kammoun",
    email: "sonia.kammoun@autoconnect.app",
    role: ROLES.PARENT,
    phone: "+216 98 333 444",
    address: "Tunis",
    createdBy: therapist1._id,
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Sonia%20Kammoun",
  });

  const parentSami = await upsertUser({
    firstName: "Sami",
    lastName: "Ben Ali",
    email: "sami.benali@autoconnect.app",
    role: ROLES.PARENT,
    phone: "+216 98 555 666",
    address: "Ariana",
    createdBy: therapist2._id,
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Sami%20Ben%20Ali",
  });

  const parentMeriem = await upsertUser({
    firstName: "Meriem",
    lastName: "Ben Amor",
    email: "meriem.benamor@autoconnect.app",
    role: ROLES.PARENT,
    phone: "+216 98 777 888",
    address: "Sfax",
    createdBy: therapist2._id,
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Meriem%20Ben%20Amor",
  });

  const parentNour = await upsertUser({
    firstName: "Nour",
    lastName: "Trabelsi",
    email: "nour.trabelsi@autoconnect.app",
    role: ROLES.PARENT,
    phone: "+216 98 999 000",
    address: "Sousse",
    createdBy: therapist1._id,
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Nour%20Trabelsi",
  });

  const parentRania = await upsertUser({
    firstName: "Rania",
    lastName: "Mansouri",
    email: "rania.mansouri@autoconnect.app",
    role: ROLES.PARENT,
    phone: "+216 55 142 300",
    address: "La Marsa, Tunis",
    createdBy: therapist3._id,
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Rania%20Mansouri",
  });

  const parentHichem = await upsertUser({
    firstName: "Hichem",
    lastName: "Gharbi",
    email: "hichem.gharbi@autoconnect.app",
    role: ROLES.PARENT,
    phone: "+216 50 610 245",
    address: "Bardo, Tunis",
    createdBy: therapist4._id,
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Hichem%20Gharbi",
  });

  const parentAmel = await upsertUser({
    firstName: "Amel",
    lastName: "Masmoudi",
    email: "amel.masmoudi@autoconnect.app",
    role: ROLES.PARENT,
    phone: "+216 29 402 118",
    address: "Sahloul, Sousse",
    createdBy: therapist5._id,
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Amel%20Masmoudi",
  });

  const parentWalid = await upsertUser({
    firstName: "Walid",
    lastName: "Abidi",
    email: "walid.abidi@autoconnect.app",
    role: ROLES.PARENT,
    phone: "+216 97 733 910",
    address: "Sakiet Ezzit, Sfax",
    createdBy: therapist6._id,
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Walid%20Abidi",
  });

  // New kids to match requested demo data
  const extraKids = [
    {
      firstName: "Adam",
      lastName: "Kammoun",
      age: 7,
      currentLevel: "Debutant",
      communicationLevel: "Debutant",
      difficultyType: "Interactions sociales",
      sessionAccessCode: "KID-ADAM-KAM",
      parent: parentAhmed,
      therapist: therapist1,
      gender: "M",
      notes: "Adam aime jouer et repond bien aux renforcements visuels.",
      trackingPreferences: { childLevel: "Debutant" },
    },
    {
      firstName: "Lina",
      lastName: "Kammoun",
      age: 9,
      currentLevel: "Intermediaire",
      communicationLevel: "Intermediaire",
      difficultyType: "Transitions",
      sessionAccessCode: "KID-LINA-KAM",
      parent: parentAhmed,
      therapist: therapist1,
      gender: "F",
      notes: "Lina prefere les activites structurees et reussit mieux avec supports visuels.",
      trackingPreferences: { childLevel: "Intermediaire" },
    },
    {
      firstName: "Youssef",
      lastName: "Kammoun",
      age: 6,
      currentLevel: "Debutant",
      communicationLevel: "Debutant",
      difficultyType: "Demande par pictogrammes",
      sessionAccessCode: "KID-YOUS-KAM",
      parent: parentSonia,
      therapist: therapist2,
      gender: "M",
      notes: "Youssef travaille les demandes simples et reagit bien aux routines.",
      trackingPreferences: { childLevel: "Debutant" },
    },
    {
      firstName: "Nour",
      lastName: "Ben Ali",
      age: 8,
      currentLevel: "Intermediaire",
      communicationLevel: "Intermediaire",
      difficultyType: "Comprehension",
      sessionAccessCode: "KID-NOUR-BENALI",
      parent: parentSami,
      therapist: therapist2,
      gender: "F",
      notes: "Nour progresse en phrases simples et commence a generaliser.",
      trackingPreferences: { childLevel: "Intermediaire" },
    },
    {
      firstName: "Sami",
      lastName: "Ben Amor",
      age: 10,
      currentLevel: "Avance",
      communicationLevel: "Avance",
      difficultyType: "Communication avancée",
      sessionAccessCode: "KID-SAMI-BENAMOR",
      parent: parentMeriem,
      therapist: therapist2,
      gender: "M",
      notes: "Sami montre une bonne autonomie et travaille des phrases plus longues.",
      trackingPreferences: { childLevel: "Avance" },
    },
    {
      firstName: "Mariem",
      lastName: "Ben Amor",
      age: 7,
      currentLevel: "Debutant",
      communicationLevel: "Debutant",
      difficultyType: "Initiation communicative",
      sessionAccessCode: "KID-MARIEM-BENAMOR",
      parent: parentMeriem,
      therapist: therapist1,
      gender: "F",
      notes: "Mariem commence a pointer les pictogrammes besoins.",
      trackingPreferences: { childLevel: "Debutant" },
    },
    {
      firstName: "Yasmine",
      lastName: "Trabelsi",
      age: 9,
      currentLevel: "Intermediaire",
      communicationLevel: "Intermediaire",
      difficultyType: "Transitions scolaires",
      sessionAccessCode: "KID-YASM-TRAB",
      parent: parentNour,
      therapist: therapist1,
      gender: "F",
      notes: "Yasmine reussit mieux dans des contextes predictibles.",
      trackingPreferences: { childLevel: "Intermediaire" },
    },
    {
      firstName: "Malek",
      lastName: "Mansouri",
      age: 6,
      currentLevel: "Debutant",
      communicationLevel: "Debutant",
      difficultyType: "Demandes alimentaires",
      sessionAccessCode: "KID-MALEK-MANS",
      parent: parentRania,
      therapist: therapist3,
      gender: "M",
      notes: "Malek utilise surtout les pictogrammes nourriture et famille pendant les routines de repas.",
      trackingPreferences: {
        difficulty: "easy",
        recommendationFrequency: "daily",
        assignedScenariosMode: "guided",
        visualTheme: "soft",
        language: "fr",
        gridSize: "small",
        childTheme: "mint",
        childVoice: "fr",
        childPictogramSize: "5",
        childSuggestions: "on",
        childLevel: "Debutant",
      },
    },
    {
      firstName: "Ines",
      lastName: "Gharbi",
      age: 8,
      currentLevel: "Intermediaire",
      communicationLevel: "Intermediaire",
      difficultyType: "Anxiete lors des sorties",
      sessionAccessCode: "KID-INES-GHARBI",
      parent: parentHichem,
      therapist: therapist4,
      gender: "F",
      notes: "Ines travaille les transitions vers taxi, bus et sorties en famille.",
      trackingPreferences: {
        difficulty: "medium",
        recommendationFrequency: "weekly",
        assignedScenariosMode: "standard",
        visualTheme: "soft",
        language: "fr",
        gridSize: "medium",
        childTheme: "lilac",
        childVoice: "fr",
        childPictogramSize: "4",
        childSuggestions: "on",
        childLevel: "Intermediaire",
      },
    },
    {
      firstName: "Omar",
      lastName: "Masmoudi",
      age: 11,
      currentLevel: "Avance",
      communicationLevel: "Avance",
      difficultyType: "Expression de la douleur",
      sessionAccessCode: "KID-OMAR-MASM",
      parent: parentAmel,
      therapist: therapist5,
      gender: "M",
      notes: "Omar travaille la precision des phrases autour de la sante et des besoins complexes.",
      trackingPreferences: {
        difficulty: "advanced",
        recommendationFrequency: "weekly",
        assignedScenariosMode: "adaptive",
        visualTheme: "soft",
        language: "fr",
        gridSize: "large",
        childTheme: "sky",
        childVoice: "fr",
        childPictogramSize: "4",
        childSuggestions: "on",
        childLevel: "Avance",
      },
    },
    {
      firstName: "Mohamed",
      lastName: "Jebali",
      age: 7,
      currentLevel: "Debutant",
      communicationLevel: "Debutant",
      difficultyType: "Communication expressive",
      sessionAccessCode: "KID-4AULUD",
      parent: parentRania,
      therapist: therapist3,
      gender: "M",
      notes: "Mohamed utilise des demandes simples avec une sequence courte de pictogrammes.",
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
    },
    {
      firstName: "Rayen",
      lastName: "Abidi",
      age: 7,
      currentLevel: "Debutant",
      communicationLevel: "Debutant",
      difficultyType: "Initiation a la communication",
      sessionAccessCode: "KID-RAYEN-ABIDI",
      parent: parentWalid,
      therapist: therapist6,
      gender: "M",
      notes: "Rayen commence a choisir entre deux pictogrammes pour exprimer faim, soif et aide.",
      trackingPreferences: {
        difficulty: "easy",
        recommendationFrequency: "daily",
        assignedScenariosMode: "guided",
        visualTheme: "soft",
        language: "fr",
        gridSize: "small",
        childTheme: "peach",
        childVoice: "fr",
        childPictogramSize: "5",
        childSuggestions: "on",
        childLevel: "Debutant",
      },
    },
  ];

  // Upsert extra kids
  for (const ek of extraKids) {
    // eslint-disable-next-line no-await-in-loop
    await upsertKid(ek);
  }

  const allSeededKidDocs = await Kid.find({
    sessionAccessCode: { $in: [...kids, ...extraKids].map((kid) => kid.sessionAccessCode) },
  });

  const scenarioSeed = [
    {
      title: "Demander a boire",
      description: "Ecoute la consigne puis touche les pictogrammes dans l'ordre.",
      childGoal: "J'ai soif",
      steps: ["J'ai soif"],
      targetLevel: "Debutant",
      pictogramSequence: [pictogramsByName["J'ai soif"]?._id].filter(Boolean),
    },
    {
      title: "Demander de l'aide",
      description: "Ecoute la consigne puis touche les pictogrammes dans l'ordre.",
      childGoal: "Aide-moi",
      steps: ["Aide-moi"],
      targetLevel: "Debutant",
      pictogramSequence: [pictogramsByName["Aide-moi"]?._id].filter(Boolean),
    },
    {
      title: "Exprimer une emotion",
      description: "Ecoute la consigne puis touche les pictogrammes dans l'ordre.",
      childGoal: "Je suis content",
      steps: ["Je suis content"],
      targetLevel: "Debutant",
      pictogramSequence: [pictogramsByName["Je suis content"]?._id].filter(Boolean),
    },
    {
      title: "Routine du matin",
      description: "L'enfant enchaine besoins, actions et preparation pour l'ecole.",
      steps: ["Identifier le besoin", "Choisir l'action", "Valider la routine"],
      targetLevel: "Niveau 1",
      pictogramSequence: [
        pictogramsByName["J'ai faim"]?._id,
        pictogramsByName["J'ai soif"]?._id,
        pictogramsByName["Ecole"]?._id,
      ].filter(Boolean),
    },
    {
      title: "Repas tunisien en famille",
      description: "L'enfant choisit un repas familier et demande de l'aide si besoin.",
      steps: ["Choisir Manger", "Choisir Couscous ou Lablabi", "Ajouter Maman ou Papa"],
      targetLevel: "Intermediaire",
      pictogramSequence: [
        pictogramsByName.Manger?._id,
        pictogramsByName.Couscous?._id,
        pictogramsByName.Maman?._id,
      ].filter(Boolean),
    },
    {
      title: "Sortie a La Marsa",
      description: "L'enfant prepare une sortie en utilisant transport, lieu et emotion.",
      steps: ["Choisir Taxi", "Choisir Plage de La Marsa", "Exprimer son emotion"],
      targetLevel: "Intermediaire",
      pictogramSequence: [
        pictogramsByName.Taxi?._id,
        pictogramsByName["Plage de La Marsa"]?._id,
        pictogramsByName["Je suis content"]?._id,
      ].filter(Boolean),
    },
    {
      title: "Aller a la pharmacie",
      description: "L'enfant signale une douleur puis demande une aide adaptee.",
      childGoal: "J'ai mal Pharmacie Aide-moi",
      steps: ["J'ai mal", "Pharmacie", "Aide-moi"],
      targetLevel: "Intermediaire",
      pictogramSequence: [
        pictogramsByName["J'ai mal"]?._id,
        pictogramsByName.Pharmacie?._id,
        pictogramsByName["Aide-moi"]?._id,
      ].filter(Boolean),
    },
    {
      title: "Sortie au parc en bus",
      description: "L'enfant construit une phrase de sortie avec transport, lieu et emotion.",
      childGoal: "Bus Parc du Belvedere Je suis content",
      steps: ["Bus", "Parc du Belvedere", "Je suis content"],
      targetLevel: "Intermediaire",
      pictogramSequence: [
        pictogramsByName.Bus?._id,
        pictogramsByName["Parc du Belvedere"]?._id,
        pictogramsByName["Je suis content"]?._id,
      ].filter(Boolean),
    },
    {
      title: "Demander pendant le repas",
      description: "L'enfant exprime un besoin alimentaire et implique un parent.",
      childGoal: "J'ai faim Couscous Maman",
      steps: ["J'ai faim", "Couscous", "Maman"],
      targetLevel: "Intermediaire",
      pictogramSequence: [
        pictogramsByName["J'ai faim"]?._id,
        pictogramsByName.Couscous?._id,
        pictogramsByName.Maman?._id,
      ].filter(Boolean),
    },
    {
      title: "Retour a l'ecole",
      description: "L'enfant exprime une situation scolaire avec demande d'aide et emotion.",
      childGoal: "Ecole Aide-moi Je suis content",
      steps: ["Ecole", "Aide-moi", "Je suis content"],
      targetLevel: "Avance",
      pictogramSequence: [
        pictogramsByName.Ecole?._id,
        pictogramsByName["Aide-moi"]?._id,
        pictogramsByName["Je suis content"]?._id,
      ].filter(Boolean),
    },
    {
      title: "Trajet en metro leger",
      description: "L'enfant prepare un trajet complexe avec transport, destination et besoin d'aide.",
      childGoal: "Metro leger Ecole Aide-moi",
      steps: ["Metro leger", "Ecole", "Aide-moi"],
      targetLevel: "Avance",
      pictogramSequence: [
        pictogramsByName["Metro leger"]?._id,
        pictogramsByName.Ecole?._id,
        pictogramsByName["Aide-moi"]?._id,
      ].filter(Boolean),
    },
    {
      title: "Expliquer une emotion difficile",
      description: "L'enfant dit son emotion puis demande le soutien d'un parent.",
      childGoal: "Je suis triste Aide-moi Maman",
      steps: ["Je suis triste", "Aide-moi", "Maman"],
      targetLevel: "Avance",
      pictogramSequence: [
        pictogramsByName["Je suis triste"]?._id,
        pictogramsByName["Aide-moi"]?._id,
        pictogramsByName.Maman?._id,
      ].filter(Boolean),
    },
    {
      title: "Dire que j'ai mal",
      description: "L'enfant apprend a signaler une douleur et demander un adulte ou le medecin.",
      steps: ["Choisir J'ai mal", "Choisir Medecin", "Dire Aide-moi"],
      targetLevel: "Debutant",
      pictogramSequence: [
        pictogramsByName["J'ai mal"]?._id,
        pictogramsByName.Medecin?._id,
        pictogramsByName["Aide-moi"]?._id,
      ].filter(Boolean),
    },
  ];

  const seededScenarioTitles = scenarioSeed.map((scenario) => scenario.title);
  for (const scenario of scenarioSeed) {
    // eslint-disable-next-line no-await-in-loop
    await Scenario.updateOne(
      { title: scenario.title },
      {
        $set: {
          ...scenario,
          category: actionsCategory?._id || null,
          assignedKids: allSeededKidDocs
            .filter((kid) => {
              const target = scenario.targetLevel || "Debutant";
              const kidLevel = kid.trackingPreferences?.childLevel || kid.currentLevel || kid.communicationLevel;
              const rank = (value = "") => {
                const normalized = String(value).toLowerCase();
                if (normalized.includes("3") || normalized.includes("avanc")) return 3;
                if (normalized.includes("2") || normalized.includes("inter")) return 2;
                return 1;
              };
              return rank(kidLevel) >= rank(target);
            })
            .map((kid) => kid._id),
          createdBy: therapist1._id,
          estimatedDuration: 5,
          isActive: true,
        },
      },
      { upsert: true },
    );
  }

  const scenarioDocs = await Scenario.find({ title: { $in: seededScenarioTitles } });
  const scenarioByTitle = Object.fromEntries(scenarioDocs.map((scenario) => [scenario.title, scenario]));

  const demoKid = kidByCode["KID-SAMI01"];
  if (demoKid) {
    await Promise.all([
      PhraseHistory.deleteMany({ kid: demoKid._id }),
      Session.deleteMany({ kid: demoKid._id }),
      Recommendation.deleteMany({ kid: demoKid._id }),
      ScoreHistory.deleteMany({ kid: demoKid._id }),
    ]);

    const now = Date.now();
    const samiHistory = [
      {
        kid: demoKid._id,
        pictograms: [pictogramsByName["J'ai soif"]?._id].filter(Boolean),
        generatedText: "j'ai soif",
        correctedText: "J'ai soif.",
        audioPlayed: true,
        score: 58,
        duration: 42,
        source: "manual",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 6),
        createdBy: parent1._id,
      },
      {
        kid: demoKid._id,
        pictograms: [pictogramsByName["Aide-moi"]?._id].filter(Boolean),
        generatedText: "aide moi",
        correctedText: "Aide-moi.",
        audioPlayed: true,
        score: 64,
        duration: 39,
        source: "scenario",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 5),
        createdBy: therapist1._id,
      },
      {
        kid: demoKid._id,
        pictograms: [pictogramsByName["Je veux jouer"]?._id].filter(Boolean),
        generatedText: "je veux jouer",
        correctedText: "Je veux jouer.",
        audioPlayed: true,
        score: 67,
        duration: 36,
        source: "manual",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
        createdBy: parent1._id,
      },
      {
        kid: demoKid._id,
        pictograms: [pictogramsByName["Je suis content"]?._id].filter(Boolean),
        generatedText: "je suis content",
        correctedText: "Je suis content.",
        audioPlayed: true,
        score: 71,
        duration: 34,
        source: "scenario",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
        createdBy: therapist1._id,
      },
      {
        kid: demoKid._id,
        pictograms: [pictogramsByName["J'ai faim"]?._id, pictogramsByName["Ecole"]?._id].filter(Boolean),
        generatedText: "j'ai faim ecole",
        correctedText: "J'ai faim avant l'ecole.",
        audioPlayed: true,
        score: 74,
        duration: 33,
        source: "ai",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        createdBy: therapist1._id,
      },
      {
        kid: demoKid._id,
        pictograms: [pictogramsByName["J'ai soif"]?._id, pictogramsByName["Aide-moi"]?._id].filter(Boolean),
        generatedText: "j'ai soif aide moi",
        correctedText: "J'ai soif, aide-moi.",
        audioPlayed: true,
        score: 79,
        duration: 29,
        source: "scenario",
        usedAt: new Date(now - 1000 * 60 * 60 * 24),
        createdBy: parent1._id,
      },
    ];

    await PhraseHistory.insertMany(samiHistory);

    await Session.insertMany([
      {
        kid: demoKid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24 * 6),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 * 6 + 1000 * 60 * 7),
        duration: 420,
        score: 58,
        scenario: scenarioByTitle["Demander a boire"]?._id || null,
        actions: [
          { type: "phrase-started", payload: { labels: ["J'ai soif"] } },
          { type: "phrase-validated", payload: { sentence: "J'ai soif." } },
        ],
        aiSummary: "Sami identifie bien le besoin de boire mais hesite encore avant de valider sa phrase.",
        createdBy: parent1._id,
        recommendationsSnapshot: ["Reprendre le pictogramme J'ai soif dans des routines courtes."],
      },
      {
        kid: demoKid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 9),
        duration: 540,
        score: 71,
        scenario: scenarioByTitle["Exprimer une emotion"]?._id || null,
        actions: [
          { type: "emotion-selected", payload: { label: "Je suis content" } },
          { type: "phrase-validated", payload: { sentence: "Je suis content." } },
        ],
        aiSummary: "Bonne progression sur l'expression emotionnelle avec aide minimale du therapeute.",
        createdBy: therapist1._id,
        recommendationsSnapshot: ["Associer emotion et action utile dans la meme phrase."],
      },
      {
        kid: demoKid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 + 1000 * 60 * 11),
        duration: 660,
        score: 79,
        scenario: scenarioByTitle["Routine du matin"]?._id || null,
        actions: [
          { type: "routine-step", payload: { step: "Identifier le besoin" } },
          { type: "routine-step", payload: { step: "Choisir l'action" } },
          { type: "phrase-validated", payload: { sentence: "J'ai soif, aide-moi." } },
        ],
        aiSummary: "Session solide. Sami combine deux pictogrammes fonctionnels avec plus d'autonomie.",
        createdBy: parent1._id,
        recommendationsSnapshot: [
          "Passer a une phrase de 3 pictogrammes sur une routine familiere.",
          "Maintenir la synthese vocale active apres chaque validation.",
        ],
      },
    ]);

    await ScoreHistory.insertMany([
      {
        kid: demoKid._id,
        scoreType: "ai-score",
        value: 58,
        explanation: "Premiere demande simple validee avec soutien parental.",
        basedOn: { phraseCount: 1, distinctPictograms: 1 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 6),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 6),
      },
      {
        kid: demoKid._id,
        scoreType: "ai-score",
        value: 64,
        explanation: "Meilleure autonomie sur le pictogramme d'aide.",
        basedOn: { phraseCount: 1, distinctPictograms: 1 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 5),
      },
      {
        kid: demoKid._id,
        scoreType: "ai-score",
        value: 67,
        explanation: "Demande de jeu comprise et validee rapidement.",
        basedOn: { phraseCount: 1, distinctPictograms: 1 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
      },
      {
        kid: demoKid._id,
        scoreType: "ai-score",
        value: 71,
        explanation: "Expression emotionnelle reussie pendant scenario guide.",
        basedOn: { phraseCount: 1, distinctPictograms: 1 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
      },
      {
        kid: demoKid._id,
        scoreType: "ai-score",
        value: 74,
        explanation: "Association de deux notions dans le contexte scolaire.",
        basedOn: { phraseCount: 1, distinctPictograms: 2 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
      },
      {
        kid: demoKid._id,
        scoreType: "ai-score",
        value: 79,
        explanation: "Bonne combinaison de besoins et demande d'aide avec guidance legere.",
        basedOn: { phraseCount: 1, distinctPictograms: 2 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24),
      },
    ]);

    await Recommendation.insertMany([
      {
        kid: demoKid._id,
        type: "pictogram",
        title: "Renforcer les besoins quotidiens",
        content: "Travailler J'ai soif et J'ai faim dans les routines du matin et du gouter.",
        relatedPictograms: [pictogramsByName["J'ai soif"]?._id, pictogramsByName["J'ai faim"]?._id].filter(Boolean),
        reason: "Ces pictogrammes sont compris et produisent deja des reussites rapides.",
        generatedBy: "ai",
      },
      {
        kid: demoKid._id,
        type: "scenario",
        title: "Routine du matin a poursuivre",
        content: "Rejouer le scenario Routine du matin 3 fois cette semaine avec guidance reduite.",
        relatedScenario: scenarioByTitle["Routine du matin"]?._id || null,
        reason: "Sami progresse quand les etapes sont previsibles et contextualisees.",
        generatedBy: "therapist",
      },
      {
        kid: demoKid._id,
        type: "message",
        title: "Conseil parent",
        content: "Laisser 3 secondes avant d'aider pour encourager l'initiative de Sami.",
        reason: "Le temps d'attente favorise une meilleure autonomie expressive.",
        generatedBy: "system",
      },
      {
        kid: demoKid._id,
        type: "level",
        title: "Preparation au niveau suivant",
        content: "Introduire une phrase de 3 pictogrammes si le score reste au-dessus de 75 cette semaine.",
        reason: "La progression recente montre une stabilite sur les demandes simples.",
        generatedBy: "ai",
      },
    ]);
  }

  const ayaKid = kidByCode["KID-AYA02"];
  if (ayaKid) {
    await Promise.all([
      PhraseHistory.deleteMany({ kid: ayaKid._id }),
      Session.deleteMany({ kid: ayaKid._id }),
      Recommendation.deleteMany({ kid: ayaKid._id }),
      ScoreHistory.deleteMany({ kid: ayaKid._id }),
    ]);

    const now = Date.now();

    await PhraseHistory.insertMany([
      {
        kid: ayaKid._id,
        pictograms: [pictogramsByName["Je suis content"]?._id, pictogramsByName["Ecole"]?._id].filter(Boolean),
        generatedText: "je suis contente ecole",
        correctedText: "Je suis content a l'ecole.",
        audioPlayed: true,
        score: 73,
        duration: 31,
        source: "scenario",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
        createdBy: therapist1._id,
      },
      {
        kid: ayaKid._id,
        pictograms: [pictogramsByName["Je suis triste"]?._id, pictogramsByName["Aide-moi"]?._id].filter(Boolean),
        generatedText: "je suis triste aide moi",
        correctedText: "Je suis triste, aide-moi.",
        audioPlayed: true,
        score: 77,
        duration: 29,
        source: "ai",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        createdBy: parent2._id,
      },
      {
        kid: ayaKid._id,
        pictograms: [pictogramsByName["Je veux jouer"]?._id, pictogramsByName["Je suis content"]?._id].filter(Boolean),
        generatedText: "je veux jouer je suis contente",
        correctedText: "Je veux jouer, je suis contente.",
        audioPlayed: true,
        score: 82,
        duration: 25,
        source: "manual",
        usedAt: new Date(now - 1000 * 60 * 60 * 24),
        createdBy: parent2._id,
      },
    ]);

    await Session.insertMany([
      {
        kid: ayaKid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 * 4 + 1000 * 60 * 8),
        duration: 480,
        score: 73,
        scenario: scenarioByTitle["Exprimer une emotion"]?._id || null,
        actions: [{ type: "emotion-selected", payload: { label: "Je suis content" } }],
        aiSummary: "Aya reconnait et verbalise de mieux en mieux son emotion en contexte scolaire.",
        createdBy: therapist1._id,
        recommendationsSnapshot: ["Associer l'emotion avec un lieu connu comme l'ecole."],
      },
      {
        kid: ayaKid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 + 1000 * 60 * 10),
        duration: 600,
        score: 82,
        scenario: scenarioByTitle["Routine du matin"]?._id || null,
        actions: [{ type: "phrase-validated", payload: { sentence: "Je veux jouer, je suis contente." } }],
        aiSummary: "Aya enchaine des sequences plus longues avec un bon maintien de l'attention.",
        createdBy: therapist1._id,
        recommendationsSnapshot: ["Introduire une phrase de 3 pictogrammes sur des routines sociales."],
      },
    ]);

    await ScoreHistory.insertMany([
      {
        kid: ayaKid._id,
        scoreType: "ai-score",
        value: 73,
        explanation: "Aya verbalise une emotion avec support scenario.",
        basedOn: { phraseCount: 1, distinctPictograms: 2 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
      },
      {
        kid: ayaKid._id,
        scoreType: "ai-score",
        value: 77,
        explanation: "Aya reformule une emotion puis demande de l'aide.",
        basedOn: { phraseCount: 1, distinctPictograms: 2 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
      },
      {
        kid: ayaKid._id,
        scoreType: "ai-score",
        value: 82,
        explanation: "Aya combine jeu et emotion positive dans une phrase plus longue.",
        basedOn: { phraseCount: 1, distinctPictograms: 2 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24),
      },
    ]);

    await Recommendation.insertMany([
      {
        kid: ayaKid._id,
        type: "scenario",
        title: "Renforcer les routines sociales",
        content: "Continuer les scenarios emotions + ecole pour consolider l'expression sociale.",
        relatedScenario: scenarioByTitle["Exprimer une emotion"]?._id || null,
        reason: "Aya progresse quand l'activite est contextualisee par une situation sociale familiere.",
        generatedBy: "therapist",
      },
      {
        kid: ayaKid._id,
        type: "level",
        title: "Preparer le niveau 3",
        content: "Ajouter une consigne avec trois pictogrammes quand le score reste au-dessus de 80.",
        reason: "Les derniers scores montrent une progression stable vers l'autonomie.",
        generatedBy: "ai",
      },
    ]);
  }

  const nourKid = kidByCode["KID-NOUR03"];
  if (nourKid) {
    await Promise.all([
      PhraseHistory.deleteMany({ kid: nourKid._id }),
      Session.deleteMany({ kid: nourKid._id }),
      Recommendation.deleteMany({ kid: nourKid._id }),
      ScoreHistory.deleteMany({ kid: nourKid._id }),
    ]);

    const now = Date.now();

    await PhraseHistory.insertMany([
      {
        kid: nourKid._id,
        pictograms: [pictogramsByName["J'ai faim"]?._id].filter(Boolean),
        generatedText: "j'ai faim",
        correctedText: "J'ai faim.",
        audioPlayed: true,
        score: 49,
        duration: 44,
        source: "manual",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
        createdBy: parent2._id,
      },
      {
        kid: nourKid._id,
        pictograms: [pictogramsByName["J'ai soif"]?._id].filter(Boolean),
        generatedText: "j'ai soif",
        correctedText: "J'ai soif.",
        audioPlayed: true,
        score: 56,
        duration: 41,
        source: "scenario",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        createdBy: therapist1._id,
      },
      {
        kid: nourKid._id,
        pictograms: [pictogramsByName["Aide-moi"]?._id].filter(Boolean),
        generatedText: "aide moi",
        correctedText: "Aide-moi.",
        audioPlayed: true,
        score: 62,
        duration: 38,
        source: "scenario",
        usedAt: new Date(now - 1000 * 60 * 60 * 24),
        createdBy: therapist1._id,
      },
    ]);

    await Session.insertMany([
      {
        kid: nourKid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 6),
        duration: 360,
        score: 56,
        scenario: scenarioByTitle["Demander a boire"]?._id || null,
        actions: [{ type: "phrase-validated", payload: { sentence: "J'ai soif." } }],
        aiSummary: "Nour commence a valider seule une demande simple avec soutien verbal leger.",
        createdBy: therapist1._id,
        recommendationsSnapshot: ["Repeter le scenario avec un choix visuel tres reduit."],
      },
      {
        kid: nourKid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 + 1000 * 60 * 7),
        duration: 420,
        score: 62,
        scenario: scenarioByTitle["Demander de l'aide"]?._id || null,
        actions: [{ type: "phrase-validated", payload: { sentence: "Aide-moi." } }],
        aiSummary: "Nour utilise plus rapidement le pictogramme de demande d'aide.",
        createdBy: therapist1._id,
        recommendationsSnapshot: ["Generaliser le pictogramme Aide-moi dans deux routines maison."],
      },
    ]);

    await ScoreHistory.insertMany([
      {
        kid: nourKid._id,
        scoreType: "ai-score",
        value: 49,
        explanation: "Nour commence a pointer le bon pictogramme besoin.",
        basedOn: { phraseCount: 1, distinctPictograms: 1 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
      },
      {
        kid: nourKid._id,
        scoreType: "ai-score",
        value: 56,
        explanation: "Demande de boisson mieux comprise en seance guidee.",
        basedOn: { phraseCount: 1, distinctPictograms: 1 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
      },
      {
        kid: nourKid._id,
        scoreType: "ai-score",
        value: 62,
        explanation: "Nour commence a demander de l'aide avec moins de guidance.",
        basedOn: { phraseCount: 1, distinctPictograms: 1 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24),
      },
    ]);

    await Recommendation.insertMany([
      {
        kid: nourKid._id,
        type: "pictogram",
        title: "Consolider les demandes simples",
        content: "Rejouer J'ai faim, J'ai soif et Aide-moi dans un meme support visuel tres simple.",
        relatedPictograms: [
          pictogramsByName["J'ai faim"]?._id,
          pictogramsByName["J'ai soif"]?._id,
          pictogramsByName["Aide-moi"]?._id,
        ].filter(Boolean),
        reason: "Ces pictogrammes sont ceux que Nour reconnait le mieux actuellement.",
        generatedBy: "ai",
      },
    ]);
  }

  const youssefKid = kidByCode["KID-YOUS04"];
  if (youssefKid) {
    await Promise.all([
      PhraseHistory.deleteMany({ kid: youssefKid._id }),
      Session.deleteMany({ kid: youssefKid._id }),
      Recommendation.deleteMany({ kid: youssefKid._id }),
      ScoreHistory.deleteMany({ kid: youssefKid._id }),
    ]);

    const now = Date.now();

    await PhraseHistory.insertMany([
      {
        kid: youssefKid._id,
        pictograms: [pictogramsByName["Aide-moi"]?._id].filter(Boolean),
        generatedText: "aide moi",
        correctedText: "Aide-moi.",
        audioPlayed: true,
        score: 52,
        duration: 40,
        source: "manual",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
        createdBy: parent3._id,
      },
      {
        kid: youssefKid._id,
        pictograms: [pictogramsByName["Pause"]?._id].filter(Boolean),
        generatedText: "pause",
        correctedText: "Pause.",
        audioPlayed: true,
        score: 57,
        duration: 35,
        source: "scenario",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        createdBy: therapist2._id,
      },
      {
        kid: youssefKid._id,
        pictograms: [pictogramsByName["J'ai soif"]?._id, pictogramsByName["Aide-moi"]?._id].filter(Boolean),
        generatedText: "j'ai soif aide moi",
        correctedText: "J'ai soif, aide-moi.",
        audioPlayed: true,
        score: 61,
        duration: 33,
        source: "ai",
        usedAt: new Date(now - 1000 * 60 * 60 * 24),
        createdBy: therapist2._id,
      },
    ]);

    await Session.insertMany([
      {
        kid: youssefKid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 6),
        duration: 360,
        score: 57,
        scenario: scenarioByTitle["Demander de l'aide"]?._id || null,
        actions: [{ type: "phrase-validated", payload: { sentence: "Pause." } }],
        aiSummary: "Youssef commence a utiliser les demandes de regulation avec moins d'aide.",
        createdBy: therapist2._id,
        recommendationsSnapshot: ["Conserver des sessions tres courtes avec deux choix visibles maximum."],
      },
      {
        kid: youssefKid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 + 1000 * 60 * 7),
        duration: 420,
        score: 61,
        scenario: scenarioByTitle["Demander a boire"]?._id || null,
        actions: [{ type: "phrase-validated", payload: { sentence: "J'ai soif, aide-moi." } }],
        aiSummary: "Youssef combine deux intentions fonctionnelles dans une meme production.",
        createdBy: therapist2._id,
        recommendationsSnapshot: ["Travailler une demande de boisson avant chaque pause pour generaliser."],
      },
    ]);

    await ScoreHistory.insertMany([
      {
        kid: youssefKid._id,
        scoreType: "ai-score",
        value: 52,
        explanation: "Premiers essais de demande d'aide stabilises.",
        basedOn: { phraseCount: 1, distinctPictograms: 1 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
      },
      {
        kid: youssefKid._id,
        scoreType: "ai-score",
        value: 57,
        explanation: "Meilleure regulation grace au pictogramme Pause.",
        basedOn: { phraseCount: 1, distinctPictograms: 1 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
      },
      {
        kid: youssefKid._id,
        scoreType: "ai-score",
        value: 61,
        explanation: "Association de besoin et demande d'aide plus autonome.",
        basedOn: { phraseCount: 1, distinctPictograms: 2 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24),
      },
    ]);

    await Recommendation.insertMany([
      {
        kid: youssefKid._id,
        type: "message",
        title: "Raccourcir les seances",
        content: "Faire 2 micro-seances de 5 minutes plutot qu'une longue seance continue.",
        reason: "Youssef reussit mieux quand l'effort est fragmente.",
        generatedBy: "therapist",
      },
      {
        kid: youssefKid._id,
        type: "pictogram",
        title: "Renforcer Pause et Aide-moi",
        content: "Mettre les pictogrammes Pause et Aide-moi au debut de la grille enfant.",
        relatedPictograms: [pictogramsByName["Pause"]?._id, pictogramsByName["Aide-moi"]?._id].filter(Boolean),
        reason: "Ces deux pictogrammes soutiennent la regulation de l'enfant.",
        generatedBy: "ai",
      },
    ]);
  }

  const linaKid = kidByCode["KID-LINA05"];
  if (linaKid) {
    await Promise.all([
      PhraseHistory.deleteMany({ kid: linaKid._id }),
      Session.deleteMany({ kid: linaKid._id }),
      Recommendation.deleteMany({ kid: linaKid._id }),
      ScoreHistory.deleteMany({ kid: linaKid._id }),
    ]);

    const now = Date.now();

    await PhraseHistory.insertMany([
      {
        kid: linaKid._id,
        pictograms: [pictogramsByName["Ecole"]?._id, pictogramsByName["Pause"]?._id].filter(Boolean),
        generatedText: "ecole pause",
        correctedText: "Pause a l'ecole.",
        audioPlayed: true,
        score: 69,
        duration: 28,
        source: "scenario",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
        createdBy: therapist2._id,
      },
      {
        kid: linaKid._id,
        pictograms: [pictogramsByName["Je suis triste"]?._id, pictogramsByName["Aide-moi"]?._id].filter(Boolean),
        generatedText: "je suis triste aide moi",
        correctedText: "Je suis triste, aide-moi.",
        audioPlayed: true,
        score: 74,
        duration: 30,
        source: "ai",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        createdBy: parent3._id,
      },
      {
        kid: linaKid._id,
        pictograms: [pictogramsByName["Je suis content"]?._id, pictogramsByName["Ecole"]?._id].filter(Boolean),
        generatedText: "je suis contente ecole",
        correctedText: "Je suis contente a l'ecole.",
        audioPlayed: true,
        score: 78,
        duration: 26,
        source: "manual",
        usedAt: new Date(now - 1000 * 60 * 60 * 24),
        createdBy: parent3._id,
      },
    ]);

    await Session.insertMany([
      {
        kid: linaKid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 * 4 + 1000 * 60 * 8),
        duration: 480,
        score: 69,
        scenario: scenarioByTitle["Routine du matin"]?._id || null,
        actions: [{ type: "transition-support", payload: { context: "ecole" } }],
        aiSummary: "Lina utilise mieux les pictogrammes de transition quand le contexte est annonce.",
        createdBy: therapist2._id,
        recommendationsSnapshot: ["Utiliser le meme support visuel avant chaque sortie scolaire."],
      },
      {
        kid: linaKid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 + 1000 * 60 * 9),
        duration: 540,
        score: 78,
        scenario: scenarioByTitle["Exprimer une emotion"]?._id || null,
        actions: [{ type: "phrase-validated", payload: { sentence: "Je suis contente a l'ecole." } }],
        aiSummary: "Lina generalise mieux les pictogrammes emotionnels aux routines scolaires.",
        createdBy: therapist2._id,
        recommendationsSnapshot: ["Introduire une anticipation visuelle de la transition suivante."],
      },
    ]);

    await ScoreHistory.insertMany([
      {
        kid: linaKid._id,
        scoreType: "ai-score",
        value: 69,
        explanation: "Bonne comprehension de la routine, expression encore breve.",
        basedOn: { phraseCount: 1, distinctPictograms: 2 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
      },
      {
        kid: linaKid._id,
        scoreType: "ai-score",
        value: 74,
        explanation: "Lina formule mieux son emotion et sa demande d'aide.",
        basedOn: { phraseCount: 1, distinctPictograms: 2 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
      },
      {
        kid: linaKid._id,
        scoreType: "ai-score",
        value: 78,
        explanation: "Bonne generalisation d'une phrase emotionnelle contextualisee.",
        basedOn: { phraseCount: 1, distinctPictograms: 2 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24),
      },
    ]);

    await Recommendation.insertMany([
      {
        kid: linaKid._id,
        type: "scenario",
        title: "Stabiliser les transitions ecole-maison",
        content: "Rejouer deux fois par semaine un scenario de transition annoncee avec pictogrammes.",
        relatedScenario: scenarioByTitle["Routine du matin"]?._id || null,
        reason: "Les transitions restent le principal facteur de stress pour Lina.",
        generatedBy: "therapist",
      },
      {
        kid: linaKid._id,
        type: "level",
        title: "Poursuivre le niveau intermediaire",
        content: "Maintenir des phrases de 2 a 3 pictogrammes en contexte scolaire.",
        reason: "Le niveau actuel reste pertinent mais la stabilite progresse.",
        generatedBy: "ai",
      },
    ]);
  }

  const adamKid = kidByCode["KID-ADAM06"];
  if (adamKid) {
    await Promise.all([
      PhraseHistory.deleteMany({ kid: adamKid._id }),
      Session.deleteMany({ kid: adamKid._id }),
      Recommendation.deleteMany({ kid: adamKid._id }),
      ScoreHistory.deleteMany({ kid: adamKid._id }),
    ]);

    const now = Date.now();

    await PhraseHistory.insertMany([
      {
        kid: adamKid._id,
        pictograms: [pictogramsByName["Je veux jouer"]?._id, pictogramsByName["Ecole"]?._id].filter(Boolean),
        generatedText: "je veux jouer apres ecole",
        correctedText: "Je veux jouer apres l'ecole.",
        audioPlayed: true,
        score: 84,
        duration: 24,
        source: "manual",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
        createdBy: parent3._id,
      },
      {
        kid: adamKid._id,
        pictograms: [pictogramsByName["Je suis triste"]?._id, pictogramsByName["Pause"]?._id].filter(Boolean),
        generatedText: "je suis triste pause",
        correctedText: "Je suis triste, j'ai besoin d'une pause.",
        audioPlayed: true,
        score: 87,
        duration: 22,
        source: "ai",
        usedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        createdBy: therapist2._id,
      },
      {
        kid: adamKid._id,
        pictograms: [pictogramsByName["Aide-moi"]?._id, pictogramsByName["Ecole"]?._id, pictogramsByName["Je suis content"]?._id].filter(Boolean),
        generatedText: "aide moi ecole je suis content",
        correctedText: "Aide-moi a l'ecole, je suis content.",
        audioPlayed: true,
        score: 91,
        duration: 21,
        source: "scenario",
        usedAt: new Date(now - 1000 * 60 * 60 * 24),
        createdBy: therapist2._id,
      },
    ]);

    await Session.insertMany([
      {
        kid: adamKid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 12),
        duration: 720,
        score: 87,
        scenario: scenarioByTitle["Exprimer une emotion"]?._id || null,
        actions: [{ type: "phrase-validated", payload: { sentence: "Je suis triste, j'ai besoin d'une pause." } }],
        aiSummary: "Adam combine emotion, besoin et contexte avec une bonne autonomie.",
        createdBy: therapist2._id,
        recommendationsSnapshot: ["Passer a des sequences de conversation en deux tours."],
      },
      {
        kid: adamKid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 + 1000 * 60 * 13),
        duration: 780,
        score: 91,
        scenario: scenarioByTitle["Routine du matin"]?._id || null,
        actions: [{ type: "phrase-validated", payload: { sentence: "Aide-moi a l'ecole, je suis content." } }],
        aiSummary: "Adam atteint un tres bon niveau de structuration de phrase multi-intention.",
        createdBy: therapist2._id,
        recommendationsSnapshot: ["Proposer des situations sociales plus ouvertes avec feedback tardif."],
      },
    ]);

    await ScoreHistory.insertMany([
      {
        kid: adamKid._id,
        scoreType: "ai-score",
        value: 84,
        explanation: "Adam contextualise deja ses demandes avec peu d'aide.",
        basedOn: { phraseCount: 1, distinctPictograms: 2 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 4),
      },
      {
        kid: adamKid._id,
        scoreType: "ai-score",
        value: 87,
        explanation: "Expression emotionnelle et demande de pause bien structurees.",
        basedOn: { phraseCount: 1, distinctPictograms: 2 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
      },
      {
        kid: adamKid._id,
        scoreType: "ai-score",
        value: 91,
        explanation: "Production complexe avec bonne autonomie et bonne precision.",
        basedOn: { phraseCount: 1, distinctPictograms: 3 },
        createdBy: "ai",
        createdAt: new Date(now - 1000 * 60 * 60 * 24),
        updatedAt: new Date(now - 1000 * 60 * 60 * 24),
      },
    ]);

    await Recommendation.insertMany([
      {
        kid: adamKid._id,
        type: "level",
        title: "Preparer des interactions sociales ouvertes",
        content: "Introduire des tours de role et des reponses a des questions courtes.",
        reason: "Adam maitrise deja les structures de phrase fonctionnelles longues.",
        generatedBy: "ai",
      },
      {
        kid: adamKid._id,
        type: "message",
        title: "Conseil de generalisation",
        content: "Reprendre les memes structures de phrase a la maison et a l'ecole pour stabiliser les acquis.",
        reason: "Adam progresse mieux quand la meme structure est reutilisee dans plusieurs contextes.",
        generatedBy: "system",
      },
    ]);
  }

  const extraKidByCode = Object.fromEntries(allSeededKidDocs.map((kid) => [kid.sessionAccessCode, kid]));
  const extraDemoActivities = [
    {
      kid: extraKidByCode["KID-YASM-TRAB"],
      actor: parentNour,
      therapist: therapist1,
      scenarioTitle: "Sortie a La Marsa",
      rows: [
        {
          pictograms: ["Taxi", "Parc du Belvedere", "Je suis content"],
          generatedText: "taxi parc je suis content",
          correctedText: "Je prends le taxi pour aller au Parc du Belvedere et je suis contente.",
          score: 73,
          duration: 44,
          source: "scenario",
        },
        {
          pictograms: ["Ecole", "Aide-moi"],
          generatedText: "ecole aide moi",
          correctedText: "Aide-moi a l'ecole.",
          score: 70,
          duration: 40,
          source: "manual",
        },
        {
          pictograms: ["Musique", "Calme"],
          generatedText: "musique calme",
          correctedText: "La musique me rend calme.",
          score: 76,
          duration: 37,
          source: "ai",
        },
      ],
      recommendations: [
        {
          type: "scenario",
          title: "Preparer les transitions scolaires",
          content: "Utiliser Ecole puis Aide-moi avant les transitions difficiles.",
          reason: "Yasmine reussit mieux quand la demande d'aide est associee a un lieu precis.",
        },
        {
          type: "message",
          title: "Rituel calme avant sortie",
          content: "Associer Musique et Calme pendant deux minutes avant une sortie.",
          reason: "Les pictogrammes de regulation aident Yasmine a entrer dans l'activite.",
        },
      ],
    },
    {
      kid: extraKidByCode["KID-MALEK-MANS"],
      actor: parentRania,
      therapist: therapist3,
      scenarioTitle: "Repas tunisien en famille",
      rows: [
        {
          pictograms: ["Manger", "Couscous", "Maman"],
          generatedText: "je veux manger couscous avec maman",
          correctedText: "Je veux manger du couscous avec maman.",
          score: 63,
          duration: 41,
          source: "scenario",
        },
        {
          pictograms: ["J'ai soif", "Papa"],
          generatedText: "j'ai soif papa",
          correctedText: "Papa, j'ai soif.",
          score: 68,
          duration: 34,
          source: "manual",
        },
        {
          pictograms: ["Lablabi", "Aide-moi"],
          generatedText: "aide moi lablabi",
          correctedText: "Aide-moi pour le lablabi.",
          score: 71,
          duration: 38,
          source: "ai",
        },
      ],
      recommendations: [
        {
          type: "scenario",
          title: "Renforcer la demande pendant le repas",
          content: "Reprendre le scenario Repas tunisien en famille trois fois cette semaine.",
          reason: "Malek combine deja nourriture et personne familiere.",
        },
        {
          type: "pictogram",
          title: "Ajouter les boissons au repas",
          content: "Associer J'ai soif avec Manger pour stabiliser les demandes de table.",
          reason: "Les demandes de boisson progressent avec un contexte familial clair.",
        },
      ],
    },
    {
      kid: extraKidByCode["KID-INES-GHARBI"],
      actor: parentHichem,
      therapist: therapist4,
      scenarioTitle: "Sortie a La Marsa",
      rows: [
        {
          pictograms: ["Taxi", "Plage de La Marsa", "Je suis content"],
          generatedText: "taxi plage je suis content",
          correctedText: "Je prends le taxi pour aller a la plage de La Marsa et je suis contente.",
          score: 74,
          duration: 47,
          source: "scenario",
        },
        {
          pictograms: ["Bus", "Aide-moi"],
          generatedText: "bus aide moi",
          correctedText: "Aide-moi a monter dans le bus.",
          score: 69,
          duration: 43,
          source: "manual",
        },
        {
          pictograms: ["Metro leger", "Je suis triste"],
          generatedText: "metro leger je suis triste",
          correctedText: "Je suis triste dans le metro leger.",
          score: 72,
          duration: 45,
          source: "ai",
        },
      ],
      recommendations: [
        {
          type: "scenario",
          title: "Preparer les sorties avec transport",
          content: "Utiliser Sortie a La Marsa avant chaque deplacement en ville.",
          reason: "Ines verbalise mieux quand le moyen de transport est annonce.",
        },
      ],
    },
    {
      kid: extraKidByCode["KID-OMAR-MASM"],
      actor: parentAmel,
      therapist: therapist5,
      scenarioTitle: "Dire que j'ai mal",
      rows: [
        {
          pictograms: ["J'ai mal", "Medecin", "Aide-moi"],
          generatedText: "j'ai mal medecin aide moi",
          correctedText: "J'ai mal, aide-moi a voir le medecin.",
          score: 81,
          duration: 52,
          source: "scenario",
        },
        {
          pictograms: ["Pharmacie", "Maman"],
          generatedText: "pharmacie maman",
          correctedText: "Maman, je veux aller a la pharmacie.",
          score: 78,
          duration: 46,
          source: "manual",
        },
        {
          pictograms: ["Medecin", "Je suis triste"],
          generatedText: "medecin je suis triste",
          correctedText: "Je suis triste chez le medecin.",
          score: 84,
          duration: 49,
          source: "ai",
        },
      ],
      recommendations: [
        {
          type: "level",
          title: "Travailler les phrases sante completes",
          content: "Demander a Omar de preciser douleur, personne et action dans la meme phrase.",
          reason: "Omar atteint un niveau avance sur les demandes de sante.",
        },
      ],
    },
    {
      kid: extraKidByCode["KID-RAYEN-ABIDI"],
      actor: parentWalid,
      therapist: therapist6,
      scenarioTitle: "Demander a boire",
      rows: [
        {
          pictograms: ["J'ai soif", "Aide-moi"],
          generatedText: "j'ai soif aide moi",
          correctedText: "J'ai soif, aide-moi.",
          score: 57,
          duration: 39,
          source: "scenario",
        },
        {
          pictograms: ["J'ai faim", "Manger"],
          generatedText: "j'ai faim manger",
          correctedText: "J'ai faim, je veux manger.",
          score: 61,
          duration: 36,
          source: "manual",
        },
        {
          pictograms: ["Papa", "J'ai soif"],
          generatedText: "papa j'ai soif",
          correctedText: "Papa, j'ai soif.",
          score: 64,
          duration: 35,
          source: "ai",
        },
      ],
      recommendations: [
        {
          type: "pictogram",
          title: "Stabiliser les demandes de base",
          content: "Alterner J'ai faim et J'ai soif avec Papa pendant les routines du soir.",
          reason: "Rayen choisit deja deux pictogrammes consecutifs.",
        },
      ],
    },
  ];

  const seedExtraKidActivity = async ({ kid, actor, therapist, scenarioTitle, rows, recommendations = [] }) => {
    if (!kid) return;
    await Promise.all([
      PhraseHistory.deleteMany({ kid: kid._id }),
      Session.deleteMany({ kid: kid._id }),
      Recommendation.deleteMany({ kid: kid._id }),
      ScoreHistory.deleteMany({ kid: kid._id }),
    ]);

    const now = Date.now();
    const histories = rows.map((row, index) => ({
      kid: kid._id,
      pictograms: row.pictograms.map((name) => pictogramsByName[name]?._id).filter(Boolean),
      generatedText: row.generatedText,
      correctedText: row.correctedText,
      audioPlayed: true,
      score: row.score,
      duration: row.duration,
      source: row.source,
      usedAt: new Date(now - 1000 * 60 * 60 * 24 * (rows.length - index)),
      createdBy: actor?._id || therapist?._id || null,
    }));
    await PhraseHistory.insertMany(histories);

    await Session.insertMany(
      rows.slice(0, 2).map((row, index) => ({
        kid: kid._id,
        startedAt: new Date(now - 1000 * 60 * 60 * 24 * (rows.length - index)),
        endedAt: new Date(now - 1000 * 60 * 60 * 24 * (rows.length - index) + row.duration * 1000),
        duration: row.duration,
        score: row.score,
        scenario: scenarioByTitle[scenarioTitle]?._id || null,
        createdBy: therapist?._id || actor?._id || null,
        actions: row.pictograms.map((name) => ({
          type: "select-pictogram",
          payload: { label: name },
        })),
        aiSummary: row.correctedText,
        recommendationsSnapshot: recommendations.map((recommendation) => recommendation.title),
      })),
    );

    await ScoreHistory.insertMany(
      rows.map((row) => ({
        kid: kid._id,
        scoreType: "communication",
        value: row.score,
        explanation: `Performance observee: ${row.correctedText}`,
        basedOn: { source: row.source, duration: row.duration },
        createdBy: row.source === "ai" ? "ai" : "therapist",
      })),
    );

    if (recommendations.length > 0) {
      await Recommendation.insertMany(
        recommendations.map((recommendation) => ({
          kid: kid._id,
          type: recommendation.type,
          title: recommendation.title,
          content: recommendation.content,
          reason: recommendation.reason,
          relatedScenario: scenarioByTitle[scenarioTitle]?._id || null,
          generatedBy: recommendation.type === "level" ? "therapist" : "ai",
        })),
      );
    }
  };

  await Promise.all(extraDemoActivities.map((activity) => seedExtraKidActivity(activity)));

  await AccessRequest.deleteMany({
    requester: {
      $in: [
        parent1._id,
        parent2._id,
        parent3._id,
        parentAhmed._id,
        parentSonia._id,
        parentSami._id,
        parentMeriem._id,
        parentNour._id,
        parentRania._id,
        parentHichem._id,
        parentAmel._id,
        parentWalid._id,
        therapist1._id,
        therapist2._id,
        therapist3._id,
        therapist4._id,
        therapist5._id,
        therapist6._id,
      ],
    },
  });

  await AccessRequest.insertMany([
    {
      requester: parent1._id,
      requesterName: "Meriem Ben Amor",
      requesterRole: ROLES.PARENT,
      kid: demoKid?._id || null,
      patientName: "Sami Ben Ali",
      permission: "Acces aux rapports detailles",
      type: "report-access",
      justification: "Je souhaite suivre la progression hebdomadaire de Sami avec plus de detail.",
      status: STATUSES.PENDING,
    },
    {
      requester: therapist1._id,
      requesterName: "Yasmine Kefi",
      requesterRole: ROLES.THERAPIST,
      kid: nourKid?._id || null,
      patientName: "Nour Trabelsi",
      permission: "Edition des preferences enfant",
      type: "settings-update",
      justification: "Adapter la grille enfant pour accelerer les demandes simples en seance.",
      status: STATUSES.APPROVED,
      reviewedBy: admin._id,
      reviewedAt: new Date(),
      reviewNote: "Acces approuve pour le suivi therapeutique.",
    },
    {
      requester: parent3._id,
      requesterName: "Sonia Kammoun",
      requesterRole: ROLES.PARENT,
      kid: adamKid?._id || null,
      patientName: "Adam Kammoun",
      permission: "Partage de synthese IA",
      type: "ai-summary-share",
      justification: "Besoin de partager les syntheses avec l'equipe scolaire.",
      status: STATUSES.REJECTED,
      reviewedBy: admin._id,
      reviewedAt: new Date(),
      reviewNote: "Le partage externe doit passer par un export valide.",
    },
    {
      requester: parentAhmed._id,
      requesterName: "Ahmed Kammoun",
      requesterRole: ROLES.PARENT,
      kid: null,
      patientName: "Adam Kammoun",
      permission: "Acces lecture uniquement",
      type: "view-only",
      justification: "Je souhaite consulter les progres hebdomadaires d'Adam.",
      status: STATUSES.APPROVED,
      reviewedBy: admin._id,
      reviewedAt: new Date(),
      reviewNote: "Acces consenti pour suivi familial.",
    },
    {
      requester: parentSami._id,
      requesterName: "Sami Ben Ali",
      requesterRole: ROLES.PARENT,
      kid: null,
      patientName: "Nour Ben Ali",
      permission: "Acces aux rapports detailles",
      type: "report-access",
      justification: "Je veux suivre l'evolution du langage de Nour.",
      status: STATUSES.PENDING,
    },
    {
      requester: therapist3._id,
      requesterName: "Imen Hakimi",
      requesterRole: ROLES.THERAPIST,
      kid: null,
      patientName: "Malek Mansouri",
      permission: "Ajout de pictogrammes sensibles",
      type: "pictogram-access",
      justification: "Ajouter des pictogrammes de repas tunisiens pour mieux adapter les seances de Malek.",
      status: STATUSES.PENDING,
    },
    {
      requester: therapist4._id,
      requesterName: "Karim Mokhtar",
      requesterRole: ROLES.THERAPIST,
      kid: null,
      patientName: "Ines Gharbi",
      permission: "Modification des scenarios avances",
      type: "scenario-access",
      justification: "Adapter les scenarios de sortie pour les transitions de Ines.",
      status: STATUSES.APPROVED,
      reviewedBy: admin._id,
      reviewedAt: new Date(),
      reviewNote: "Permission accordee pour les scenarios de sortie.",
    },
    {
      requester: parentAmel._id,
      requesterName: "Amel Masmoudi",
      requesterRole: ROLES.PARENT,
      kid: null,
      patientName: "Omar Masmoudi",
      permission: "Acces aux rapports IA avances",
      type: "ai-report-access",
      justification: "Suivre les recommandations IA autour de l'expression de la douleur.",
      status: STATUSES.PENDING,
    },
  ]);

  await AIInteraction.deleteMany({
    kid: { $in: [demoKid?._id, ayaKid?._id, nourKid?._id, youssefKid?._id, linaKid?._id, adamKid?._id].filter(Boolean) },
  });

  await AIInteraction.insertMany([
    {
      kid: demoKid?._id || null,
      action: "correct-phrase",
      requestPayload: { rawText: "j ai soif", pictogramLabels: ["j ai", "soif"] },
      responsePayload: { correctedText: "J'ai soif." },
      status: "success",
      triggeredBy: parent1._id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      kid: ayaKid?._id || null,
      action: "recommend",
      requestPayload: { latestScores: [73, 77, 82] },
      responsePayload: { recommendationCount: 2 },
      status: "success",
      triggeredBy: therapist1._id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      kid: adamKid?._id || null,
      action: "speech-to-text",
      requestPayload: { language: "fr", filename: "adam-session.wav" },
      responsePayload: { text: "je suis content a l ecole" },
      status: "success",
      triggeredBy: therapist2._id,
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
      updatedAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      kid: linaKid?._id || null,
      action: "analysis",
      requestPayload: { recentSessions: 3 },
      responsePayload: { summary: "Lina generalise mieux les pictogrammes emotionnels aux routines scolaires.", recommendedActions: ["introduce-transition-support"] },
      status: "success",
      triggeredBy: therapist2._id,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
  ]);

  const resources = [
    "auth",
    "users",
    "kids",
    "categories",
    "pictograms",
    "scenarios",
    "history",
    "sessions",
    "analytics",
    "ai",
    "admin",
    "access-control",
  ];

  const entries = [];
  for (const role of Object.values(ROLES)) {
    for (const resource of resources) {
      const resourceActions = (roleDefaultPermissions[role] || []).filter((action) => action.startsWith(`${resource}:`));
      entries.push({
        updateOne: {
          filter: { role, resource },
          update: { $set: { actions: resourceActions } },
          upsert: true,
        },
      });
    }
  }

  await AccessControl.bulkWrite(entries);

  console.log("Seed completed");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
  console.log("Demo accounts:");
  console.log("admin@autoconnect.app / demo123");
  console.log("therapist1@autoconnect.app / demo123");
  console.log("therapist2@autoconnect.app / demo123");
  console.log("parent1@autoconnect.app / demo123 -> 1 child: KID-SAMI01");
  console.log("parent2@autoconnect.app / demo123 -> 2 children: KID-AYA02, KID-NOUR03");
  console.log("parent3@autoconnect.app / demo123 -> 3 children: KID-YOUS04, KID-LINA05, KID-ADAM06");
  console.log("Linked demo flow:");
  console.log("admin@autoconnect.app -> created therapist1@autoconnect.app");
  console.log("therapist1@autoconnect.app -> created parent1@autoconnect.app");
  console.log("parent1@autoconnect.app -> linked to child code KID-SAMI01");
  console.log("Sami now has seeded sessions, scores, history, recommendations and scenarios.");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
