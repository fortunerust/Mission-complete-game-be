import mongoose from 'mongoose';
import { MissionType } from '../types';

const missionSchema = new mongoose.Schema(
  {
    mapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Map', required: true, index: true },
    order: { type: Number, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    duration: { type: String, default: '2 HRS' },
    yield: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    imageSrc: { type: String, default: '/images/missioins/gym.svg' },
  },
  { timestamps: true }
);

export default mongoose.model<MissionType>('Mission', missionSchema);
