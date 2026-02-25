import GameHistory from '../models/GameHistory';
import User from '../models/User';
import { GameHistoryType } from '../types';
import type { UserType } from '../types/user';

/** Min/max EXP awarded per mission completion (inclusive). */
const EXP_MIN = 20;
const EXP_MAX = 100;

function randomExp(): number {
  return Math.floor(Math.random() * (EXP_MAX - EXP_MIN + 1)) + EXP_MIN;
}

/**
 * Complete expired in-progress games for a single wallet. Returns completed games and updated user.
 * Used by GET recent-completions API.
 */
export async function completeExpiredGamesForWallet(wallet: string): Promise<{ completed: GameHistoryType[]; user: UserType }> {
  const now = new Date();
  const userDoc = await User.findOne({ wallet: String(wallet).trim() });
  if (!userDoc) {
    return { completed: [], user: {} as UserType };
  }
  const expired = await GameHistory.find({
    player: userDoc._id,
    gameStation: 'in_progress',
    endTime: { $lte: now },
  }).lean();

  const completed: GameHistoryType[] = [];
  
  for (const game of expired) {
    try {
      const exp = randomExp();
      await User.findByIdAndUpdate(game.player, { $inc: { experience: exp } });
      const updatedUser = await User.findById(game.player).select('experience level').lean();
      if (updatedUser) {
        const levelFromExp = Math.floor((updatedUser.experience ?? 0) / 1000) + 1;
        console.log("🚀 ~ completeExpiredGamesForWallet ~ levelFromExp:", levelFromExp)
        if ((updatedUser.level ?? 1) < levelFromExp) {
          await User.findByIdAndUpdate(game.player, { $set: { level: levelFromExp } });
        }
      }
      const updatedGame = await GameHistory.findByIdAndUpdate(
        game._id,
        {
          gameStation: 'completed',
          completedAt: now,
          expAwarded: exp,
        },
        { new: true } // Return the updated document, not the original
      ).lean();
      if (updatedGame) completed.push(updatedGame as GameHistoryType);
    } catch (err) {
      console.error('Error completing expired game:', err);
    }
  }
  
  const user = await User.findById(userDoc._id).lean();
  return { completed, user: (user ?? {}) as UserType };
}