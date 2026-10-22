// Mavsum yakuni hisoboti: xarajat, daromad, soliq va sof foyda.
import type { Expense, Planting } from '@prisma/client';

export const EXPENSE_CATEGORIES: Record<string, string> = {
  urug: 'Urug‘ / ko‘chat',
  ogit: 'O‘g‘it',
  dori: 'Himoya vositalari',
  suv: 'Suv',
  texnika: 'Texnika va yoqilg‘i',
  'ish-haqi': 'Ish haqi',
  ijara: 'Yer ijarasi',
  boshqa: 'Boshqa',
};

export function computeReport(p: Planting & { expenses: Expense[] }) {
  const byCategory: Record<string, number> = {};
  for (const e of p.expenses) byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
  const totalCost = p.expenses.reduce((s, e) => s + e.amount, 0);
  const revenue = p.revenue ?? 0;
  const tax = p.taxPaid ?? 0;
  const net = revenue - totalCost - tax;
  const harvestT = (p.harvestKg ?? 0) / 1000;

  let verdict: string;
  if (p.status !== 'harvested') verdict = 'Mavsum davom etmoqda — hosil va daromad kiritilgach yakuniy xulosa chiqadi.';
  else if (net > 0 && revenue > 0 && net / revenue >= 0.2) verdict = 'Foydali mavsum. Bu ekinni keyingi yil ham ekish tavsiya etiladi.';
  else if (net > 0) verdict = 'Foyda kam. Keyingi mavsumda xarajatlarni (ayniqsa eng katta toifani) qisqartirish yoki boshqa ekinni ko‘rib chiqish kerak.';
  else verdict = 'Zarar bilan yakunlandi. Keyingi mavsumda boshqa ekin yoki boshqa sotish kanalini tanlash tavsiya etiladi.';

  return {
    totalCost,
    byCategory,
    revenue,
    tax,
    net,
    harvestT,
    yieldPerHa: p.area ? harvestT / p.area : 0,
    costPerHa: p.area ? totalCost / p.area : 0,
    netPerHa: p.area ? net / p.area : 0,
    costPerKg: p.harvestKg ? totalCost / p.harvestKg : null,
    margin: revenue ? net / revenue : null,
    verdict,
  };
}
