import mongoose from 'mongoose';
import { MapType } from '../types';

const mapSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, 
    imageSrc: { type: String, default: '' },
    order: { type: Number, unique: true, default: 0 },
    unlocked: { type: Boolean, default: true },
    selected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<MapType>('Map', mapSchema);
