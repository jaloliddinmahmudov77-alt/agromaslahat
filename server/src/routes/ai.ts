// AgroAI: rasm orqali kasallik tashxisi va suhbat (chat).
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { HttpError, notFound, param, parseBody } from '../lib/http.js';
import { AGRO_SYSTEM, aiEnabled, generate, parseDataUrl, parseJson, type GeminiContent, type GeminiPart } from '../lib/gemini.js';
import { optionalAuth, requireAuth, uid } from '../middleware/auth.js';
import { findRegion } from '../data/regions.js';

export const aiRouter = Router();

const limiter = rateLimit({ windowMs: 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'AgroAI ga juda ko‘p so‘rov. Bir daqiqadan keyin urinib ko‘ring.' } });

aiRouter.get('/ai/status', (_req, res) => {
  res.json({ enabled: aiEnabled() });
});

// --- Rasm orqali tashxis ---

const diagnoseSchema = z.object({
  image: z.string().max(11_000_000),
  crop: z.string().trim().max(60).optional(),
  note: z.string().trim().max(1000).optional(),
});

interface Diagnosis {
  plant: string;
  healthy: boolean;
  problem: string;
  kind: 'kasallik' | 'zararkunanda' | 'oziqlanish' | 'suv' | 'sog‘lom' | 'noma’lum';
  confidence: 'yuqori' | 'o‘rta' | 'past';
  matchSlug: string | null;
  signs: string[];
  actions: string[];
  water: string;
  fertilizer: string;
  whenExpert: string;
}

aiRouter.post('/ai/diagnose', limiter, optionalAuth, async (req, res) => {
  const body = parseBody(diagnoseSchema, req);
  const img = parseDataUrl(body.image);
  const known = await prisma.disease.findMany({ select: { slug: true, name: true } });

  const text = await generate({
    system: AGRO_SYSTEM,
    json: true,
    temperature: 0.2,
    contents: [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: img.mime, data: img.data } },
          {
            text: `Rasmdagi o‘simlikni tahlil qil va muammoni aniqla.
${body.crop ? `Fermer aytishicha ekin: ${body.crop}.` : ''}
${body.note ? `Fermer izohi: ${body.note}` : ''}
Bazadagi kasallik va zararkunandalar (slug — nomi): ${known.map((k) => `${k.slug} — ${k.name}`).join('; ')}.

Faqat quyidagi JSON ko‘rinishida javob ber:
{"plant": "o‘simlik nomi", "healthy": bool, "problem": "muammo nomi yoki 'Sog‘lom'", "kind": "kasallik|zararkunanda|oziqlanish|suv|sog‘lom|noma’lum", "confidence": "yuqori|o‘rta|past", "matchSlug": "bazadagi mos slug yoki null", "signs": ["rasmda ko‘ringan belgilar"], "actions": ["3–5 ta aniq amaliy qadam"], "water": "sug‘orish bo‘yicha maslahat (ko‘proq/kamroq/o‘zgartirmaslik va nega)", "fertilizer": "o‘g‘itlash bo‘yicha maslahat", "whenExpert": "qachon mutaxassisga murojaat qilish"}
Agar rasmda o‘simlik bo‘lmasa yoki aniqlab bo‘lmasa, kind="noma’lum" va confidence="past" qil.`,
          },
        ],
      },
    ],
  });
  const result = parseJson<Diagnosis>(text);
  if (result.matchSlug && !known.some((k) => k.slug === result.matchSlug)) result.matchSlug = null;
  res.json({ result });
});

// --- Suhbat (chat) ---

aiRouter.get('/ai/chats', requireAuth, async (req, res) => {
  const chats = await prisma.chatSession.findMany({
    where: { userId: uid(req) },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, crop: true, updatedAt: true },
  });
  res.json({ chats });
});

aiRouter.get('/ai/chats/:id', requireAuth, async (req, res) => {
  const chat = await prisma.chatSession.findFirst({
    where: { id: param(req, 'id'), userId: uid(req) },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!chat) throw notFound('Suhbat');
  res.json({ chat });
});

aiRouter.delete('/ai/chats/:id', requireAuth, async (req, res) => {
  const { count } = await prisma.chatSession.deleteMany({ where: { id: param(req, 'id'), userId: uid(req) } });
  if (!count) throw notFound('Suhbat');
  res.json({ ok: true });
});

const messageSchema = z.object({
  chatId: z.string().optional(),
  text: z.string().trim().min(1, 'Savol yozing').max(4000),
  image: z.string().max(11_000_000).optional(),
  crop: z.string().trim().max(60).optional(),
});

aiRouter.post('/ai/chat', limiter, requireAuth, async (req, res) => {
  const userId = uid(req);
  const body = parseBody(messageSchema, req);
  if (!aiEnabled()) throw new HttpError(503, 'AgroAI hali ulanmagan: serverda GEMINI_API_KEY sozlanmagan.');

  let chat = body.chatId
    ? await prisma.chatSession.findFirst({ where: { id: body.chatId, userId }, include: { messages: { orderBy: { createdAt: 'desc' }, take: 20 } } })
    : null;
  if (body.chatId && !chat) throw notFound('Suhbat');

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { region: true, district: true } });
  const region = findRegion(user?.region);
  const history: GeminiContent[] = (chat?.messages ?? [])
    .slice()
    .reverse()
    .map((m) => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.content }] }));

  const parts: GeminiPart[] = [];
  if (body.image) {
    const img = parseDataUrl(body.image);
    parts.push({ inline_data: { mime_type: img.mime, data: img.data } });
  }
  parts.push({ text: body.text });

  const system = `${AGRO_SYSTEM}${region ? `\nFermer hududi: ${region.name}${user?.district ? `, ${user.district} tumani` : ''}.` : ''}${body.crop ? `\nSuhbat mavzusi ekin: ${body.crop}.` : ''}`;
  const answer = await generate({ system, contents: [...history, { role: 'user', parts }] });

  if (!chat) {
    const created = await prisma.chatSession.create({
      data: { userId, title: body.text.slice(0, 60), crop: body.crop, region: user?.region ?? null },
    });
    chat = { ...created, messages: [] };
  }
  const [userMsg, modelMsg] = await prisma.$transaction([
    prisma.chatMessage.create({ data: { sessionId: chat.id, role: 'user', content: body.text, hadImage: Boolean(body.image) } }),
    prisma.chatMessage.create({ data: { sessionId: chat.id, role: 'model', content: answer } }),
    prisma.chatSession.update({ where: { id: chat.id }, data: { updatedAt: new Date() } }),
  ]);
  res.json({ chatId: chat.id, messages: [userMsg, modelMsg] });
});
