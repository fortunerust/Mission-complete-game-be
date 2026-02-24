import { Request, Response } from 'express';

export const getHealth = (_req: Request, res: Response): void => {
  res.json({ status: 'ok', message: 'LM Game API is running' });
};
