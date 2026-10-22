import { startLocalDb } from './pg.mjs';

if (process.env.LOCAL_DB === 'false') {
  console.log('[db] LOCAL_DB=false — tashqi PostgreSQL ishlatiladi (DATABASE_URL).');
  process.exit(0);
}

const pg = await startLocalDb();
const stop = async () => {
  await pg.stop().catch(() => {});
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => {}, 1 << 30);
