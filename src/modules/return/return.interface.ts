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
  amount?: number; // Payment amount
  payment?: Types.ObjectId; // Reference to Payment document
  status: ReturnStatus;
  returnOtp?: string;
  returnOtpExpiry?: Date;
  returnOtpVerified?: boolean;
  serviceCharge?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
