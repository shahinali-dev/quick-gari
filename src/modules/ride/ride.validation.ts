import { z } from "zod";

const rideValidationSchema = z.object({
  startLocation: z.string().min(1, "Start location is required"),
  endLocation: z.string().min(1, "End location is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
});

const acceptRideValidationSchema = z.object({
  rideId: z.string().min(1, "Ride ID is required"),
  driverId: z.string().min(1, "Driver ID is required"),
  fare: z.string().min(1, "Fare is required"),
});

export const rideValidation = {
  rideValidationSchema,
  acceptRideValidationSchema,
};

export type ICreateRidePayload = z.infer<typeof rideValidationSchema>;
export type IAcceptRidePayload = z.infer<typeof acceptRideValidationSchema>;
