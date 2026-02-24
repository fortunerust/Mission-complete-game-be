import { Request, Response, NextFunction } from 'express';
import GameHistory from '../models/GameHistory';
import User from '../models/User';
import Mission from '../models/Mission';
import { completeExpiredGamesForWallet } from '../services/gameHistoryService';

/** Parse "2 HRS" / "1 HR" to hours number. */
function parseDurationHours(duration: string): number {
  const match = String(duration).match(/^(\d+)\s*HR(?:S)?$/i);
  return match ? Math.max(1, parseInt(match[1], 10)) : 2;
}

/** List in-progress (and optionally recent completed) game history for a player by wallet. Returns only the latest record per mission. */
export const getByWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wallet, status } = req.query;
    if (!wallet || typeof wallet !== 'string') {
      res.status(400).json({ error: 'wallet query is required' });
      return;
    }
    const user = await User.findOne({ wallet: wallet.trim() }).select('_id').lean();
    if (!user) {
      res.json([]);
      return;
    }
    const match: { player: unknown; gameStation?: string } = { player: user._id };
    if (status === 'in_progress' || status === 'completed') match.gameStation = status;

    const list = await GameHistory.aggregate([
      { $match: match },
      { $sort: { startTime: -1 } },
      { $group: { _id: '$missionId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      {
        $lookup: {
          from: 'missions',
          localField: 'missionId',
          foreignField: '_id',
          as: 'missionId',
        },
      },
      { $unwind: { path: '$missionId', preserveNullAndEmptyArrays: true } },
      { $sort: { startTime: -1 } },
    ]);

    res.json(list);
  } catch (err) {
    next(err);
  }
};

/** Start a new game (mission). Body: { wallet, missionId }. Creates in_progress record with startTime/endTime. */
export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wallet, missionId } = req.body;
    if (!wallet || !missionId) {
      res.status(400).json({ error: 'wallet and missionId are required' });
      return;
    }
    const user = await User.findOne({ wallet: String(wallet).trim() }).select('_id');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const mission = await Mission.findById(missionId).lean();
    if (!mission) {
      res.status(404).json({ error: 'Mission not found' });
      return;
    }
    const durationHours = parseDurationHours(mission.duration ?? '2 HRS');
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
    const game = await GameHistory.create({
      player: user._id,
      missionId,
      gameStation: 'in_progress',
      startTime,
      endTime,
    });
    const populated = await GameHistory.findById(game._id).populate('missionId').lean();
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

/** GET recent mission completions for the current player (consumes and returns; for polling after cron). */
export const getRecentCompletions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wallet } = req.query;
    if (!wallet || typeof wallet !== 'string') {
      res.status(400).json({ error: 'wallet query is required' });
      return;
    }
    const { completed, user } = await completeExpiredGamesForWallet(wallet);
    res.json({ completed, user });
  } catch (err) {
    next(err);
  }
};
