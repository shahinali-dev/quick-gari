import { z } from "zod";

const shareVehicleValidationSchema = z.object({
  journeyDate: z.string().min(1, "Journey date is required"),
  stops: z
    .array(
      z.object({
        location: z.string().min(1, "Stop location is required"),
        arrivalTime: z.string().min(1, "Arrival time is required"),
        order: z.number().min(0, "Order must be a non-negative integer"),
        perSeatFare: z
          .number()
          .min(0, "Per seat fare must be a non-negative number"),
      }),
    )
    .min(2, "At least 2 stops are required (origin and destination)"),
});

export const shareVehicleValidation = {
  shareVehicleValidationSchema,
};

export type ICreateShareVehicle = z.infer<typeof shareVehicleValidationSchema>;
