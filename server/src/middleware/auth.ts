import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env, isProd } from '../lib/env.js';
import { HttpError } from '../lib/http.js';

export const COOKIE = 'agro_token';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function setAuthCookie(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '30d' });
  res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: MAX_AGE_MS, path: '/' });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE, { path: '/' });
}

function readUserId(req: Request): string | undefined {
  const token = req.cookies?.[COOKIE];
  if (!token) return undefined;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    return typeof payload === 'object' && typeof payload.sub === 'string' ? payload.sub : undefined;
  } catch {
    return undefined;
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  req.userId = readUserId(req);
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  req.userId = readUserId(req);
  if (!req.userId) return next(new HttpError(401, 'Avval tizimga kiring'));
  next();
}

/** requireAuth dan keyin ishlatiladi. */
export function uid(req: Request): string {
  if (!req.userId) throw new HttpError(401, 'Avval tizimga kiring');
  return req.userId;
}
