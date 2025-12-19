import { Types } from "mongoose";
import { IUser } from "../user/user.interface";
import { FuelType, GearType } from "./car.enum";

export interface ISpecification {
  maxPower: string;
  fuelEconomy: string;
  maxSpeed: string;
  zeroToSixty: string;
}

export interface IFeature {
  model: string;
  capacity: string;
  color: string;
  fuelType: FuelType;
  gearType: GearType;
  images: string[];
  seat: number; // <-- NEW
}

export interface ICar {
  carName: string;
  specification: ISpecification;
  features: IFeature;
  user: string | Types.ObjectId | IUser;
  createdAt?: Date;
  updatedAt?: Date;
}
