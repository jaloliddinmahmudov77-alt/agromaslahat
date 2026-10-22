// Ekin parvarishi bo'yicha eslatmalar va signallar (AI kabinet).
import type { Crop, Planting } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { getWeather, weatherAlerts, type Weather } from './weather.js';

interface CareStage {
  day: number;
  type: string;
  title: string;
}

const DAY = 86_400_000;

export async function createRemindersForPlanting(planting: Planting, crop: Crop) {
  const stages = (crop.careStages as unknown as CareStage[]) ?? [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.reminder.createMany({
    data: stages.map((s) => {
      const dueDate = new Date(planting.plantedAt.getTime() + s.day * DAY);
      // Ekin orqaga sana bilan qo'shilsa, o'tib ketgan bosqichlar bajarilgan deb hisoblanadi.
      const past = dueDate < today;
      return {
        userId: planting.userId,
        plantingId: planting.id,
        title: `${planting.cropName}: ${s.title}`,
        crop: planting.cropSlug,
        type: s.type,
        dueDate,
        done: past,
        notified: past,
      };
    }),
  });
}

export interface FarmProfile {
  region?: string;
  district?: string;
  area?: number;
  bonitet?: number;
  water?: 1 | 2 | 3;
  landType?: 'paxta-galla' | 'sabzavot-poliz';
}

export async function getProfile(userId: string): Promise<FarmProfile> {
  const farm = await prisma.farm.findUnique({ where: { userId } });
  return (farm?.state as FarmProfile | undefined) ?? {};
}

/**
 * Kabinet ochilganda chaqiriladi: muddati kelgan eslatmalar va ob-havo ogohlantirishlari
 * bo'yicha bildirishnoma yaratadi (bir xil bildirishnoma kuniga bir marta).
 */
export async function getSignals(userId: string) {
  const now = new Date();
  const profile = await getProfile(userId);

  const due = await prisma.reminder.findMany({
    where: { userId, done: false, notified: false, dueDate: { lte: new Date(now.getTime() + DAY) } },
  });
  if (due.length) {
    await prisma.notification.createMany({
      data: due.map((r) => ({
        userId,
        title: r.dueDate < now ? `Muddati o‘tdi: ${r.title}` : `Ertaga: ${r.title}`,
        body: r.note ?? 'Kabinetdagi eslatmalarni tekshiring.',
        link: '/kabinet',
      })),
    });
    await prisma.reminder.updateMany({ where: { id: { in: due.map((r) => r.id) } }, data: { notified: true } });
  }

  const upcoming = await prisma.reminder.findMany({
    where: { userId, done: false, dueDate: { lte: new Date(now.getTime() + 14 * DAY) } },
    orderBy: { dueDate: 'asc' },
    take: 30,
  });

  let weather: Weather | null = null;
  let alerts: string[] = [];
  if (profile.region) {
    try {
      weather = await getWeather(profile.region);
      const irrigationSoon = upcoming.some((r) => r.type === 'sugorish' && r.dueDate.getTime() - now.getTime() < 3 * DAY);
      const hasActive = (await prisma.planting.count({ where: { userId, status: 'active' } })) > 0;
      alerts = hasActive ? weatherAlerts(weather, irrigationSoon) : [];
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      for (const a of alerts) {
        const exists = await prisma.notification.findFirst({ where: { userId, body: a, createdAt: { gte: startOfDay } } });
        if (!exists) await prisma.notification.create({ data: { userId, title: 'Ob-havo signali', body: a, link: '/kabinet' } });
      }
    } catch (e) {
      console.warn('[signals] ob-havo:', (e as Error).message);
    }
  }

  return { profile, upcoming, weather, alerts };
}
