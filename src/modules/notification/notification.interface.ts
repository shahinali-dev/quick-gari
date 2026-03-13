/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { NotificationType } from "./notification.model";

export interface INotification {
  userId: Types.ObjectId;
  audience: "user" | "admin";
  type: NotificationType;
  message: string;
  rideId?: Types.ObjectId;
  carId?: Types.ObjectId;
  paymentId?: Types.ObjectId;
  metadata?: any;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
