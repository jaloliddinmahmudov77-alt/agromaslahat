import type { Request } from 'express';
import { z } from 'zod';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const notFound = (what = 'Ma’lumot') => new HttpError(404, `${what} topilmadi`);

/** So'rov tanasini zod sxemasi bo'yicha tekshiradi; xato bo'lsa 400 qaytaradi. */
export function parseBody<T extends z.ZodType>(schema: T, req: Request): z.infer<T> {
  const r = schema.safeParse(req.body);
  if (!r.success) {
    const first = r.error.issues[0];
    throw new HttpError(400, first ? `${first.path.join('.') || 'so‘rov'}: ${first.message}` : 'Noto‘g‘ri so‘rov');
  }
  return r.data;
}

export function param(req: Request, name: string): string {
  const v = req.params[name];
  if (typeof v !== 'string' || !v) throw new HttpError(400, `${name} ko‘rsatilmagan`);
  return v;
}
