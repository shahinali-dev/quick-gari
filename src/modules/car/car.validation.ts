import { z } from "zod";
import { FuelType, GearType, vehicleType } from "./car.enum";

const vehicleRegistrationSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  registration: z
    .number()
    .min(1900, "Registration year must be at least 1900")
    .max(new Date().getFullYear(), "Registration year cannot be in the future"),
});

const featureSchema = z.object({
  vehicleType: z.enum(Object.values(vehicleType) as [string, ...string[]], {
    errorMap: () => ({ message: "Invalid vehicle type" }),
  }),
  model: z.string().min(1, "Model is required"),
  brand: z.string().min(1, "Brand is required"),
  fuelType: z.enum([
    FuelType.PETROL,
    FuelType.DIESEL,
    FuelType.HYBRID,
    FuelType.ELECTRIC,
  ]),
  gearType: z.enum([GearType.MANUAL, GearType.AUTOMATIC]),
  seatCapacity: z.number().min(1, "Seat capacity must be at least 1"),
  manufactureYear: z
    .number()
    .min(1900, "Manufacture year must be at least 1900")
    .max(new Date().getFullYear(), "Manufacture year cannot be in the future"),
});

const createCarValidationSchema = z.object({
  carName: z.string().min(1, "Car name is required").trim(),
  features: featureSchema,
  vehicleRegistration: vehicleRegistrationSchema,
});

export const updateCarValidationSchema = createCarValidationSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const carValidation = {
  createCarValidationSchema,
  updateCarValidationSchema,
};
