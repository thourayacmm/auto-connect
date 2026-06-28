const request = require("supertest");
const { app } = require("../src/app");
const { authHeader, clearTestDb, closeTestDb, connectTestDb, createTestKid, createTestUser } = require("./testUtils");

jest.mock("../src/modules/ai/aiClient.service", () => ({
  callAi: jest.fn(),
  getAi: jest.fn(),
  postAiMultipart: jest.fn(),
}));

const { callAi } = require("../src/modules/ai/aiClient.service");

describe("AI recommendations API", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    callAi.mockReset();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  test("genere des recommandations IA pour un enfant", async () => {
    // ARRANGE
    const parent = await createTestUser({
      email: "parent.ai@autoconnect.test",
      password: "Password123",
    });
    const kid = await createTestKid({
      parentId: parent._id,
      createdBy: parent._id,
      sessionAccessCode: "KID-AI01",
    });
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "parent.ai@autoconnect.test",
        password: "Password123",
      });
    const token = loginResponse.body.data.token;

    callAi.mockResolvedValue({
      recommended_pictograms: [
        {
          pictogram_id: "pic-1",
          label: "Aide-moi",
          category: "Actions",
          reason: "Renforcer la demande d'aide.",
        },
      ],
      recommended_scenarios: [],
      adaptation_suggestions: ["Garder des consignes courtes."],
      supervisor_tips: ["Observer la fatigue en fin de session."],
      explanation: "Profil debutant avec besoin de routines simples.",
      confidence: 0.82,
      caution_note: "",
    });

    // ACT
    const response = await request(app)
      .post("/api/ai/recommend")
      .set(authHeader(token))
      .send({
        kidId: String(kid._id),
        history: [],
        profile: {
          age: kid.age,
          currentLevel: kid.currentLevel,
          objectives: ["Communication fonctionnelle"],
        },
      });

    // ASSERT
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.confidence).toBe(0.82);
    expect(response.body.data.recommendations).toHaveLength(3);
    expect(response.body.data.recommendations[0].title).toContain("Aide-moi");
    expect(callAi).toHaveBeenCalledWith(
      "/ai/generate-recommendations",
      expect.objectContaining({
        kid_id: String(kid._id),
        age: kid.age,
        current_level: kid.currentLevel,
      }),
    );
  });
});
