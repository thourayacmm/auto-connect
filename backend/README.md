# AUTO CONNECT Backend (Node.js + Express + MongoDB)

Backend REST API pour la plateforme AUTO CONNECT (CAA), avec architecture modulaire, JWT, roles et ownership.

## 1) Architecture globale

```text
backend/
  src/
    config/
      env.js
      db.js
    constants/
      roles.js
      permissions.js
      default-access.js
    middlewares/
      auth.middleware.js
      role.middleware.js
      ownership.middleware.js
      validate.middleware.js
      rateLimit.middleware.js
      error.middleware.js
    modules/
      auth/
      users/
      kids/
      categories/
      pictograms/
      scenarios/
      history/
      sessions/
      analytics/
      ai/
      admin/
      recommendations/
      scores/
      access-control/
    routes/
      index.js
    utils/
      ApiError.js
      apiResponse.js
      catchAsync.js
      pagination.js
    validators/
      common.validators.js
    app.js
    server.js
  scripts/
    seed.js
  .env.example
  package.json
```

## 2) Modele de donnees MongoDB (Mongoose)

Modeles principaux:
- `User` (roles: `admin`, `parent`, `therapist`)
- `Kid`
- `Category`
- `Pictogram`
- `Scenario`
- `PhraseHistory`
- `Session`
- `Recommendation`
- `ScoreHistory`
- `AccessControl`

Relations:
- `Kid.assignedParents[] -> User`
- `Kid.assignedTherapists[] -> User`
- `Pictogram.category -> Category`
- `Scenario.pictogramSequence[] -> Pictogram`
- `Scenario.assignedKids[] -> Kid`
- `PhraseHistory.kid -> Kid`
- `Session.kid -> Kid`
- `Recommendation.kid -> Kid`
- `ScoreHistory.kid -> Kid`

## 3) Strategie Auth + Roles + Ownership

- JWT (Bearer + cookie httpOnly)
- `protect` middleware: verifie token et charge `req.user`
- `authorizeRoles(...)`: bloque selon role
- `ownership` (Parent/Therapist/Kid): verifie l’association User-Kid avant acces sensible

Regles:
- Admin: acces total
- Parent: acces uniquement a ses enfants lies
- Therapist: acces uniquement aux enfants suivis

## 4) Integration IA FastAPI

- Client HTTP: `src/modules/ai/aiClient.service.js`
- Endpoints orchestrateurs:
  - `GET /api/ai/health`
  - `POST /api/ai/analyze`
  - `POST /api/ai/recommend`
  - `POST /api/ai/score`
  - `POST /api/ai/adapt-level`
  - `POST /api/ai/correct-phrase`
  - `POST /api/ai/chat`
- Timeout + mapping erreur via `ApiError`
- Persistance optionnelle:
  - recommandations IA -> `Recommendation`
  - score IA -> `ScoreHistory`

## 5) Routes REST principales

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Users:
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `PATCH /api/users/:id/status`
- `DELETE /api/users/:id`

Kids:
- `POST /api/kids`
- `GET /api/kids`
- `GET /api/kids/:id`
- `PUT /api/kids/:id`
- `DELETE /api/kids/:id`
- `PATCH /api/kids/:id/assign-parent`
- `PATCH /api/kids/:id/assign-therapist`
- `GET /api/kids/:id/progress`
- `GET /api/kids/:id/history`
- `GET /api/kids/:id/recommendations`
- `GET /api/kids/:id/sessions`

Categories:
- `POST /api/categories`
- `GET /api/categories`
- `GET /api/categories/:id`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

Pictograms:
- `POST /api/pictograms`
- `GET /api/pictograms`
- `GET /api/pictograms/:id`
- `PUT /api/pictograms/:id`
- `DELETE /api/pictograms/:id`
- `GET /api/pictograms/search`
- `GET /api/pictograms/category/:categoryId`

Scenarios:
- `POST /api/scenarios`
- `GET /api/scenarios`
- `GET /api/scenarios/:id`
- `PUT /api/scenarios/:id`
- `DELETE /api/scenarios/:id`
- `PATCH /api/scenarios/:id/assign-kid`

History:
- `POST /api/history`
- `GET /api/history`
- `GET /api/history/:kidId`

Sessions:
- `POST /api/sessions/start`
- `POST /api/sessions/end`
- `GET /api/sessions`
- `GET /api/sessions/:id`

Analytics:
- `GET /api/analytics/dashboard`
- `GET /api/analytics/kid/:id`
- `GET /api/analytics/global`

Admin:
- `GET /api/admin/overview`
- `GET /api/admin/audit`
- `GET /api/admin/access-control`
- `PUT /api/admin/access-control`

AI proxy:
- `GET /api/ai/health`
- `POST /api/ai/chat`

## 6) Installation

```bash
cd backend
npm install
cp .env.example .env
```

Configurer `.env`:
- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`
- `FASTAPI_BASE_URL`

## 7) Run

```bash
npm run dev
```

Health check:
- `GET http://localhost:4000/api/health`

## 8) Seed initial

```bash
npm run seed
```

Cree:
- compte admin initial
- categories de base
- matrice d’access control initiale
