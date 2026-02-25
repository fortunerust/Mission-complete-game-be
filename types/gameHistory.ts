import { Types } from 'mongoose';

export type GameStation = 'in_progress' | 'completed';

export interface GameHistoryType {
  _id?: Types.ObjectId;
  player: Types.ObjectId;
  missionId: Types.ObjectId;
  gameStation: GameStation;
  startTime: Date;
  endTime: Date;
  completedAt?: Date;
  tokenReward: number;
  claimedToken: boolean;
  expAwarded?: number;
}
