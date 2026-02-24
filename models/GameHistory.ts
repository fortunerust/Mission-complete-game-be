import mongoose from 'mongoose';
import type { GameHistoryType } from '../types/gameHistory';

const gameHistorySchema = new mongoose.Schema(
  {
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission', required: true },
    gameStation: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress', index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    completedAt: { type: Date },
    expAwarded: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model<GameHistoryType>('GameHistory', gameHistorySchema);
