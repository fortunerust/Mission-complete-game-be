import { Types } from "mongoose";

export interface UserType {
  _id?: Types.ObjectId;
  wallet: string;
  mapId: Types.ObjectId;
  characterId: Types.ObjectId;
  energy?: number;
  packs: number;
  experience: number;
  level: number;
  purchasedCharacters: Types.ObjectId[];
}