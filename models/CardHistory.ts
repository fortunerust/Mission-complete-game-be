import mongoose from 'mongoose';
import { CardHistoryType } from '../types';

const cardHistorySchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card', required: true },
        action: { type: String, enum: ['purchase', 'use'], required: true },
    },
    { timestamps: true }
);

export default mongoose.model<CardHistoryType>('CardHistory', cardHistorySchema);