// Bozor narxlari. PRICE_FEED_URL berilsa, tashqi manbadan soatiga bir marta yangilanadi;
// aks holda bazadagi ma'lumot (dastlab — namuna/demo narxlar) ko'rsatiladi.
import { z } from 'zod';
import { env } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';

const feedSchema = z.array(
  z.object({
    product: z.string().min(1),
    market: z.string().min(1),
    price: z.coerce.number().positive(),
    unit: z.string().optional(),
    date: z.string().optional(),
  }),
);

let lastSync = 0;

async function syncFeed() {
  if (!env.PRICE_FEED_URL || Date.now() - lastSync < 60 * 60 * 1000) return;
  lastSync = Date.now();
  try {
    const res = await fetch(env.PRICE_FEED_URL, { signal: AbortSignal.timeout(10_000) });
    const rows = feedSchema.parse(await res.json());
    const source = new URL(env.PRICE_FEED_URL).hostname;
    for (const r of rows) {
      const day = r.date ? new Date(r.date) : new Date();
      day.setUTCHours(0, 0, 0, 0);
      await prisma.marketPrice.upsert({
        where: { product_market_recordedAt: { product: r.product, market: r.market, recordedAt: day } },
        create: { product: r.product, market: r.market, price: Math.round(r.price), unit: r.unit ?? 'kg', source, recordedAt: day },
        update: { price: Math.round(r.price), source },
      });
    }
  } catch (e) {
    console.warn('[prices] tashqi manbadan yangilab bo‘lmadi:', (e as Error).message);
  }
}

export async function latestPrices() {
  await syncFeed();
  const latest = await prisma.marketPrice.findFirst({ orderBy: { recordedAt: 'desc' } });
  if (!latest) return { date: null, rows: [], products: [], markets: [], sources: [] };

  const weekAgo = new Date(latest.recordedAt.getTime() - 7 * 86_400_000);
  const [today, prev] = await Promise.all([
    prisma.marketPrice.findMany({ where: { recordedAt: latest.recordedAt }, orderBy: [{ product: 'asc' }, { market: 'asc' }] }),
    prisma.marketPrice.findMany({ where: { recordedAt: weekAgo } }),
  ]);
  const prevMap = new Map(prev.map((p) => [`${p.product}|${p.market}`, p.price]));
  const rows = today.map((p) => {
    const before = prevMap.get(`${p.product}|${p.market}`);
    return { ...p, changePct: before ? ((p.price - before) / before) * 100 : null };
  });
  return {
    date: latest.recordedAt,
    rows,
    products: [...new Set(today.map((p) => p.product))],
    markets: [...new Set(today.map((p) => p.market))],
    sources: [...new Set(today.map((p) => p.source))],
  };
}

export async function priceHistory(product: string) {
  const since = new Date(Date.now() - 30 * 86_400_000);
  return prisma.marketPrice.findMany({ where: { product, recordedAt: { gte: since } }, orderBy: { recordedAt: 'asc' } });
}
