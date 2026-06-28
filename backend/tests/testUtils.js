const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { User } = require("../src/modules/users/user.model");
const { Kid } = require("../src/modules/kids/kid.model");
const { ROLES } = require("../src/constants/roles");

const TEST_DB_URI = process.env.MONGODB_TEST_URI || "mongodb://127.0.0.1:27017/auto_connect_test";

const connectTestDb = async () => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(TEST_DB_URI, {
    serverSelectionTimeoutMS: 3000,
  });
};

const clearTestDb = async () => {
  if (mongoose.connection.readyState !== 1) return;
  await mongoose.connection.dropDatabase();
};

const closeTestDb = async () => {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.connection.close();
};

const createTestUser = async ({
  firstName = "Test",
  lastName = "User",
  email = "test.parent@autoconnect.test",
  password = "Password123",
  role = ROLES.PARENT,
  createdBy = null,
} = {}) => {
  const passwordHash = await bcrypt.hash(password, 12);

  return User.create({
    firstName,
    lastName,
    email,
    passwordHash,
    role,
    createdBy,
    isActive: true,
    language: "fr",
  });
};

const createTestKid = async ({
  firstName = "Sami",
  lastName = "Test",
  age = 7,
  parentId,
  therapistId = null,
  createdBy,
  sessionAccessCode = "KID-TEST01",
} = {}) =>
  Kid.create({
    firstName,
    lastName,
    age,
    gender: "other",
    communicationLevel: "Debutant",
    difficultyType: "Communication",
    currentLevel: "Debutant",
    status: "active",
    sessionAccessCode,
    assignedParents: parentId ? [parentId] : [],
    assignedTherapists: therapistId ? [therapistId] : [],
    createdBy: createdBy || parentId,
  });

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

module.exports = {
  TEST_DB_URI,
  connectTestDb,
  clearTestDb,
  closeTestDb,
  createTestUser,
  createTestKid,
  authHeader,
};
