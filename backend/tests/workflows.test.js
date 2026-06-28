const request = require("supertest");
const { app } = require("../src/app");
const { AccessRequest } = require("../src/modules/access-requests/accessRequest.model");
const { AccessControl } = require("../src/modules/access-control/accessControl.model");
const { Category } = require("../src/modules/categories/category.model");
const { PERMISSIONS } = require("../src/constants/permissions");
const { ROLES } = require("../src/constants/roles");
const { authHeader, clearTestDb, closeTestDb, connectTestDb, createTestKid, createTestUser } = require("./testUtils");

const login = async (email, password = "Password123") => {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  return response.body.data.token;
};

describe("Role workflows", () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  test("admin active et desactive un compte therapeute", async () => {
    await createTestUser({
      email: "admin.workflow@autoconnect.test",
      password: "Password123",
      role: ROLES.ADMIN,
    });
    const therapist = await createTestUser({
      email: "therapist.status@autoconnect.test",
      password: "Password123",
      role: ROLES.THERAPIST,
    });
    const adminToken = await login("admin.workflow@autoconnect.test");

    const disableResponse = await request(app)
      .patch(`/api/users/${therapist._id}/status`)
      .set(authHeader(adminToken))
      .send({ isActive: false });

    expect(disableResponse.status).toBe(200);
    expect(disableResponse.body.data.isActive).toBe(false);

    const blockedLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "therapist.status@autoconnect.test", password: "Password123" });

    expect(blockedLogin.status).toBe(401);

    const enableResponse = await request(app)
      .patch(`/api/users/${therapist._id}/status`)
      .set(authHeader(adminToken))
      .send({ isActive: true });

    expect(enableResponse.status).toBe(200);
    expect(enableResponse.body.data.isActive).toBe(true);
  });

  test("une demande approuvee par admin debloque la permission demandee", async () => {
    const admin = await createTestUser({
      email: "admin.access@autoconnect.test",
      password: "Password123",
      role: ROLES.ADMIN,
    });
    const therapist = await createTestUser({
      email: "therapist.access@autoconnect.test",
      password: "Password123",
      role: ROLES.THERAPIST,
    });
    const parent = await createTestUser({
      email: "parent.access@autoconnect.test",
      password: "Password123",
      role: ROLES.PARENT,
      createdBy: therapist._id,
    });
    const kid = await createTestKid({
      parentId: parent._id,
      therapistId: therapist._id,
      createdBy: parent._id,
      sessionAccessCode: "KID-ACCESS01",
    });
    const category = await Category.create({ name: "Actions", color: "#d7f4ff" });

    await AccessControl.create({
      role: ROLES.THERAPIST,
      resource: "pictograms",
      actions: [PERMISSIONS.PICTOGRAMS_READ],
    });

    const therapistToken = await login("therapist.access@autoconnect.test");
    const adminToken = await login("admin.access@autoconnect.test");

    const blockedCreate = await request(app)
      .post("/api/pictograms")
      .set(authHeader(therapistToken))
      .send({
        name: "Besoin sensible",
        imageUrl: "https://example.com/besoin.png",
        category: String(category._id),
      });

    expect(blockedCreate.status).toBe(403);

    const accessRequest = await request(app)
      .post("/api/access-requests")
      .set(authHeader(therapistToken))
      .send({
        kidId: String(kid._id),
        patientName: "Sami Test",
        permission: "Ajout de pictogrammes sensibles",
        type: "Extension de permission",
        justification: "Besoin therapeutique pour completer le vocabulaire de l'enfant.",
      });

    expect(accessRequest.status).toBe(201);

    const approval = await request(app)
      .patch(`/api/access-requests/${accessRequest.body.data.id}/status`)
      .set(authHeader(adminToken))
      .send({ status: "approved" });

    expect(approval.status).toBe(200);

    const allowedCreate = await request(app)
      .post("/api/pictograms")
      .set(authHeader(therapistToken))
      .send({
        name: "Besoin sensible",
        imageUrl: "https://example.com/besoin.png",
        category: String(category._id),
        subcategory: "Demandes",
      });

    expect(allowedCreate.status).toBe(201);
    expect(allowedCreate.body.data.subcategory).toBe("Demandes");
  });

  test("les demandes d'acces sont reservees aux therapeutes", async () => {
    const admin = await createTestUser({
      email: "admin.therapist-requests@autoconnect.test",
      password: "Password123",
      role: ROLES.ADMIN,
    });
    const therapist = await createTestUser({
      email: "therapist.therapist-requests@autoconnect.test",
      password: "Password123",
      role: ROLES.THERAPIST,
    });
    const parent = await createTestUser({
      email: "parent.therapist-requests@autoconnect.test",
      password: "Password123",
      role: ROLES.PARENT,
      createdBy: admin._id,
    });
    const parentToken = await login("parent.therapist-requests@autoconnect.test");
    const adminToken = await login("admin.therapist-requests@autoconnect.test");

    const blockedParentRequest = await request(app)
      .post("/api/access-requests")
      .set(authHeader(parentToken))
      .send({
        patientName: "Enfant Test",
        permission: "Acces aux rapports detailles",
        type: "Extension de permission",
        justification: "Demande parent qui doit etre refusee.",
      });

    expect(blockedParentRequest.status).toBe(403);

    await AccessRequest.create([
      {
        requester: parent._id,
        requesterName: "Parent Test",
        requesterRole: ROLES.PARENT,
        patientName: "Enfant Parent",
        permission: "Acces lecture uniquement",
        type: "Ancienne demande invalide",
        justification: "Ancienne donnee parent a ignorer.",
      },
      {
        requester: therapist._id,
        requesterName: "Therapist Test",
        requesterRole: ROLES.THERAPIST,
        patientName: "Enfant Therapeute",
        permission: "Acces aux statistiques detaillees",
        type: "Demande valide",
        justification: "Demande therapeute visible.",
      },
    ]);

    const listResponse = await request(app)
      .get("/api/access-requests")
      .set(authHeader(adminToken));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].requesterRole).toBe(ROLES.THERAPIST);
    expect(listResponse.body.meta.counts.pending).toBe(1);
  });

  test("un scenario sans enfant selectionne est assigne aux enfants suivis compatibles", async () => {
    const therapist = await createTestUser({
      email: "therapist.scenario@autoconnect.test",
      password: "Password123",
      role: ROLES.THERAPIST,
    });
    const parent = await createTestUser({
      email: "parent.scenario@autoconnect.test",
      password: "Password123",
      role: ROLES.PARENT,
      createdBy: therapist._id,
    });
    await createTestKid({
      firstName: "Nour",
      parentId: parent._id,
      therapistId: therapist._id,
      createdBy: parent._id,
      sessionAccessCode: "KID-SCENARIO01",
    });
    const therapistToken = await login("therapist.scenario@autoconnect.test");

    const response = await request(app)
      .post("/api/scenarios")
      .set(authHeader(therapistToken))
      .send({
        title: "Demander une pause",
        description: "Scenario debutant pour demander une pause.",
        targetLevel: "Debutant",
        ageMin: 2,
        ageMax: 12,
        steps: ["Choisir Pause", "Ecouter la phrase"],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.assignedKids).toHaveLength(1);
    expect(response.body.data.assignedKids[0].firstName).toBe("Nour");
  });
});
