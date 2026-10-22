import { Router } from 'express';
import { param } from '../lib/http.js';
import { aiEnabled } from '../lib/gemini.js';
import { LAND_TYPES, REGIONS, WATER_LEVELS } from '../data/regions.js';
import { EXPENSE_CATEGORIES } from '../services/report.js';
import { getWeather } from '../services/weather.js';

export const metaRouter = Router();

metaRouter.get('/meta', (_req, res) => {
  res.json({
    regions: REGIONS.map(({ id, name, center }) => ({ id, name, center })),
    landTypes: LAND_TYPES,
    waterLevels: WATER_LEVELS.slice(1).map((name, i) => ({ id: i + 1, name })),
    expenseCategories: Object.entries(EXPENSE_CATEGORIES).map(([id, name]) => ({ id, name })),
    aiEnabled: aiEnabled(),
  });
});

metaRouter.get('/weather/:region', async (req, res) => {
  res.json({ weather: await getWeather(param(req, 'region')) });
});
