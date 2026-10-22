// O'zbekiston viloyatlari: markaz koordinatalari (ob-havo uchun) va asosiy bozor nomi.
export interface Region {
  id: string;
  name: string;
  center: string;
  lat: number;
  lon: number;
}

export const REGIONS: Region[] = [
  { id: 'qoraqalpogiston', name: 'Qoraqalpog‘iston Respublikasi', center: 'Nukus', lat: 42.46, lon: 59.6 },
  { id: 'andijon', name: 'Andijon viloyati', center: 'Andijon', lat: 40.78, lon: 72.34 },
  { id: 'buxoro', name: 'Buxoro viloyati', center: 'Buxoro', lat: 39.77, lon: 64.42 },
  { id: 'jizzax', name: 'Jizzax viloyati', center: 'Jizzax', lat: 40.12, lon: 67.84 },
  { id: 'qashqadaryo', name: 'Qashqadaryo viloyati', center: 'Qarshi', lat: 38.86, lon: 65.79 },
  { id: 'navoiy', name: 'Navoiy viloyati', center: 'Navoiy', lat: 40.1, lon: 65.37 },
  { id: 'namangan', name: 'Namangan viloyati', center: 'Namangan', lat: 41.0, lon: 71.67 },
  { id: 'samarqand', name: 'Samarqand viloyati', center: 'Samarqand', lat: 39.65, lon: 66.96 },
  { id: 'surxondaryo', name: 'Surxondaryo viloyati', center: 'Termiz', lat: 37.22, lon: 67.28 },
  { id: 'sirdaryo', name: 'Sirdaryo viloyati', center: 'Guliston', lat: 40.49, lon: 68.78 },
  { id: 'toshkent-vil', name: 'Toshkent viloyati', center: 'Nurafshon', lat: 41.04, lon: 69.36 },
  { id: 'toshkent', name: 'Toshkent shahri', center: 'Toshkent', lat: 41.31, lon: 69.28 },
  { id: 'fargona', name: 'Farg‘ona viloyati', center: 'Farg‘ona', lat: 40.38, lon: 71.78 },
  { id: 'xorazm', name: 'Xorazm viloyati', center: 'Urganch', lat: 41.55, lon: 60.63 },
];

export const REGION_IDS = REGIONS.map((r) => r.id);

export function findRegion(id: string | null | undefined): Region | undefined {
  return REGIONS.find((r) => r.id === id);
}

export const WATER_LEVELS = ['', 'Kam (suv tanqis)', 'O‘rtacha', 'Yaxshi (suv yetarli)'] as const;

export const LAND_TYPES = [
  { id: 'paxta-galla', name: 'Paxta-g‘alla yeri' },
  { id: 'sabzavot-poliz', name: 'Meva-sabzavot va poliz yeri' },
] as const;
