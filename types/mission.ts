import { Types } from "mongoose";

export interface MissionType {
  _id?: Types.ObjectId;
  mapId: Types.ObjectId;
  order: number;
  name: string;
  description: string;
  duration: string;
  /** Use quoted key because yield is a reserved word */
  'yield': number;
  stars: number;
  imageSrc: string;
}