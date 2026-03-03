/* eslint-disable no-unused-vars */
import { Types } from "mongoose";

export enum ShareVehicleStatus {
  SCHEDULED = "scheduled",
  ONGOING = "ongoing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum BookingStatus {
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
}

export interface IStop {
  location: string;
  arrivalTime: string;
  order: number;
  perSeatFare: number;
}

export interface IVehicle {
  carName: string;
  seatCapacity: number;
  images: string[];
  driverName: string;
}

export interface IShareVehicle {
  _id?: Types.ObjectId;
  carOwner: Types.ObjectId;
  vehicle: IVehicle;
  journeyDate: Date;
  stops: IStop[];
  availableSeats: number;
  status: ShareVehicleStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPassenger {
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
  totalPaid: number;
  status: BookingStatus;
  cancelledAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}
