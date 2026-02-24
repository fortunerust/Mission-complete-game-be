import { Request, Response, NextFunction } from 'express';

interface Err extends Error {
  statusCode?: number;
}

export default function errorHandler(
  err: Err,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err.stack);
  const status = err.statusCode ?? 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
}
