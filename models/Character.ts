import mongoose from 'mongoose';
import { CharacterType } from '../types';

const characterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    imageSrc: { type: String, required: true },
    level: { type: Number, default: 1 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<CharacterType>('Character', characterSchema);
