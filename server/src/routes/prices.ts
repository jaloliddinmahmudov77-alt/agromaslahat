import { Router } from 'express';
import { HttpError } from '../lib/http.js';
import { latestPrices, priceHistory } from '../services/prices.js';

export const pricesRouter = Router();

pricesRouter.get('/prices', async (_req, res) => {
  res.json(await latestPrices());
});

pricesRouter.get('/prices/history', async (req, res) => {
  const product = typeof req.query.product === 'string' ? req.query.product : '';
  if (!product) throw new HttpError(400, 'Mahsulotni ko‘rsating');
  res.json({ history: await priceHistory(product) });
});
