import { Request, Response, NextFunction } from 'express';
import GameHistory from '../models/GameHistory';
import User from '../models/User';
import Mission from '../models/Mission';
import { completeExpiredGamesForWallet } from '../services/gameHistoryService';
import { claimTokensForWallet } from '../services/tokenClaimService';

/** Parse "2 HRS" / "1 HR" / "0.005 HRS" to hours number (supports decimals including values < 1). */
function parseDurationHours(duration: string): number {
  const match = String(duration).match(/^(\d+(?:\.\d+)?)\s*HR(?:S)?$/i);
  if (match) {
    const hours = parseFloat(match[1]);
    return hours > 0 ? hours : 2; // Ensure positive value, default to 2 if 0 or negative
  }
  return 2;
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
      tokenReward: mission.yield,
      claimedToken: false,
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

/** GET claimable tokens info (total unclaimed tokens and latest endTime if in-progress). */
export const getClaimableInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wallet } = req.query;
    if (!wallet || typeof wallet !== 'string') {
      res.status(400).json({ error: 'wallet query is required' });
      return;
    }
    const user = await User.findOne({ wallet: wallet.trim() }).select('_id').lean();
    if (!user) {
      res.json({ totalClaimable: 0, latestEndTime: null, hasInProgress: false });
      return;
    }

    // Get unclaimed completed missions
    const unclaimed = await GameHistory.find({
      player: user._id,
      claimedToken: false,
    }).lean();

    const totalClaimable = unclaimed.reduce((sum, game) => sum + (game.tokenReward ?? 0), 0);

    // Get latest in-progress mission endTime
    const inProgress = await GameHistory.findOne({
      player: user._id,
      gameStation: 'in_progress',
    })
      .sort({ endTime: -1 })
      .lean();

    res.json({
      totalClaimable,
      latestEndTime: inProgress?.endTime ? new Date(inProgress.endTime).toISOString() : null,
      hasInProgress: !!inProgress,
    });
  } catch (err) {
    next(err);
  }
};

/** POST claim tokens - transfers tokens from backend wallet to user wallet. */
export const claimTokens = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { wallet } = req.body;
    if (!wallet || typeof wallet !== 'string') {
      res.status(400).json({ error: 'wallet is required' });
      return;
    }

    const result = await claimTokensForWallet(wallet.trim());
    res.json(result);
  } catch (err) {
    next(err);
  }
};
