/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";

export interface INotification {
  userId: Types.ObjectId;
  audience: "user" | "admin" | "car_owner";
  type: string;
  message: string;
  rideId?: Types.ObjectId;
  returnRideId?: Types.ObjectId;
  carId?: Types.ObjectId;
  paymentId?: Types.ObjectId;
  proposalId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
