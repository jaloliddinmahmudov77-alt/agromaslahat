import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { HttpError, parseBody } from '../lib/http.js';
import { clearAuthCookie, optionalAuth, setAuthCookie } from '../middleware/auth.js';
import { REGION_IDS } from '../data/regions.js';

export const authRouter = Router();

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Juda ko‘p urinish. 15 daqiqadan keyin qayta urinib ko‘ring.' } });

const publicUser = { id: true, email: true, name: true, region: true, district: true, createdAt: true } as const;

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Ism kamida 2 harf').max(80),
  email: z.email('Email noto‘g‘ri').transform((s) => s.toLowerCase()),
  password: z.string().min(8, 'Parol kamida 8 belgi').max(128),
  region: z.enum(REGION_IDS as [string, ...string[]]).optional(),
  district: z.string().trim().max(80).optional(),
});

authRouter.post('/register', limiter, async (req, res) => {
  const body = parseBody(registerSchema, req);
  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) throw new HttpError(409, 'Bu email bilan hisob allaqachon mavjud');
  const user = await prisma.user.create({
    data: { name: body.name, email: body.email, passwordHash: await bcrypt.hash(body.password, 10), region: body.region, district: body.district },
    select: publicUser,
  });
  if (body.region) {
    await prisma.farm.create({ data: { userId: user.id, state: { region: body.region, district: body.district } } });
  }
  setAuthCookie(res, user.id);
  res.status(201).json({ user });
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string().min(1),
});

authRouter.post('/login', limiter, async (req, res) => {
  const body = parseBody(loginSchema, req);
  const found = await prisma.user.findUnique({ where: { email: body.email } });
  if (!found || !(await bcrypt.compare(body.password, found.passwordHash))) {
    throw new HttpError(401, 'Email yoki parol noto‘g‘ri');
  }
  setAuthCookie(res, found.id);
  const user = await prisma.user.findUnique({ where: { id: found.id }, select: publicUser });
  res.json({ user });
});

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

authRouter.get('/me', optionalAuth, async (req, res) => {
  const user = req.userId ? await prisma.user.findUnique({ where: { id: req.userId }, select: publicUser }) : null;
  if (!user && req.userId) clearAuthCookie(res);
  res.json({ user });
});
