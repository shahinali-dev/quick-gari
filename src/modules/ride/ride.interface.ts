import { Types } from "mongoose";
import { ICar } from "../car/car.interface";
import { IUser } from "../user/user.interface";
import { PaymentStatus, RideStatus } from "./ride.enum";

export interface IPayment {
  _id?: Types.ObjectId;
  transactionId: string;
  amount: number;
  paymentMethod: string; // bkash
  status: PaymentStatus;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
}

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
  payment?: IPayment;
  status: RideStatus;
  rideOtp?: string;
  rideOtpExpiry?: Date;
  rideOtpVerified?: boolean;
  serviceCharge?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRideProposal {
  _id?: Types.ObjectId;
  driver: Types.ObjectId | IUser;
  car: Types.ObjectId | ICar;
  fare: number;
  createdAt: Date;
}
