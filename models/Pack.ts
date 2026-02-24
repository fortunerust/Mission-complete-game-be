import mongoose from 'mongoose';
import type { PackType } from '../types/pack';

const packSchema = new mongoose.Schema(
  {
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<PackType>('Pack', packSchema);
