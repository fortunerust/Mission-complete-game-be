import mongoose from 'mongoose';
import { TransactionType } from '../types';

const transactionSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    totalCost: { type: Number, required: true },
    txSignature: { type: String, required: true },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ createdAt: -1 });

export default mongoose.model<TransactionType>('Transaction', transactionSchema);
