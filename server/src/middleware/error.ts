import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/http.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.too.large') {
    res.status(413).json({ error: 'Fayl juda katta (8 MB gacha)' });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
}
