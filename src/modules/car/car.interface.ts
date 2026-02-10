import { Types } from "mongoose";
import { IUser } from "../user/user.interface";
import { FuelType, GearType, vehicleType } from "./car.enum";

export interface IVehicleRegistration {
  registrationNumber: string;
  registration: number;
  taxTokenPhoto: string;
  registrationCardPhoto: string;
}

export interface IFeature {
  vehicleType: vehicleType;
  model: string;
  brand: string;
  fuelType: FuelType;
  gearType: GearType;
  images: string[];
  seatCapacity: number;
  manufactureYear: number;
}

export interface ICar {
  _id?: string;
  carName: string;
  features: IFeature;
  vehicleRegistration: IVehicleRegistration;
  drivingLicensePhoto: string;
  user: string | Types.ObjectId | IUser;
  isApproved?: boolean;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateCarPayload {
  carName: string;
  features: Omit<IFeature, "images">;
  vehicleRegistration: Omit<
    IVehicleRegistration,
    "taxTokenPhoto" | "registrationCardPhoto"
  >;
}
