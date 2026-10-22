// Ekinlar, kasalliklar va maqolalar (ochiq kontent).
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { notFound, param } from '../lib/http.js';

export const contentRouter = Router();

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

contentRouter.get('/crops', async (req, res) => {
  const q = str(req.query.q);
  const category = str(req.query.category);
  const crops = await prisma.crop.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    },
    select: { slug: true, name: true, emoji: true, category: true, summary: true, yieldMinT: true, yieldMaxT: true, growDays: true, waterNeed: true },
    orderBy: { name: 'asc' },
  });
  res.json({ crops });
});

contentRouter.get('/crops/:slug', async (req, res) => {
  const crop = await prisma.crop.findUnique({ where: { slug: param(req, 'slug') } });
  if (!crop) throw notFound('Ekin');
  const related = await prisma.disease.findMany({
    where: { slug: { in: [...crop.diseases, ...crop.pests] } },
    select: { slug: true, name: true, kind: true },
  });
  res.json({ crop, related });
});

contentRouter.get('/diseases', async (req, res) => {
  const kind = str(req.query.kind);
  const crop = str(req.query.crop);
  const q = str(req.query.q);
  const diseases = await prisma.disease.findMany({
    where: {
      ...(kind ? { kind } : {}),
      ...(crop ? { crops: { has: crop } } : {}),
      ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
    },
    select: { slug: true, name: true, kind: true, crops: true, symptoms: true },
    orderBy: { name: 'asc' },
  });
  res.json({ diseases });
});

contentRouter.get('/diseases/:slug', async (req, res) => {
  const disease = await prisma.disease.findUnique({ where: { slug: param(req, 'slug') } });
  if (!disease) throw notFound('Kasallik');
  const crops = await prisma.crop.findMany({ where: { slug: { in: disease.crops } }, select: { slug: true, name: true, emoji: true } });
  res.json({ disease, crops });
});

contentRouter.get('/articles', async (_req, res) => {
  const articles = await prisma.article.findMany({
    select: { slug: true, title: true, excerpt: true, category: true, season: true, readMinutes: true, publishedAt: true },
    orderBy: { publishedAt: 'desc' },
  });
  res.json({ articles });
});

contentRouter.get('/articles/:slug', async (req, res) => {
  const slug = param(req, 'slug');
  const article = await prisma.article.update({ where: { slug }, data: { views: { increment: 1 } } }).catch(() => null);
  if (!article) throw notFound('Maqola');
  res.json({ article });
});
