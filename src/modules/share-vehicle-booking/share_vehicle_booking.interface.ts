/* eslint-disable no-unused-vars */
import { Types } from "mongoose";

export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

export interface IPassenger {
  userId: Types.ObjectId;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface IShareVehicleBooking {
  _id?: Types.ObjectId;
  shareVehicle: Types.ObjectId;
  passenger: IPassenger;
  pickupStop: string;
  dropStop: string;
  seatsBooked: number;
  perSeatFare: number;
  totalFare: number;
  status: BookingStatus;
  cancelledAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
