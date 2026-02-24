import { Types } from "mongoose";

export interface MapType{
    _id?: Types.ObjectId;
    name: string;
    imageSrc: string;
    order: number;
    unlocked: boolean;
    selected: boolean;
}