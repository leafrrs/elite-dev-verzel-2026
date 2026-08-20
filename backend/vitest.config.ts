import { defineConfig } from 'vitest/config';
import path from 'path';

const DB_PATH = path.resolve(__dirname, 'prisma/test.db');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Cada arquivo roda em processo isolado para evitar state compartilhado no PrismaClient
    pool: 'forks',
    testTimeout: 15000,
    // Evita que os testes rodem em paralelo entre arquivos (SQLite não suporta bem)
    fileParallelism: false,
    include: ['src/tests/**/*.test.ts'],
    setupFiles: ['src/tests/helpers/setup.ts'],
    // Injeta variáveis antes do PrismaClient inicializar
    env: {
      DATABASE_URL: 'file:./test.db',
      JWT_SECRET: 'test_jwt_secret_for_suite_only',
      QR_SECRET_KEY: 'test_qr_secret_for_suite_only',
      TMDB_ACCESS_TOKEN: 'test_tmdb_not_used',
      NODE_ENV: 'test',
    },
  },
});
