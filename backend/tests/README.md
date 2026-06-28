# Backend Tests

Ces tests couvrent les vraies routes Express du backend Auto Connect avec Jest et Supertest.

Commandes:

```bash
cd backend
npm install
npm test
```

Prerequis:

- MongoDB doit tourner sur `mongodb://127.0.0.1:27017`.
- Les tests utilisent une base separee: `auto_connect_test`.
- Les donnees de l'application normale dans `auto_connect` ne sont pas supprimees.

Fichiers principaux:

- `auth.test.js`: connexion valide et connexion invalide.
- `kids.test.js`: recuperation et creation d'un enfant.
- `ai.test.js`: recommandations IA via `/api/ai/recommend`, avec le service FastAPI mocke pour garder le test stable.
