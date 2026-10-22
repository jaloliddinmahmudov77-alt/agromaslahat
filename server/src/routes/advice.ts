import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { parseBody } from '../lib/http.js';
import { optionalAuth } from '../middleware/auth.js';
import { REGION_IDS } from '../data/regions.js';
import { recommend } from '../services/advisor.js';

export const adviceRouter = Router();

export const landSchema = z.object({
  region: z.enum(REGION_IDS as [string, ...string[]], 'Viloyatni tanlang'),
  district: z.string().trim().max(80).optional(),
  area: z.coerce.number().positive('Maydon 0 dan katta bo‘lsin').max(100_000),
  bonitet: z.coerce.number().int().min(1).max(100, 'Ball bonitet 1–100 oralig‘ida'),
  water: z.coerce.number().int().min(1).max(3) as z.ZodType<1 | 2 | 3>,
  landType: z.enum(['paxta-galla', 'sabzavot-poliz']),
});

const limiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Juda ko‘p so‘rov, birozdan keyin urinib ko‘ring.' } });

adviceRouter.post('/advice', limiter, optionalAuth, async (req, res) => {
  const land = parseBody(landSchema.extend({ saveProfile: z.boolean().optional() }), req);
  const { saveProfile, ...input } = land;
  if (req.userId && saveProfile) {
    await prisma.farm.upsert({ where: { userId: req.userId }, create: { userId: req.userId, state: input }, update: { state: input } });
    await prisma.user.update({ where: { id: req.userId }, data: { region: input.region, district: input.district } });
  }
  res.json(await recommend(input));
});
