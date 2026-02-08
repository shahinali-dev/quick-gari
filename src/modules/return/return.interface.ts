import { Types } from "mongoose";
import { ICar } from "../car/car.interface";
import { IUser } from "../user/user.interface";
import { ReturnStatus } from "./return.enum";

export interface IReturn {
  _id?: Types.ObjectId;
  car?: string | Types.ObjectId | ICar;
  driver?: Types.ObjectId | IUser;
  passenger: Types.ObjectId | IUser;
  startLocation: string;
  endLocation: string;
  distance: number;
  date: Date;
  startTime: Date;
  fare: number;
  status: ReturnStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
