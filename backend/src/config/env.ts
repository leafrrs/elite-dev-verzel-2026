import dotenv from "dotenv";

// Carrega as variáveis do .env ANTES de qualquer validação
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`CRITICAL ERROR: Variável de ambiente ${key} não está definida!`);
  }
  return value;
}

export const env = {
  JWT_SECRET: requireEnv("JWT_SECRET"),
  QR_SECRET_KEY: requireEnv("QR_SECRET_KEY"),
  TMDB_ACCESS_TOKEN: requireEnv("TMDB_ACCESS_TOKEN"),
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
};
