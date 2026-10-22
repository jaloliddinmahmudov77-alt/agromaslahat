// Kontentni bazaga yuklaydi. Qayta ishga tushirish xavfsiz (slug bo'yicha upsert).
import { PrismaClient } from '@prisma/client';
import { CROPS } from './data/crops.js';
import { DISEASES } from './data/diseases.js';
import { ARTICLES } from './data/articles.js';

const prisma = new PrismaClient();

// Namuna (demo) bozor narxlari — haqiqiy integratsiya ulanguncha interfeysni ko'rsatish uchun.
const DEMO_PRODUCTS: [string, number][] = [
  ['Piyoz', 3000],
  ['Kartoshka', 4500],
  ['Sabzi', 3500],
  ['Pomidor', 8000],
  ['Mosh', 18000],
  ['Guruch', 16000],
  ['No‘xat', 14000],
  ['Loviya', 20000],
  ['Tarvuz', 2500],
  ['Qovun', 5000],
];
const DEMO_MARKETS: [string, number][] = [
  ['Toshkent', 1.12],
  ['Samarqand', 1.0],
  ['Andijon', 0.95],
  ['Guliston', 0.92],
  ['Qarshi', 0.97],
  ['Nukus', 1.05],
];

function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

async function seedDemoPrices() {
  await prisma.marketPrice.deleteMany({ where: { source: 'demo' } });
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const rows = [];
  for (let d = 13; d >= 0; d--) {
    const day = new Date(today.getTime() - d * 86_400_000);
    for (const [pi, [product, base]] of DEMO_PRODUCTS.entries()) {
      for (const [mi, [market, factor]] of DEMO_MARKETS.entries()) {
        const drift = 1 + 0.06 * Math.sin((d + pi * 3) / 4) + 0.04 * (rand(pi * 100 + mi * 10 + d) - 0.5);
        rows.push({ product, market, price: Math.round((base * factor * drift) / 100) * 100, unit: 'kg', source: 'demo', recordedAt: day });
      }
    }
  }
  await prisma.marketPrice.createMany({ data: rows, skipDuplicates: true });
  return rows.length;
}

async function main() {
  for (const c of CROPS) {
    const data = { ...c, careStages: c.careStages as object[] };
    await prisma.crop.upsert({ where: { slug: c.slug }, create: data, update: data });
  }
  for (const d of DISEASES) {
    await prisma.disease.upsert({ where: { slug: d.slug }, create: d, update: d });
  }
  for (const a of ARTICLES) {
    await prisma.article.upsert({ where: { slug: a.slug }, create: a, update: a });
  }
  const prices = await seedDemoPrices();
  console.log(`[seed] ${CROPS.length} ekin, ${DISEASES.length} kasallik/zararkunanda, ${ARTICLES.length} maqola, ${prices} narx yozuvi.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
