import mongoose from 'mongoose';
import { CardType } from '../types';

const cardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    value: { type: String, default: 'FX500' },
    type: { type: String, enum: ['blue', 'pink'], default: 'blue' },
    imageBg: { type: String, default: '/images/card/bgs/fx500.svg' },
    imageItem: { type: String, default: '/images/card/items/fx500.svg' },
    stats: {
      physique: { type: Number, default: 100 },
      strength: { type: Number, default: 100 },
      charisma: { type: Number, default: 100 },
      rizz: { type: Number, default: 100 },
    },
  },
  { timestamps: true }
);

export default mongoose.model<CardType>('Card', cardSchema);
