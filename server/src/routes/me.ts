// Foydalanuvchining sevimlilari, eslatmalari va bildirishnomalari.
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { notFound, param, parseBody } from '../lib/http.js';
import { requireAuth, uid } from '../middleware/auth.js';

export const meRouter = Router();
meRouter.use('/me', requireAuth);

// --- Sevimlilar ---

meRouter.get('/me/favorites', async (req, res) => {
  const favorites = await prisma.favorite.findMany({ where: { userId: uid(req) }, orderBy: { createdAt: 'desc' } });
  res.json({ favorites });
});

const favSchema = z.object({
  kind: z.enum(['article', 'crop', 'disease']),
  slug: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
});

meRouter.post('/me/favorites', async (req, res) => {
  const userId = uid(req);
  const body = parseBody(favSchema, req);
  const favorite = await prisma.favorite.upsert({
    where: { userId_kind_slug: { userId, kind: body.kind, slug: body.slug } },
    create: { ...body, userId },
    update: { title: body.title },
  });
  res.status(201).json({ favorite });
});

meRouter.delete('/me/favorites/:kind/:slug', async (req, res) => {
  await prisma.favorite.deleteMany({ where: { userId: uid(req), kind: param(req, 'kind'), slug: param(req, 'slug') } });
  res.json({ ok: true });
});

// --- Eslatmalar ---

meRouter.get('/me/reminders', async (req, res) => {
  const all = req.query.all === '1';
  const reminders = await prisma.reminder.findMany({
    where: { userId: uid(req), ...(all ? {} : { done: false }) },
    orderBy: { dueDate: 'asc' },
    take: 200,
  });
  res.json({ reminders });
});

const reminderSchema = z.object({
  title: z.string().trim().min(1).max(160),
  type: z.enum(['sugorish', 'ogitlash', 'himoya', 'ekish', 'hosil', 'boshqa']),
  dueDate: z.coerce.date(),
  note: z.string().trim().max(500).optional(),
  plantingId: z.string().optional(),
});

meRouter.post('/me/reminders', async (req, res) => {
  const userId = uid(req);
  const body = parseBody(reminderSchema, req);
  if (body.plantingId && !(await prisma.planting.findFirst({ where: { id: body.plantingId, userId } }))) throw notFound('Ekin yozuvi');
  const reminder = await prisma.reminder.create({ data: { ...body, userId } });
  res.status(201).json({ reminder });
});

meRouter.patch('/me/reminders/:id', async (req, res) => {
  const body = parseBody(z.object({ done: z.boolean() }), req);
  const { count } = await prisma.reminder.updateMany({ where: { id: param(req, 'id'), userId: uid(req) }, data: { done: body.done } });
  if (!count) throw notFound('Eslatma');
  res.json({ ok: true });
});

meRouter.delete('/me/reminders/:id', async (req, res) => {
  const { count } = await prisma.reminder.deleteMany({ where: { id: param(req, 'id'), userId: uid(req) } });
  if (!count) throw notFound('Eslatma');
  res.json({ ok: true });
});

// --- Bildirishnomalar ---

meRouter.get('/me/notifications', async (req, res) => {
  const userId = uid(req);
  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  res.json({ notifications, unread });
});

meRouter.post('/me/notifications/read-all', async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: uid(req), read: false }, data: { read: true } });
  res.json({ ok: true });
});
