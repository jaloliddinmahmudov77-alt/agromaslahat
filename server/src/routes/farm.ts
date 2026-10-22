// Shaxsiy kabinet: yer profili, ekinlarim, xarajatlar, hisobot va AI signallari.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { HttpError, notFound, param, parseBody } from '../lib/http.js';
import { AGRO_SYSTEM, aiEnabled, generate } from '../lib/gemini.js';
import { requireAuth, uid } from '../middleware/auth.js';
import { landSchema } from './advice.js';
import { computeReport, EXPENSE_CATEGORIES } from '../services/report.js';
import { createRemindersForPlanting, getProfile, getSignals } from '../services/signals.js';

export const farmRouter = Router();
farmRouter.use('/farm', requireAuth);

farmRouter.get('/farm/profile', async (req, res) => {
  res.json({ profile: await getProfile(uid(req)) });
});

farmRouter.put('/farm/profile', async (req, res) => {
  const userId = uid(req);
  const profile = parseBody(landSchema.partial().required({ region: true }), req);
  await prisma.farm.upsert({ where: { userId }, create: { userId, state: profile }, update: { state: profile } });
  await prisma.user.update({ where: { id: userId }, data: { region: profile.region, district: profile.district } });
  res.json({ profile });
});

farmRouter.get('/farm/signals', async (req, res) => {
  res.json(await getSignals(uid(req)));
});

// --- Ekinlarim ---

async function ownPlanting(userId: string, id: string) {
  const p = await prisma.planting.findFirst({ where: { id, userId }, include: { expenses: { orderBy: { spentAt: 'desc' } } } });
  if (!p) throw notFound('Ekin yozuvi');
  return p;
}

farmRouter.get('/farm/plantings', async (req, res) => {
  const plantings = await prisma.planting.findMany({
    where: { userId: uid(req) },
    include: { expenses: true },
    orderBy: { plantedAt: 'desc' },
  });
  const crops = await prisma.crop.findMany({ where: { slug: { in: plantings.map((p) => p.cropSlug) } }, select: { slug: true, emoji: true, growDays: true } });
  const bySlug = new Map(crops.map((c) => [c.slug, c]));
  res.json({
    plantings: plantings.map(({ expenses, ...p }) => ({
      ...p,
      emoji: bySlug.get(p.cropSlug)?.emoji ?? '🌱',
      growDays: bySlug.get(p.cropSlug)?.growDays ?? null,
      report: computeReport({ ...p, expenses }),
    })),
  });
});

const plantingSchema = z.object({
  cropSlug: z.string().min(1),
  area: z.coerce.number().positive('Maydon 0 dan katta bo‘lsin').max(100_000),
  plantedAt: z.coerce.date(),
  note: z.string().trim().max(500).optional(),
});

farmRouter.post('/farm/plantings', async (req, res) => {
  const userId = uid(req);
  const body = parseBody(plantingSchema, req);
  const crop = await prisma.crop.findUnique({ where: { slug: body.cropSlug } });
  if (!crop) throw new HttpError(400, 'Ekin topilmadi');
  const planting = await prisma.planting.create({ data: { ...body, userId, cropName: crop.name } });
  await createRemindersForPlanting(planting, crop);
  res.status(201).json({ planting });
});

farmRouter.get('/farm/plantings/:id', async (req, res) => {
  const userId = uid(req);
  const p = await ownPlanting(userId, param(req, 'id'));
  const [reminders, crop] = await Promise.all([
    prisma.reminder.findMany({ where: { plantingId: p.id }, orderBy: { dueDate: 'asc' } }),
    prisma.crop.findUnique({ where: { slug: p.cropSlug }, select: { slug: true, name: true, emoji: true, growDays: true, yieldMinT: true, yieldMaxT: true } }),
  ]);
  res.json({ planting: p, crop, reminders, report: computeReport(p) });
});

const updateSchema = z.object({
  area: z.coerce.number().positive().max(100_000).optional(),
  plantedAt: z.coerce.date().optional(),
  status: z.enum(['active', 'harvested']).optional(),
  harvestKg: z.coerce.number().min(0).nullable().optional(),
  revenue: z.coerce.number().min(0).nullable().optional(),
  taxPaid: z.coerce.number().min(0).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});

