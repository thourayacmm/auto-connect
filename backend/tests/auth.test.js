const request = require("supertest");
const { app } = require("../src/app");
const {
  connectTestDb,
  clearTestDb,
  closeTestDb,
  createTestKid,
  createTestUser,
} = require("./testUtils");

describe("Auth API", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  test("connecte un utilisateur avec des identifiants valides", async () => {
    // ARRANGE : créer un utilisateur de test dans la base de données
    await createTestUser({
      email: "parent.valid@autoconnect.test",
      password: "Password123",
    });

    // ACT : envoyer une requête POST vers la route de connexion
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "parent.valid@autoconnect.test",
        password: "Password123",
      });

    // ASSERT : vérifier que la connexion est réussie
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe("parent.valid@autoconnect.test");
    expect(response.body.data.user.passwordHash).toBeUndefined();
  });

  test("refuse la connexion avec un mot de passe invalide", async () => {
    // ARRANGE : créer un utilisateur de test avec un mot de passe valide
    await createTestUser({
      email: "parent.invalid@autoconnect.test",
      password: "Password123",
    });

    // ACT : envoyer une requête POST avec un mot de passe incorrect
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "parent.invalid@autoconnect.test",
        password: "WrongPassword123",
      });

    // ASSERT : vérifier que la connexion est refusée
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid credentials");
  });

  test("connecte une session enfant avec un code valide", async () => {
    const parent = await createTestUser({
      email: "parent.child-session@autoconnect.test",
      password: "Password123",
    });
    await createTestKid({
      firstName: "Sami",
      lastName: "Session",
      parentId: parent._id,
      sessionAccessCode: "KID-SAMI01",
    });

    const response = await request(app)
      .post("/api/auth/child-session")
      .send({ accessCode: "kid-sami01" });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user.role).toBe("child");
    expect(response.body.data.user.fullName).toBe("Sami Session");
  });
});
