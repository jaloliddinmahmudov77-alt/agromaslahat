// Yer ma'lumotlariga qarab ekin tavsiya qilish: qoidaga asoslangan baholash + ixtiyoriy AI izohi.
import type { Crop } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { aiEnabled, generate, AGRO_SYSTEM } from '../lib/gemini.js';
import { findRegion, LAND_TYPES, WATER_LEVELS } from '../data/regions.js';

export interface LandInput {
  region: string;
  district?: string;
  area: number;
  bonitet: number;
  water: 1 | 2 | 3;
  landType: 'paxta-galla' | 'sabzavot-poliz';
}

export interface Recommendation {
  slug: string;
  name: string;
  emoji: string;
  score: number;
  suitability: string;
  reasons: string[];
  warnings: string[];
  yieldPerHa: { min: number; max: number };
  totalYield: { min: number; max: number };
  plantingTime: string;
  harvest: string;
  growDays: number;
  fertilizerPerHa: string;
  agroWorks: string[];
  secondCrop: boolean;
}

const round = (n: number) => Math.round(n * 10) / 10;
const MAIN_FIELD_CROPS = ['paxta', 'bugdoy'];

function suitability(score: number) {
  if (score >= 85) return 'Juda mos';
  if (score >= 65) return 'Mos';
  if (score >= 45) return 'Shartli mos';
  return 'Tavsiya etilmaydi';
}

export function scoreCrop(crop: Crop, land: LandInput): Recommendation {
  let score = 65;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const secondCrop = land.landType === 'paxta-galla' && !MAIN_FIELD_CROPS.includes(crop.slug);

  // Paxta-g'alla yerida asosiy ekinlar ustun, qolganlari takroriy ekin sifatida tavsiya etiladi.
  if (land.landType === 'paxta-galla') score += secondCrop ? -5 : 10;

  if (crop.regions.includes(land.region)) {
    score += 5;
    reasons.push('Hududingizda keng yetishtiriladi');
  } else {
    score -= 35;
    warnings.push('Hududingiz uchun odatiy ekin emas');
  }

  const gap = land.bonitet - crop.minBonitet;
  if (gap >= 0) {
    // Yer sifati yetarli bo'lsa, talabchanroq (odatda daromadliroq) ekinlarga biroz ustunlik.
    score += Math.min(10, gap / 2) + crop.minBonitet / 5;
    reasons.push(`Ball bonitet (${land.bonitet}) talabga mos (kamida ${crop.minBonitet})`);
  } else {
    score -= -gap * 2;
    warnings.push(`Yer sifati past: kamida ${crop.minBonitet} ball tavsiya etiladi`);
  }

  const waterGap = land.water - crop.waterNeed;
  if (waterGap >= 0) {
    if (crop.waterNeed === 1) reasons.push('Kam suv talab qiladi');
    else reasons.push('Suv ta’minoti yetarli');
  } else {
    score -= 25 * -waterGap;
    warnings.push(`Suvni ko‘p talab qiladi — suv ta’minoti ${WATER_LEVELS[land.water]?.toLowerCase()}`);
  }
  if (land.water === 1 && crop.waterNeed === 1) score += 10;
  if (land.water === 3 && crop.waterNeed === 3) {
    score += 8;
    reasons.push('Suv yetarli — sersuv ekin yuqori hosil beradi');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Taxminiy hosil: bonitet va suv tanqisligiga qarab o'rtacha me'yordan tuzatiladi.
  const factor = Math.max(0.5, Math.min(1.1, 0.85 + gap / 100)) * (waterGap < 0 ? 0.75 ** -waterGap : 1);
  const yieldPerHa = { min: round(crop.yieldMinT * factor), max: round(crop.yieldMaxT * factor) };

  return {
    slug: crop.slug,
    name: crop.name,
    emoji: crop.emoji,
    score,
    suitability: suitability(score),
    reasons,
    warnings,
    yieldPerHa,
    totalYield: { min: round(yieldPerHa.min * land.area), max: round(yieldPerHa.max * land.area) },
    plantingTime: crop.plantingTime,
    harvest: crop.harvest,
    growDays: crop.growDays,
    fertilizerPerHa: crop.fertilizerPerHa,
    agroWorks: crop.agroWorks,
    secondCrop,
  };
}

export async function recommend(land: LandInput) {
  const crops = await prisma.crop.findMany({ where: { landTypes: { has: land.landType } } });
  const ranked = crops.map((c) => scoreCrop(c, land)).sort((a, b) => b.score - a.score);

  let aiSummary: string | null = null;
  if (aiEnabled()) {
    const region = findRegion(land.region);
    const top = ranked.slice(0, 5).map((r) => `${r.name}: ${r.score} ball (${r.suitability}); ${[...r.reasons, ...r.warnings].join('; ')}`);
    try {
      aiSummary = await generate({
        system: AGRO_SYSTEM,
        temperature: 0.3,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Fermer yeri: ${region?.name ?? land.region}${land.district ? `, ${land.district} tumani` : ''}; ${land.area} gektar; ball bonitet ${land.bonitet}; suv ta’minoti: ${WATER_LEVELS[land.water]}; yer turi: ${LAND_TYPES.find((t) => t.id === land.landType)?.name}.
Tizim baholagan eng mos ekinlar:
${top.join('\n')}

Shu ma’lumotlarga tayanib, fermerga 5–7 jumlada qisqa maslahat yoz: qaysi ekinni nega tanlash, nimaga e’tibor berish (sug‘orish, o‘g‘it, yer tayyorlash). Ro‘yxatni takrorlama, sarlavha qo‘yma.`,
              },
            ],
          },
        ],
      });
    } catch (e) {
      console.warn('[advisor] AI izohi olinmadi:', (e as Error).message);
    }
  }

  return { input: land, recommendations: ranked, aiSummary, aiEnabled: aiEnabled() };
}
