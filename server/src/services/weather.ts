// Open-Meteo orqali 7 kunlik ob-havo prognozi (kalit talab qilinmaydi). Viloyat bo'yicha 30 daqiqa keshlanadi.
import { env } from '../lib/env.js';
import { HttpError } from '../lib/http.js';
import { findRegion } from '../data/regions.js';

export interface WeatherDay {
  date: string;
  tMax: number;
  tMin: number;
  rainMm: number;
  code: number;
}
export interface Weather {
  regionId: string;
  place: string;
  days: WeatherDay[];
}

const cache = new Map<string, { at: number; data: Weather }>();
const TTL = 30 * 60 * 1000;

export async function getWeather(regionId: string): Promise<Weather> {
  const region = findRegion(regionId);
  if (!region) throw new HttpError(400, 'Noma’lum viloyat');
  const hit = cache.get(regionId);
  if (hit && Date.now() - hit.at < TTL) return hit.data;

  const url = new URL(env.WEATHER_API_URL);
  url.searchParams.set('latitude', String(region.lat));
  url.searchParams.set('longitude', String(region.lon));
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code');
  url.searchParams.set('timezone', 'Asia/Tashkent');
  url.searchParams.set('forecast_days', '7');

  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) }).catch(() => null);
  if (!res?.ok) throw new HttpError(502, 'Ob-havo ma’lumotini olib bo‘lmadi');
  const j = (await res.json()) as {
    daily: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[]; weather_code: number[] };
  };
  const d = j.daily;
  const data: Weather = {
    regionId,
    place: region.center,
    days: d.time.map((date, i) => ({
      date,
      tMax: d.temperature_2m_max[i] ?? 0,
      tMin: d.temperature_2m_min[i] ?? 0,
      rainMm: d.precipitation_sum[i] ?? 0,
      code: d.weather_code[i] ?? 0,
    })),
  };
  cache.set(regionId, { at: Date.now(), data });
  return data;
}

/** Ob-havo prognozidan fermer uchun ogohlantirishlar. */
export function weatherAlerts(w: Weather, hasIrrigationSoon: boolean): string[] {
  const alerts: string[] = [];
  const next3 = w.days.slice(0, 3);
  const rain3 = next3.reduce((s, d) => s + d.rainMm, 0);
  if (hasIrrigationSoon && rain3 >= 8) alerts.push(`Keyingi 3 kunda ${rain3.toFixed(0)} mm yomg‘ir kutilmoqda — sug‘orishni kechiktiring.`);
  const hot = w.days.find((d) => d.tMax >= 40);
  if (hot) alerts.push(`${hot.date} kuni ${hot.tMax.toFixed(0)} °C issiq kutilmoqda — sug‘orishni kechki yoki erta tongga o‘tkazing.`);
  const frost = w.days.find((d) => d.tMin <= 0);
  if (frost) alerts.push(`${frost.date} kuni ${frost.tMin.toFixed(0)} °C sovuq kutilmoqda — yosh maysalarni sovuqdan himoya qiling.`);
  const windyRain = w.days.find((d) => d.rainMm >= 20);
  if (windyRain) alerts.push(`${windyRain.date} kuni kuchli yomg‘ir (${windyRain.rainMm.toFixed(0)} mm) — kimyoviy ishlovni boshqa kunga qoldiring.`);
  return alerts;
}
