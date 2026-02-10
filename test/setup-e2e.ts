// Configuration MongoDB pour tests E2E
// Utilise MongoDB test sans authentication sur port 27018
// En CI/CD, utilise MONGODB_URI de l'environnement (GitHub Actions service)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/booknest-test';
process.env.MONGODB_URI = MONGODB_URI;

process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests';
process.env.JWT_EXPIRATION = '1h';
