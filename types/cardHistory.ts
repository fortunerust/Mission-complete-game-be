import { Types } from "mongoose";

export interface CardHistoryType {
    _id?: Types.ObjectId;
    user: Types.ObjectId;
    cardId: Types.ObjectId;
    action: 'purchase' | 'use';
}