farmRouter.patch('/farm/plantings/:id', async (req, res) => {
  const p = await ownPlanting(uid(req), param(req, 'id'));
  const body = parseBody(updateSchema, req);
  const planting = await prisma.planting.update({ where: { id: p.id }, data: body });
  if (body.status === 'harvested') {
    await prisma.reminder.updateMany({ where: { plantingId: p.id, done: false }, data: { done: true } });
  }
  res.json({ planting });
});

farmRouter.delete('/farm/plantings/:id', async (req, res) => {
  const p = await ownPlanting(uid(req), param(req, 'id'));
  await prisma.planting.delete({ where: { id: p.id } });
  res.json({ ok: true });
});

const expenseSchema = z.object({
  category: z.enum(Object.keys(EXPENSE_CATEGORIES) as [string, ...string[]]),
  amount: z.coerce.number().positive('Summa 0 dan katta bo‘lsin').max(1e13),
  spentAt: z.coerce.date(),
  note: z.string().trim().max(300).optional(),
});

farmRouter.post('/farm/plantings/:id/expenses', async (req, res) => {
  const p = await ownPlanting(uid(req), param(req, 'id'));
  const body = parseBody(expenseSchema, req);
  const expense = await prisma.expense.create({ data: { ...body, plantingId: p.id } });
  res.status(201).json({ expense });
});

farmRouter.delete('/farm/expenses/:id', async (req, res) => {
  const { count } = await prisma.expense.deleteMany({ where: { id: param(req, 'id'), planting: { userId: uid(req) } } });
  if (!count) throw notFound('Xarajat');
  res.json({ ok: true });
});

farmRouter.post('/farm/plantings/:id/analysis', async (req, res) => {
  const p = await ownPlanting(uid(req), param(req, 'id'));
  const r = computeReport(p);
  if (!aiEnabled()) {
    res.json({ analysis: r.verdict, ai: false });
    return;
  }
  const cats = Object.entries(r.byCategory)
    .map(([k, v]) => `${EXPENSE_CATEGORIES[k] ?? k}: ${Math.round(v).toLocaleString('ru-RU')} so‘m`)
    .join('; ');
  const analysis = await generate({
    system: AGRO_SYSTEM,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Fermerning mavsum natijasi: ekin — ${p.cropName}, maydon ${p.area} ga, holati: ${p.status === 'harvested' ? 'hosil yig‘ilgan' : 'davom etmoqda'}.
Hosil: ${r.harvestT.toFixed(2)} t (${r.yieldPerHa.toFixed(2)} t/ga). Xarajatlar jami: ${Math.round(r.totalCost).toLocaleString('ru-RU')} so‘m (${cats || 'kiritilmagan'}).
Daromad: ${Math.round(r.revenue).toLocaleString('ru-RU')} so‘m, soliq: ${Math.round(r.tax).toLocaleString('ru-RU')} so‘m, sof foyda: ${Math.round(r.net).toLocaleString('ru-RU')} so‘m.
Qisqa tahlil yoz (6–8 jumla): natija yaxshimi, hosildorlik O‘zbekiston o‘rtachasiga nisbatan qanday, qaysi xarajatni kamaytirish mumkin, keyingi mavsumda shu ekinni ekish kerakmi yoki boshqasini. Sarlavha qo‘yma.`,
          },
        ],
      },
    ],
  });
  res.json({ analysis, ai: true });
});

// Barcha ekinlar bo'yicha umumiy ko'rsatkichlar
farmRouter.get('/farm/summary', async (req, res) => {
  const plantings = await prisma.planting.findMany({ where: { userId: uid(req) }, include: { expenses: true } });
  const reports = plantings.map(computeReport);
  res.json({
    active: plantings.filter((p) => p.status === 'active').length,
    harvested: plantings.filter((p) => p.status === 'harvested').length,
    area: plantings.filter((p) => p.status === 'active').reduce((s, p) => s + p.area, 0),
    totalCost: reports.reduce((s, r) => s + r.totalCost, 0),
    revenue: reports.reduce((s, r) => s + r.revenue, 0),
    net: reports.reduce((s, r) => s + r.net, 0),
  });
});
