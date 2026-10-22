const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktyabr', 'noyabr', 'dekabr'];
const WEEKDAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

export function fmtDate(d: string | Date) {
  const x = new Date(d);
  return `${x.getDate()}-${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
}

export function fmtShortDate(d: string | Date) {
  const x = new Date(d);
  return `${x.getDate()}-${MONTHS[x.getMonth()]}`;
}

export function weekday(d: string | Date) {
  return WEEKDAYS[new Date(d).getDay()];
}

export function fmtNum(n: number, digits = 0) {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).replace(/ /g, ' ');
}

export function fmtSum(n: number) {
  return `${fmtNum(Math.round(n))} so‘m`;
}

export function daysUntil(d: string | Date) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return Math.round((x.getTime() - start.getTime()) / 86_400_000);
}

export function relDay(d: string | Date) {
  const n = daysUntil(d);
  if (n === 0) return 'bugun';
  if (n === 1) return 'ertaga';
  if (n === -1) return 'kecha';
  return n > 0 ? `${n} kundan keyin` : `${-n} kun oldin`;
}

export function toInputDate(d: string | Date = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export const REMINDER_TYPES: Record<string, { label: string; color: string }> = {
  ekish: { label: 'Ekish', color: 'bg-forest-100 text-forest-900' },
  sugorish: { label: 'Sug‘orish', color: 'bg-sky-100 text-sky-900' },
  ogitlash: { label: 'O‘g‘itlash', color: 'bg-amber-100 text-amber-900' },
  himoya: { label: 'Himoya', color: 'bg-rose-100 text-rose-900' },
  hosil: { label: 'Hosil', color: 'bg-wheat/30 text-wheat-dark' },
  boshqa: { label: 'Ishlov', color: 'bg-stone-200 text-stone-800' },
};

export const WATER_LABEL = ['', 'Kam suv', 'O‘rtacha suv', 'Ko‘p suv'];

/** WMO ob-havo kodi bo'yicha emoji va izoh. */
export function weatherIcon(code: number): [string, string] {
  if (code === 0) return ['☀️', 'Ochiq'];
  if (code <= 2) return ['🌤️', 'Qisman bulutli'];
  if (code === 3) return ['☁️', 'Bulutli'];
  if (code <= 48) return ['🌫️', 'Tuman'];
  if (code <= 67) return ['🌧️', 'Yomg‘ir'];
  if (code <= 77) return ['🌨️', 'Qor'];
  if (code <= 82) return ['🌦️', 'Jala'];
  return ['⛈️', 'Momaqaldiroq'];
}
