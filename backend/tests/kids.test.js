const request = require("supertest");
const { app } = require("../src/app");
const { authHeader, clearTestDb, closeTestDb, connectTestDb, createTestKid, createTestUser } = require("./testUtils");

describe("Kids API", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  const loginParent = async () => {
    const parent = await createTestUser({
      email: "parent.kids@autoconnect.test",
      password: "Password123",
    });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "parent.kids@autoconnect.test",
        password: "Password123",
      });

    return { parent, token: loginResponse.body.data.token };
  };

  test("recupere les enfants associes au parent connecte", async () => {
    // ARRANGE
    const { parent, token } = await loginParent();
    await createTestKid({
      firstName: "Nour",
      lastName: "Ben Salah",
      parentId: parent._id,
      sessionAccessCode: "KID-NOUR01",
    });

    // ACT
    const response = await request(app)
      .get("/api/kids?limit=100")
      .set(authHeader(token));

    // ASSERT
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].firstName).toBe("Nour");
    expect(response.body.meta.total).toBe(1);
  });

  test("ajoute un enfant pour le parent connecte", async () => {
    // ARRANGE
    const { token } = await loginParent();
    const payload = {
      firstName: "Aya",
      lastName: "Test",
      age: 6,
      communicationLevel: "Debutant",
      difficultyType: "Communication",
      currentLevel: "Debutant",
      sessionAccessCode: "KID-AYA01",
    };

    // ACT
    const response = await request(app)
      .post("/api/kids")
      .set(authHeader(token))
      .send(payload);

    // ASSERT
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.firstName).toBe("Aya");
    expect(response.body.data.sessionAccessCode).toBe("KID-AYA01");
    expect(response.body.data.assignedParents).toHaveLength(1);
  });
});
