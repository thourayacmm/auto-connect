const request = require("supertest");
const { app } = require("../src/app");
const { Category } = require("../src/modules/categories/category.model");
const { ROLES } = require("../src/constants/roles");
const { authHeader, clearTestDb, closeTestDb, connectTestDb, createTestUser } = require("./testUtils");

describe("Pictograms API", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  test("persiste et renvoie la sous-categorie d'un pictogramme", async () => {
    await createTestUser({
      email: "therapist.pictograms@autoconnect.test",
      password: "Password123",
      role: ROLES.THERAPIST,
    });
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "therapist.pictograms@autoconnect.test",
        password: "Password123",
      });
    const token = loginResponse.body.data.token;
    const category = await Category.create({
      name: "Nourriture",
      color: "#fff4bf",
      icon: "Utensils",
    });

    const createResponse = await request(app)
      .post("/api/pictograms")
      .set(authHeader(token))
      .send({
        name: "Pomme",
        imageUrl: "https://example.com/pomme.png",
        category: String(category._id),
        keywords: ["pomme", "fruit"],
        level: "Debutant",
        ageMin: 2,
        ageMax: 12,
        subcategory: "Fruits",
        description: "Fruits",
        isActive: true,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.subcategory).toBe("Fruits");

    const listResponse = await request(app)
      .get("/api/pictograms?limit=100")
      .set(authHeader(token));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].subcategory).toBe("Fruits");
    expect(listResponse.body.data[0].category.name).toBe("Nourriture");
  });
});
