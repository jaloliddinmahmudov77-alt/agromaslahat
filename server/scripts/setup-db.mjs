// Bazani tayyorlaydi: (kerak bo'lsa lokal PostgreSQL ni ishga tushiradi) -> sxemani qo'llaydi -> kontentni yuklaydi.
import { execSync } from 'node:child_process';
import { startLocalDb } from './pg.mjs';

const useLocal = process.env.LOCAL_DB !== 'false';
const pg = useLocal ? await startLocalDb() : null;
try {
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
  execSync('npx tsx --env-file-if-exists=.env prisma/seed.ts', { stdio: 'inherit' });
  console.log('[db] Tayyor.');
} finally {
  if (pg) await pg.stop();
}
