// Lokal PostgreSQL (embedded-postgres) — tizimga PostgreSQL o'rnatmasdan ishlab chiqish uchun.
import EmbeddedPostgres from 'embedded-postgres';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.pgdata');

function pgCtl(bin, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { stdio: 'ignore', windowsHide: true });
    p.on('error', reject);
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`pg_ctl ${args[0]}: kod ${code}`))));
  });
}

export async function startLocalDb() {
  const port = Number(process.env.LOCAL_DB_PORT ?? 5433);
  const user = process.env.LOCAL_DB_USER ?? 'agro';
  const password = process.env.LOCAL_DB_PASSWORD ?? 'agro_local_pw';
  const dbName = process.env.LOCAL_DB_NAME ?? 'agromaslahat';
  const pg = new EmbeddedPostgres({ databaseDir: dir, user, password, port, persistent: true,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onLog: () => {},
  });
  const fresh = !existsSync(path.join(dir, 'PG_VERSION'));
  if (fresh) await pg.initialise();

  let stop;
  if (process.platform === 'win32') {
    // Windows'da pg_ctl orqali ishga tushiramiz: u administrator hisobida ham huquqlarni
    // o'zi pasaytiradi (postgres.exe to'g'ridan-to'g'ri administrator ostida ishlamaydi).
    const { pg_ctl } = await import('@embedded-postgres/windows-x64');
    const running = await pgCtl(pg_ctl, ['status', '-D', dir]).then(
      () => true,
      () => false,
    );
    if (!running) {
      await pgCtl(pg_ctl, ['start', '-w', '-D', dir, '-o', `-p ${port}`, '-l', path.join(dir, 'server.log')]);
    }
    stop = running ? async () => {} : () => pgCtl(pg_ctl, ['stop', '-D', dir, '-m', 'fast']);
  } else {
    await pg.start();
    stop = () => pg.stop();
  }

  const client = pg.getPgClient();
  await client.connect();
  try {
    // Tizim tili (masalan, WIN1251) qanday bo'lishidan qat'i nazar, baza UTF-8 da yaratiladi.
    await client.query(`CREATE DATABASE ${client.escapeIdentifier(dbName)} ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C' TEMPLATE template0`);
  } catch {
    // baza allaqachon mavjud
  } finally {
    await client.end();
  }
  console.log(`[db] PostgreSQL ishga tushdi: localhost:${port}/${dbName}`);
  return { stop };
}
