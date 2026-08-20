/**
 * Helper: setup global para a suíte de testes.
 * - Define variáveis de ambiente mínimas antes que qualquer módulo seja importado.
 * - NÃO usa secrets reais da aplicação.
 */

// Banco SQLite temporário, isolado de dev.db
process.env.DATABASE_URL = 'file:./prisma/test.db';

// Secrets próprios de teste (valores fictícios, não versionados como reais)
process.env.JWT_SECRET = 'test_jwt_secret_for_suite_only';
process.env.QR_SECRET_KEY = 'test_qr_secret_for_suite_only';
process.env.TMDB_ACCESS_TOKEN = 'test_tmdb_token_not_used_in_tests';
process.env.NODE_ENV = 'test';
