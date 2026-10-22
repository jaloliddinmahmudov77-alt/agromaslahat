import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env, isProd } from './lib/env.js';
import { prisma } from './lib/prisma.js';
import { HttpError } from './lib/http.js';
import { errorHandler } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { contentRouter } from './routes/content.js';
import { adviceRouter } from './routes/advice.js';
import { aiRouter } from './routes/ai.js';
import { pricesRouter } from './routes/prices.js';
import { metaRouter } from './routes/meta.js';
import { farmRouter } from './routes/farm.js';
import { meRouter } from './routes/me.js';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'img-src': ["'self'", 'data:', 'blob:'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
      },
    },
  }),
);
app.use(express.json({ limit: '12mb' }));
app.use(cookieParser());

// CSRF himoyasi: cookie bilan ishlaydigan yozuv so'rovlari faqat o'z saytimizdan qabul qilinadi.
app.use('/api', (req, _res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next();
  const origin = req.get('origin');
  const self = `${req.protocol}://${req.get('host')}`;
  if (origin && origin !== self && origin !== env.CLIENT_ORIGIN) return next(new HttpError(403, 'Ruxsat etilmagan manba'));
  next();
});

const api = express.Router();
api.get('/health', (_req, res) => {
  res.json({ ok: true });
});
api.use('/auth', authRouter);
api.use(contentRouter, adviceRouter, aiRouter, pricesRouter, metaRouter, farmRouter, meRouter);
api.use((_req, _res, next) => next(new HttpError(404, 'API manzili topilmadi')));
app.use('/api', api);

// Production: tayyor frontendni shu serverdan beramiz.
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false, maxAge: isProd ? '7d' : 0 }));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`[api] http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
