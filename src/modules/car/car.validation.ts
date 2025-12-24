import { z } from "zod";
import { FuelType, GearType } from "./car.enum";

const specificationSchema = z.object({
  maxPower: z.string().min(1, "Max power is required"),
  fuelEconomy: z.string().min(1, "Fuel economy is required"),
  maxSpeed: z.string().min(1, "Max speed is required"),
  zeroToSixty: z.string().min(1, "0-60mph time is required"),
});

const featureSchema = z.object({
  model: z.string().min(1, "Model is required"),
  capacity: z.string().min(1, "Capacity is required"),
  color: z.string().min(1, "Color is required"),

  fuelType: z.enum([
    FuelType.PETROL,
    FuelType.DIESEL,
    FuelType.HYBRID,
    FuelType.ELECTRIC,
  ]),

  gearType: z.enum([GearType.MANUAL, GearType.AUTOMATIC]),

  seat: z.number().min(1, "Seat must be at least 1"),
});

const createCarValidationSchema = z.object({
  carName: z.string().min(1, "Car name is required"),
  specification: specificationSchema,
  features: featureSchema,
});

export const updateCarValidationSchema = createCarValidationSchema.partial();

export const carValidation = {
  createCarValidationSchema,
  updateCarValidationSchema,
};
