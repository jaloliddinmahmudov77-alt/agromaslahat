// Google Gemini REST API bilan ishlash (SDK siz, oddiy fetch).
import { env } from './env.js';
import { HttpError } from './http.js';

export interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}
export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export const aiEnabled = () => Boolean(env.GEMINI_API_KEY);

export const AI_DISABLED_MSG = 'AgroAI hali ulanmagan: serverda GEMINI_API_KEY sozlanmagan.';

export async function generate(opts: {
  system: string;
  contents: GeminiContent[];
  json?: boolean;
  temperature?: number;
}): Promise<string> {
  if (!aiEnabled()) throw new HttpError(503, AI_DISABLED_MSG);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: opts.contents,
      generationConfig: {
        temperature: opts.temperature ?? 0.4,
        ...(opts.json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[gemini]', res.status, body.slice(0, 500));
    throw new HttpError(502, 'AgroAI javob bera olmadi, birozdan keyin qayta urinib ko‘ring.');
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text) throw new HttpError(502, 'AgroAI bo‘sh javob qaytardi.');
  return text;
}

export function parseJson<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new HttpError(502, 'AgroAI javobini o‘qib bo‘lmadi, qayta urinib ko‘ring.');
  }
}

/** data:image/...;base64,XXXX ko'rinishidagi satrni ajratadi. */
export function parseDataUrl(dataUrl: string): { mime: string; data: string } {
  const m = /^data:(image\/(?:jpeg|png|webp|heic|heif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw new HttpError(400, 'Rasm formati qo‘llab-quvvatlanmaydi (JPG, PNG, WEBP)');
  return { mime: m[1]!, data: m[2]! };
}

export const AGRO_SYSTEM = `Sen "AgroAI" — O‘zbekiston fermerlari uchun agronom-maslahatchisan.
Har doim o‘zbek tilida (lotin yozuvida), sodda va amaliy tilda javob ber.
O‘zbekiston iqlimi, viloyatlari va sug‘oriladigan dehqonchilik sharoitini hisobga ol.
Kimyoviy preparatlarni tavsiya qilganda faqat ta’sir etuvchi modda guruhini ayt va "O‘zbekistonda ro‘yxatdan o‘tgan preparatni yorliqdagi me’yorda qo‘llang" deb eslat; aniq doza o‘ylab topma.
Bilmagan narsangni bilmayman de. Jiddiy holatlarda mahalliy agronom yoki o‘simliklarni himoya qilish xizmatiga murojaat qilishni tavsiya et.`;
