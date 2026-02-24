import { Request, Response, NextFunction } from 'express';
import Transaction from '../models/Transaction';
import { Types } from 'mongoose';

export const createTransaction = async (user: string, type: string, totalCost: number, txSignature: string): Promise<Types.ObjectId> => {
  try {
    const tx = await Transaction.create({
      user,
      type,
      totalCost,
      txSignature: txSignature,
    });
    return tx._id;
  } catch (err) {
    throw err;
  }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, type, limit = 100 } = req.query;
    const filter: Record<string, string> = {};
    if (user) filter.user = String(user);
    if (type) filter.type = String(type);
    const list = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
    res.json({ transactions: list });
  } catch (err) {
    next(err);
  }
};
