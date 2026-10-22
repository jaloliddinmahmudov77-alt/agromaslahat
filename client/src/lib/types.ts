export interface User {
  id: string;
  email: string;
  name: string;
  region: string | null;
  district: string | null;
}

export interface Meta {
  regions: { id: string; name: string; center: string }[];
  landTypes: { id: 'paxta-galla' | 'sabzavot-poliz'; name: string }[];
  waterLevels: { id: 1 | 2 | 3; name: string }[];
  expenseCategories: { id: string; name: string }[];
  aiEnabled: boolean;
}

export interface CareStage {
  day: number;
  type: string;
  title: string;
}

export interface CropListItem {
  slug: string;
  name: string;
  emoji: string;
  category: string;
  summary: string;
  yieldMinT: number;
  yieldMaxT: number;
  growDays: number;
  waterNeed: number;
}

export interface Crop extends CropListItem {
  plantingTime: string;
  soil: string;
  irrigation: string;
  fertilizing: string;
  diseases: string[];
  pests: string[];
  careStages: CareStage[];
  harvest: string;
  regions: string[];
  landTypes: string[];
  minBonitet: number;
  fertilizerPerHa: string;
  agroWorks: string[];
}

export interface DiseaseListItem {
  slug: string;
  name: string;
  kind: 'kasallik' | 'zararkunanda';
  crops: string[];
  symptoms: string[];
}

export interface Disease extends DiseaseListItem {
  causes: string[];
  prevention: string[];
  safeCare: string[];
  whenExpert: string;
}

export interface ArticleListItem {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  season: string | null;
  readMinutes: number;
  publishedAt: string;
}
export interface Article extends ArticleListItem {
  body: string;
  views: number;
}

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

export interface AdviceResult {
  input: LandInput;
  recommendations: Recommendation[];
  aiSummary: string | null;
  aiEnabled: boolean;
}

export interface PriceRow {
  id: string;
  product: string;
  market: string;
  price: number;
  unit: string;
  source: string;
  recordedAt: string;
  changePct: number | null;
}

export interface Diagnosis {
  plant: string;
  healthy: boolean;
  problem: string;
  kind: string;
  confidence: string;
  matchSlug: string | null;
  signs: string[];
  actions: string[];
  water: string;
  fertilizer: string;
  whenExpert: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  hadImage: boolean;
  createdAt: string;
}

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

export interface Reminder {
  id: string;
  plantingId: string | null;
  title: string;
  crop: string | null;
  type: string;
  dueDate: string;
  note: string | null;
  done: boolean;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface FarmProfile {
  region?: string;
  district?: string;
  area?: number;
  bonitet?: number;
  water?: 1 | 2 | 3;
  landType?: 'paxta-galla' | 'sabzavot-poliz';
}

export interface Report {
  totalCost: number;
  byCategory: Record<string, number>;
  revenue: number;
  tax: number;
  net: number;
  harvestT: number;
  yieldPerHa: number;
  costPerHa: number;
  netPerHa: number;
  costPerKg: number | null;
  margin: number | null;
  verdict: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  spentAt: string;
  note: string | null;
}

export interface Planting {
  id: string;
  cropSlug: string;
  cropName: string;
  area: number;
  plantedAt: string;
  status: 'active' | 'harvested';
  harvestKg: number | null;
  revenue: number | null;
  taxPaid: number | null;
  note: string | null;
}

export interface PlantingListItem extends Planting {
  emoji: string;
  growDays: number | null;
  report: Report;
}

export interface Favorite {
  id: string;
  kind: 'article' | 'crop' | 'disease';
  slug: string;
  title: string;
}
