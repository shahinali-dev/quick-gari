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
  totalPrice?: number; // Payment amount
  payment?: Types.ObjectId; // Reference to Payment document
  status: BookingStatus;
  bookingOtp?: string;
  bookingOtpExpiry?: Date;
  bookingOtpVerified?: boolean;
  serviceCharge?: number;
  journeyStartedAt?: Date;
  cancelledAt?: Date | null;
  driverPayoutCompleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
