const mongoose = require("mongoose");
require("dotenv").config();

const { Kid } = require("../src/modules/kids/kid.model");
const { User } = require("../src/modules/users/user.model");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auto_connect";

const parentByEmail = {
  "nour.trabelsi@autoconnect.app": ["Yasmine Trabelsi"],
  "meriem.benamor@autoconnect.app": ["Mariem Ben Amor", "Yasmine Ben Ali", "Sami Amor", "Nour Ben Ali", "Sami Ben Amor"],
  "sonia.kammoun@autoconnect.app": ["Youssef Kammoun"],
  "ahmed.kammoun@autoconnect.app": ["Adam Kammoun", "Lina Kammoun"],
  "parent2@autoconnect.app": ["Nour Mani", "Aya Dehbi"],
  "parent1@autoconnect.app": ["Sami Loutfi"],
};

const splitName = (fullName) => {
  const [firstName, ...lastNameParts] = fullName.trim().split(/\s+/);
  return { firstName, lastName: lastNameParts.join(" ") || firstName };
};

const run = async () => {
  await mongoose.connect(MONGO_URI);

  const therapist = await User.findOne({ email: "therapist1@autoconnect.app" }).select("_id");
  if (!therapist) throw new Error("Therapeute therapist1@autoconnect.app introuvable.");

  await User.updateOne(
    { email: "parent1@autoconnect.app" },
    { $set: { firstName: "Meriem", lastName: "Salem", isActive: true } },
  );

  let updated = 0;
  for (const [email, childNames] of Object.entries(parentByEmail)) {
    const parent = await User.findOne({ email }).select("_id email");
    if (!parent) {
      console.warn(`Parent introuvable: ${email}`);
      continue;
    }

    await User.updateOne({ _id: parent._id }, { $set: { isActive: true } });

    const allowedKidIds = [];
    for (const fullName of childNames) {
      const { firstName, lastName } = splitName(fullName);
      const match = {
        firstName: { $regex: `^${firstName}$`, $options: "i" },
        lastName: { $regex: `^${lastName}$`, $options: "i" },
      };
      const kids = await Kid.find(match).select("_id firstName lastName");

      if (!kids.length) {
        console.warn(`Enfant introuvable: ${fullName}`);
        continue;
      }

      allowedKidIds.push(...kids.map((kid) => kid._id));

      const result = await Kid.updateMany(
        match,
        {
          $set: {
            assignedParents: [parent._id],
            status: "active",
          },
          $addToSet: {
            assignedTherapists: therapist._id,
          },
        },
      );
      updated += result.modifiedCount || 0;
    }

    await Kid.updateMany(
      {
        assignedParents: parent._id,
        _id: { $nin: allowedKidIds },
      },
      { $pull: { assignedParents: parent._id } },
    );
  }

  const parents = await User.find({ email: { $in: Object.keys(parentByEmail) } }).sort({ email: 1 });
  console.log(`Associations parent-enfant clarifiees: ${updated} enfant(s) mis a jour.`);
  for (const parent of parents) {
    const kids = await Kid.find({ assignedParents: parent._id }).select("firstName lastName").sort({ firstName: 1 });
    console.log(`${parent.firstName} ${parent.lastName} <${parent.email}>: ${kids.length} enfant(s) => ${kids.map((kid) => `${kid.firstName} ${kid.lastName}`).join(", ") || "Aucun"}`);
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
