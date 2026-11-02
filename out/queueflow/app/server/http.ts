import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { readDb } from './db';
import type { Db, Role, User } from '../shared/types';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export function fail(status: number, code: string, message: string, fields?: Record<string, string>): never {
  throw new HttpError(status, code, message, fields);
}

export function failValidation(fields: Record<string, string>): never {
  return fail(400, 'VALIDATION_ERROR', Object.values(fields)[0] ?? 'Invalid input', fields);
}

export const attachUser: RequestHandler = (req, res, next) => {
  const userId = req.header('X-User-Id');
  if (userId === undefined) {
    res.locals.user = null;
    next();
    return;
  }
  const user = readDb<Db>().users.find((u) => u.id === userId);
  if (!user) {
    next(new HttpError(401, 'UNKNOWN_USER', 'Unknown demo account'));
    return;
  }
  res.locals.user = user;
  next();
};

export function optionalUser(res: Response): User | null {
  return (res.locals.user as User | null) ?? null;
}

export function requireRole(...roles: Role[]): RequestHandler {
  return (_req, res, next) => {
    const user = optionalUser(res);
    if (!user) {
      next(new HttpError(401, 'UNKNOWN_USER', 'Select a demo account to continue'));
      return;
    }
    if (!roles.includes(user.role)) {
      next(new HttpError(403, 'FORBIDDEN', 'You do not have permission to do this'));
      return;
    }
    next();
  };
}

export function sessionUser(res: Response): User {
  const user = optionalUser(res);
  if (!user) return fail(401, 'UNKNOWN_USER', 'Select a demo account to continue');
  return user;
}

export function bodyOf<T>(req: Request): Partial<T> {
  return (req.body ?? {}) as Partial<T>;
}

export function handleErrors(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, fields: err.fields } });
    return;
  }
  const parseFailure = (err as { type?: string } | null)?.type === 'entity.parse.failed';
  if (parseFailure) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON' } });
    return;
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}
