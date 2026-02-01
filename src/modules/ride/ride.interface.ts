import { Types } from "mongoose";
import { ICar } from "../car/car.interface";
import { RideStatus } from "./ride.enum";

export interface IRide {
  _id?: Types.ObjectId;
  car?: string | Types.ObjectId | ICar;
  user: Types.ObjectId;
  startLocation: string;
  endLocation: string;
  distance: number;
  date: Date;
  startTime: Date;
  fare: number;
  status: RideStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
