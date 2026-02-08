import { Types } from "mongoose";
import { ICar } from "../car/car.interface";
import { IUser } from "../user/user.interface";
import { RideStatus } from "./ride.enum";

export interface IRide {
  _id?: Types.ObjectId;
  car?: string | Types.ObjectId | ICar;
  driver?: Types.ObjectId | IUser;
  user: Types.ObjectId;
  startLocation: string;
  endLocation: string;
  distance: number;
  date: Date;
  startTime: Date;
  fare: number;
  proposals: IRideProposal[];
  status: RideStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRideProposal {
  _id?: Types.ObjectId;
  driver: Types.ObjectId | IUser;
  car: Types.ObjectId | ICar;
  fare: number;
  message?: string;
  createdAt: Date;
}
