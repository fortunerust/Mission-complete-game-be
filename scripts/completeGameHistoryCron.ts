/**
 * Completes expired in-progress games: marks them completed and awards 20–100 EXP to each player.
 * Run from cron every 1–5 minutes. From backend dir: npm run complete-game-history
 *
 * Example cron (every 5 min): *\/5 * * * * cd /path/to/backend && npm run complete-game-history
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { completeExpiredGames } from '../services/gameHistoryService';
import { mongodbUri } from '../config/config';

async function main() {
  await mongoose.connect(mongodbUri);
  const result = await completeExpiredGames();
  console.log(`Completed ${result.completed} games, ${result.errors} errors.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
