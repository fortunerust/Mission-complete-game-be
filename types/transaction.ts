import { Types } from "mongoose";

export interface TransactionType {
  _id?: Types.ObjectId;
  user: string;
  type: string;
  totalCost: number;
  txSignature: string;
}