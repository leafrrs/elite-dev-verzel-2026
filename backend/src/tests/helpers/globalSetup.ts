/**
 * globalSetup.ts — Executado UMA VEZ antes de todos os arquivos de teste.
 * Cria o banco de teste via migrations versionadas.
 * Não usa prisma db push.
 */

import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '../../prisma/test.db');
const ROOT = path.resolve(__dirname, '../../..');

function destroy() {
  for (const suffix of ['', '-wal', '-shm']) {
    const f = DB_PATH + suffix;
    if (existsSync(f)) unlinkSync(f);
  }
}

export async function setup() {
  destroy();
  console.log(`Rodando migrations no test.db`);
  
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: `file:./test.db` },
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../../..'),
  });
}

export async function teardown() {
  destroy();
}
