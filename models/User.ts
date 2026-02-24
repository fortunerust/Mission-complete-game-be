import mongoose from 'mongoose';
import type { UserType } from '../types/user';

const userSchema = new mongoose.Schema(
  {
    wallet: { type: String, required: true, unique: true },
    mapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Map', default: new mongoose.Types.ObjectId("699c319c3e749844da50e11d") },
    characterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Character', default: new mongoose.Types.ObjectId("699c35593e749844da50e126") },
    energy: { type: Number, default: 0 },
    packs: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model<UserType>('User', userSchema);
